import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, MapPin, PackagePlus, Plus, Store, Warehouse as WarehouseIcon } from "lucide-react";
import { adminWarehousesApi, usersApi } from "@/api/admin";
import { productsApi } from "@/api/products";
import { inventoryApi } from "@/api/seller";
import type { Warehouse, WarehouseType } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/PageLoader";
import { Pagination } from "@/components/ui/Pagination";
import { Segmented } from "@/components/ui/Segmented";
import { useCurrentUser } from "@/auth/AuthContext";
import { Confirm } from "@/features/admin/Confirm";
import { useIsSupervisor, useUsersById } from "@/features/admin/hooks";
import { useProductsById } from "@/features/buyer/hooks";
import { useAllWarehouses } from "@/features/logistics/hooks";
import { InventoryList } from "@/features/seller/InventoryList";
import { StockForm } from "@/features/seller/StockForm";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { shortId } from "@/lib/format";

const PAGE_SIZE = 10;
type View = "existencias" | "bodegas";

const TYPE_INFO: Record<WarehouseType, { label: string; icon: typeof Store }> = {
  MARKETPLACE: { label: "Marketplace", icon: WarehouseIcon },
  SELLER: { label: "De vendedor", icon: Store },
};

// Primer ingreso de un producto en una bodega: el operador elige entre los productos publicados
function InboundCard({ warehouses, onClose }: { warehouses: Warehouse[]; onClose: () => void }) {
  const catalog = useQuery({
    queryKey: ["products", "published-all"],
    queryFn: ({ signal }) => productsApi.search({ pageSize: 100, sort: "name_asc" }, signal),
  });
  return (
    <Card className="p-5">
      <h2 className="mb-3 font-semibold">Ingreso de mercancía</h2>
      {catalog.error ? (
        <Alert tone="error">{errorMessage(catalog.error)}</Alert>
      ) : catalog.isPending ? (
        <PageLoader />
      ) : (
        <StockForm
          mode="inbound"
          products={catalog.data.items}
          warehouses={warehouses}
          // Una bodega de vendedor solo guarda productos de ese vendedor; las del marketplace, de cualquiera
          productFitsWarehouse={(product, warehouse) => warehouse.type === "MARKETPLACE" || warehouse.sellerId === product.sellerId}
          onDone={onClose}
          onCancel={onClose}
        />
      )}
    </Card>
  );
}

function StockView({ warehouses }: { warehouses: Warehouse[] }) {
  const readOnly = useIsSupervisor();
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const warehouseId = warehouses.find((warehouse) => warehouse.id === params.get("bodega"))?.id;
  const page = Math.max(1, Number(params.get("pagina")) || 1);

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["inventory", { warehouseId, page }],
    queryFn: ({ signal }) => inventoryApi.list({ warehouseId, page, pageSize: PAGE_SIZE }, signal),
    placeholderData: keepPreviousData,
  });
  const { products } = useProductsById(data?.items.map((item) => item.productId) ?? []);

  const setParam = (key: string, value: string | undefined) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "pagina") next.delete("pagina");
        return next;
      },
      { replace: true },
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:w-80">
          <Select
            label="Bodega"
            value={warehouseId ?? ""}
            onChange={(event) => setParam("bodega", event.target.value || undefined)}
            options={[
              { value: "", label: "Todas las bodegas" },
              ...warehouses.map((warehouse) => ({
                value: warehouse.id,
                label: `${warehouse.location} (${TYPE_INFO[warehouse.type].label})`,
              })),
            ]}
          />
        </div>
        {!adding && !readOnly && (
          <Button icon={<PackagePlus className="size-4" />} onClick={() => setAdding(true)}>
            Registrar ingreso
          </Button>
        )}
      </div>

      {adding && (
        <InboundCard
          warehouses={warehouseId ? warehouses.filter((warehouse) => warehouse.id === warehouseId) : warehouses}
          onClose={() => setAdding(false)}
        />
      )}

      {error ? (
        <Alert tone="error">{errorMessage(error, "No se pudo cargar el inventario.")}</Alert>
      ) : isPending ? (
        <PageLoader />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<Boxes className="size-6" />}
          title="Sin existencias registradas"
          description="Registra un ingreso de mercancía en esta bodega."
        />
      ) : (
        <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
          <InventoryList
            items={data.items}
            products={products}
            warehouses={new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]))}
            productHref={(id) => `/catalogo/${id}`}
            readOnly={readOnly}
          />
          <div className="pt-4">
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              onChange={(next) => {
                setParam("pagina", next > 1 ? String(next) : undefined);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Vendedores para los selectores del administrador (backend: máximo 100 por página)
function useSellerUsers() {
  return useQuery({
    queryKey: ["users", { role: "SELLER", pageSize: 100 }],
    queryFn: ({ signal }) => usersApi.list({ role: "SELLER", pageSize: 100 }, signal),
    select: (page) => page.items,
  });
}

// Administrador: bodegas del marketplace o de un vendedor
function NewWarehouseCard({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const sellers = useSellerUsers();
  const [type, setType] = useState<WarehouseType>("MARKETPLACE");
  const [location, setLocation] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [error, setError] = useState<string | undefined>();
  const owner = sellerId || sellers.data?.[0]?.id || "";
  const create = useMutation({
    mutationFn: () => adminWarehousesApi.create({ type, location: location.trim(), ...(type === "SELLER" ? { sellerId: owner } : {}) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      onClose();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!location.trim()) {
      setError("Escribe la ubicación de la bodega.");
      return;
    }
    setError(undefined);
    create.mutate();
  };

  return (
    <Card className="p-5">
      <h2 className="mb-3 font-semibold">Nueva bodega</h2>
      <form onSubmit={submit} noValidate className="space-y-3">
        <Segmented<WarehouseType>
          label="Tipo de bodega"
          value={type}
          onChange={setType}
          options={[
            { value: "MARKETPLACE", label: "Del marketplace" },
            { value: "SELLER", label: "De un vendedor" },
          ]}
        />
        <p className="text-xs text-muted">
          {type === "MARKETPLACE" ? "Recibe productos de cualquier vendedor." : "Solo guarda productos del vendedor dueño."}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Ubicación"
            placeholder="Ciudad o dirección"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            error={error}
          />
          {type === "SELLER" &&
            (sellers.isPending ? (
              <PageLoader />
            ) : (sellers.data ?? []).length === 0 ? (
              <Alert tone="info">No hay usuarios con rol vendedor.</Alert>
            ) : (
              <Select
                label="Vendedor"
                value={owner}
                onChange={(event) => setSellerId(event.target.value)}
                options={(sellers.data ?? []).map((user) => ({ value: user.id, label: user.fullName }))}
              />
            ))}
        </div>
        {create.error && <Alert tone="error">{errorMessage(create.error, "No se pudo crear la bodega.")}</Alert>}
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" loading={create.isPending} disabled={type === "SELLER" && !owner}>
            Crear bodega
          </Button>
        </div>
      </form>
    </Card>
  );
}

// Administrador: pasar una bodega de vendedor a otro vendedor (sus existencias se quedan en la bodega)
function Reassign({ warehouse, onClose }: { warehouse: Warehouse; onClose: () => void }) {
  const queryClient = useQueryClient();
  const sellers = useSellerUsers();
  const options = (sellers.data ?? []).filter((user) => user.id !== warehouse.sellerId);
  const [sellerId, setSellerId] = useState("");
  const target = sellerId || options[0]?.id || "";
  const link = useMutation({
    mutationFn: () => adminWarehousesApi.linkToSeller(warehouse.id, target),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      onClose();
    },
  });
  if (sellers.isPending) return <PageLoader />;
  if (options.length === 0) {
    return (
      <div className="space-y-2">
        <Alert tone="info">No hay otro vendedor al que pasarla.</Alert>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Select
        label="Nuevo dueño"
        value={target}
        onChange={(event) => setSellerId(event.target.value)}
        options={options.map((user) => ({ value: user.id, label: user.fullName }))}
      />
      <Confirm confirmLabel="Sí, reasignar" loading={link.isPending} error={link.error} onConfirm={() => link.mutate()} onCancel={onClose}>
        La bodega pasa al vendedor elegido y desde ahí solo recibirá productos suyos. Lo que ya tenga guardado no cambia de dueño: úsalo
        para bodegas vacías o mal asignadas.
      </Confirm>
    </div>
  );
}

function WarehousesView({ warehouses }: { warehouses: Warehouse[] }) {
  const role = useCurrentUser().role;
  const isAdmin = role === "ADMIN";
  const [, setParams] = useSearchParams();
  const [type, setType] = useState<WarehouseType | "ALL">("ALL");
  const [creating, setCreating] = useState(false);
  const [reassigning, setReassigning] = useState<string | null>(null);
  const shown = type === "ALL" ? warehouses : warehouses.filter((warehouse) => warehouse.type === type);
  // El operador logístico no puede consultar usuarios: el administrador y el supervisor ven el nombre del dueño
  const owners = useUsersById(
    isAdmin || role === "SUPERVISOR" ? warehouses.flatMap((warehouse) => (warehouse.sellerId ? [warehouse.sellerId] : [])) : [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented<WarehouseType | "ALL">
          label="Filtrar por tipo"
          value={type}
          onChange={setType}
          options={[
            { value: "ALL", label: "Todas" },
            { value: "MARKETPLACE", label: "Marketplace" },
            { value: "SELLER", label: "De vendedores" },
          ]}
        />
        {isAdmin && !creating && (
          <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            Nueva bodega
          </Button>
        )}
      </div>
      {creating && <NewWarehouseCard onClose={() => setCreating(false)} />}
      {shown.length === 0 ? (
        <EmptyState icon={<WarehouseIcon className="size-6" />} title="No hay bodegas de este tipo" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((warehouse) => {
            const Icon = TYPE_INFO[warehouse.type].icon;
            const owner = warehouse.sellerId ? owners.get(warehouse.sellerId) : undefined;
            return (
              <Card key={warehouse.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-fg">
                    <MapPin className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">{warehouse.location}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      <Badge>
                        <Icon className="size-3" /> {TYPE_INFO[warehouse.type].label}
                      </Badge>
                      {owner ? owner.fullName : warehouse.type === "SELLER" ? `Vendedor ${shortId(warehouse.sellerId ?? "")}` : null}
                    </p>
                  </div>
                </div>
                {reassigning === warehouse.id ? (
                  <Reassign warehouse={warehouse} onClose={() => setReassigning(null)} />
                ) : (
                  <div className="mt-auto flex justify-end gap-2">
                    {isAdmin && warehouse.type === "SELLER" && (
                      <Button size="sm" variant="ghost" onClick={() => setReassigning(warehouse.id)}>
                        Reasignar
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => setParams({ bodega: warehouse.id }, { replace: true })}>
                      Ver existencias
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Operador logístico y administrador (el administrador además crea y reasigna bodegas)
export function LogisticsInventoryPage() {
  const role = useCurrentUser().role;
  const isAdmin = role === "ADMIN";
  const [params, setParams] = useSearchParams();
  const view: View = params.get("vista") === "bodegas" ? "bodegas" : "existencias";
  const warehouses = useAllWarehouses();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description={
          isAdmin
            ? "Existencias en todas las bodegas. Crea bodegas del marketplace o de vendedores y reasígnalas."
            : role === "SUPERVISOR"
              ? "Consulta de existencias en todas las bodegas del marketplace y de los vendedores."
              : "Existencias en todas las bodegas del marketplace y de los vendedores."
        }
        actions={
          <Segmented<View>
            label="Vista"
            value={view}
            onChange={(next) => setParams(next === "bodegas" ? { vista: "bodegas" } : {}, { replace: true })}
            options={[
              { value: "existencias", label: "Existencias" },
              { value: "bodegas", label: "Bodegas" },
            ]}
          />
        }
      />
      {warehouses.error ? (
        <Alert tone="error">{errorMessage(warehouses.error)}</Alert>
      ) : warehouses.isPending ? (
        <PageLoader />
      ) : view === "bodegas" ? (
        <WarehousesView warehouses={warehouses.data} />
      ) : (
        <StockView warehouses={warehouses.data} />
      )}
    </div>
  );
}
