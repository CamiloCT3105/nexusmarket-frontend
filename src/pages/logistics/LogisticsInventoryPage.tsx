import { useState } from "react";
import { useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Boxes, MapPin, PackagePlus, Store, Warehouse as WarehouseIcon } from "lucide-react";
import { productsApi } from "@/api/products";
import { inventoryApi } from "@/api/seller";
import type { Warehouse, WarehouseType } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/PageLoader";
import { Pagination } from "@/components/ui/Pagination";
import { Segmented } from "@/components/ui/Segmented";
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
      { replace: true }
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
              ...warehouses.map((warehouse) => ({ value: warehouse.id, label: `${warehouse.location} (${TYPE_INFO[warehouse.type].label})` })),
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
        <EmptyState icon={<Boxes className="size-6" />} title="Sin existencias registradas" description="Registra un ingreso de mercancía en esta bodega." />
      ) : (
        <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
          <InventoryList
            items={data.items}
            products={products}
            warehouses={new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]))}
            productHref={(id) => `/catalogo/${id}`}
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
  const [, setParams] = useSearchParams();
  const [type, setType] = useState<WarehouseType | "ALL">("ALL");
  const shown = type === "ALL" ? warehouses : warehouses.filter((warehouse) => warehouse.type === type);

  return (
    <div className="space-y-4">
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
      {shown.length === 0 ? (
        <EmptyState icon={<WarehouseIcon className="size-6" />} title="No hay bodegas de este tipo" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((warehouse) => {
            const Icon = TYPE_INFO[warehouse.type].icon;
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
                      {shortId(warehouse.id)}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="self-end" onClick={() => setParams({ bodega: warehouse.id }, { replace: true })}>
                  Ver existencias
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LogisticsInventoryPage() {
  const [params, setParams] = useSearchParams();
  const view: View = params.get("vista") === "bodegas" ? "bodegas" : "existencias";
  const warehouses = useAllWarehouses();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Existencias en todas las bodegas del marketplace y de los vendedores."
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
