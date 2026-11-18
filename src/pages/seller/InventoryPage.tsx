import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, MapPin, PackagePlus, Plus, Warehouse as WarehouseIcon } from "lucide-react";
import { inventoryApi, warehousesApi } from "@/api/seller";
import type { Product, Warehouse } from "@/api/types";
import { useCurrentUser } from "@/auth/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/PageLoader";
import { Pagination } from "@/components/ui/Pagination";
import { Segmented } from "@/components/ui/Segmented";
import { myWarehousesKey, useMyProducts, useMyWarehouses, useSellerProfile } from "@/features/seller/hooks";
import { InventoryList } from "@/features/seller/InventoryList";
import { SellerRequired } from "@/features/seller/SellerRequired";
import { StockForm } from "@/features/seller/StockForm";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { shortId } from "@/lib/format";

const PAGE_SIZE = 10;
type View = "existencias" | "bodegas";

function StockView({ warehouses, products }: { warehouses: Warehouse[]; products: Product[] }) {
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const warehouseId = warehouses.find((warehouse) => warehouse.id === params.get("bodega"))?.id;
  const page = Math.max(1, Number(params.get("pagina")) || 1);

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["inventory", { warehouseId, page }],
    queryFn: ({ signal }) => inventoryApi.list({ warehouseId, page, pageSize: PAGE_SIZE }, signal),
    placeholderData: keepPreviousData,
  });

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

  if (warehouses.length === 0) {
    return (
      <EmptyState
        icon={<WarehouseIcon className="size-6" />}
        title="Primero crea una bodega"
        description="Las existencias se registran por bodega."
        action={<Button onClick={() => setParam("vista", "bodegas")}>Crear bodega</Button>}
      />
    );
  }
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Boxes className="size-6" />}
        title="Aún no tienes productos"
        description="Crea un producto para registrar su inventario."
        action={
          <Link to="/productos/nuevo">
            <Button>Nuevo producto</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:w-72">
          <Select
            label="Bodega"
            value={warehouseId ?? ""}
            onChange={(event) => setParam("bodega", event.target.value || undefined)}
            options={[
              { value: "", label: "Todas mis bodegas" },
              ...warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.location })),
            ]}
          />
        </div>
        {!adding && (
          <Button icon={<PackagePlus className="size-4" />} onClick={() => setAdding(true)}>
            Registrar ingreso
          </Button>
        )}
      </div>

      {adding && (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Ingreso de mercancía</h2>
          <StockForm
            mode="inbound"
            products={products}
            warehouses={warehouseId ? warehouses.filter((warehouse) => warehouse.id === warehouseId) : warehouses}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </Card>
      )}

      {error ? (
        <Alert tone="error">{errorMessage(error, "No se pudo cargar el inventario.")}</Alert>
      ) : isPending ? (
        <PageLoader />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<Boxes className="size-6" />}
          title="Sin existencias registradas"
          description="Registra un ingreso de mercancía para que tus productos se puedan comprar."
        />
      ) : (
        <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
          <InventoryList
            items={data.items}
            products={new Map(products.map((product) => [product.id, product]))}
            warehouses={new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]))}
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

function WarehousesView({ warehouses }: { warehouses: Warehouse[] }) {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const [, setParams] = useSearchParams();
  const [open, setOpen] = useState(warehouses.length === 0);
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | undefined>();

  const create = useMutation({
    mutationFn: () => warehousesApi.createOwn(location.trim()),
    onSuccess: (warehouse) => {
      queryClient.setQueryData<Warehouse[]>(myWarehousesKey(user.id), (current) => [...(current ?? []), warehouse]);
      void queryClient.invalidateQueries({ queryKey: ["seller", user.id] });
      setLocation("");
      setOpen(false);
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!location.trim()) {
      setError("La ubicación es obligatoria.");
      return;
    }
    setError(undefined);
    create.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!open && (
          <Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
            Nueva bodega
          </Button>
        )}
      </div>

      {open && (
        <Card className="p-5">
          <form onSubmit={submit} noValidate className="space-y-3">
            <h2 className="font-semibold">Nueva bodega</h2>
            <Input
              label="Ubicación"
              placeholder="Ciudad - zona o dirección"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              error={error}
              maxLength={120}
              autoFocus
            />
            {create.error && <Alert tone="error">{errorMessage(create.error, "No se pudo crear la bodega.")}</Alert>}
            <div className="flex justify-end gap-2">
              {warehouses.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" size="sm" loading={create.isPending}>
                Crear bodega
              </Button>
            </div>
          </form>
        </Card>
      )}

      {warehouses.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-fg">
                  <MapPin className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{warehouse.location}</p>
                  <p className="text-xs text-muted">Bodega propia · {shortId(warehouse.id)}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="self-end"
                onClick={() => setParams({ bodega: warehouse.id }, { replace: true })}
              >
                Ver existencias
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function InventoryPage() {
  const [params, setParams] = useSearchParams();
  const view: View = params.get("vista") === "bodegas" ? "bodegas" : "existencias";
  const seller = useSellerProfile();
  const warehouses = useMyWarehouses();
  const products = useMyProducts();

  if (seller.isPending) return <PageLoader />;
  if (!seller.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Inventario" />
        {seller.error ? <Alert tone="error">{errorMessage(seller.error)}</Alert> : <SellerRequired />}
      </div>
    );
  }

  const error = warehouses.error ?? products.error;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Existencias de tus productos en cada bodega. Las reservadas corresponden a pedidos sin despachar."
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
      {error ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : warehouses.isPending || products.isPending ? (
        <PageLoader />
      ) : view === "bodegas" ? (
        <WarehousesView warehouses={warehouses.data ?? []} />
      ) : (
        <StockView warehouses={warehouses.data ?? []} products={products.data ?? []} />
      )}
    </div>
  );
}
