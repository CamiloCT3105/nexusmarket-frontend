import { Link, useNavigate, useSearchParams } from "react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, PackageCheck, Truck } from "lucide-react";
import { ordersApi, shipmentsApi } from "@/api/orders";
import type { Order, ShipmentStatus } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/PageLoader";
import { Pagination } from "@/components/ui/Pagination";
import { Segmented } from "@/components/ui/Segmented";
import { Spinner } from "@/components/ui/Spinner";
import { useProductsById } from "@/features/buyer/hooks";
import { useAllWarehouses } from "@/features/logistics/hooks";
import { SHIPMENT_STATUS, SHIPMENT_STEPS } from "@/features/orders/labels";
import { cn } from "@/lib/cn";
import { errorMessage, notFoundAsNull } from "@/lib/errors";
import { formatDateTime, shortId } from "@/lib/format";

const PAGE_SIZE = 10;
type View = "pagados" | ShipmentStatus | "todos";

function usePage(params: URLSearchParams, setParams: ReturnType<typeof useSearchParams>[1]) {
  const page = Math.max(1, Number(params.get("pagina")) || 1);
  const setPage = (next: number) => {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        if (next > 1) updated.set("pagina", String(next));
        else updated.delete("pagina");
        return updated;
      },
      { replace: true }
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return [page, setPage] as const;
}

// Pedido pagado: si aún no tiene envío, se crea desde aquí; si ya lo tiene, se enlaza
function PaidOrderCard({ order, names, locations }: { order: Order; names: Map<string, string>; locations: Map<string, string> }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shipment = useQuery({
    queryKey: ["shipment", "order", order.id],
    queryFn: ({ signal }) => notFoundAsNull(shipmentsApi.byOrder(order.id, signal)),
  });
  const create = useMutation({
    mutationFn: () => shipmentsApi.create(order.id),
    onSuccess: (created) => {
      queryClient.setQueryData(["shipment", "order", order.id], created);
      queryClient.setQueryData(["shipment", created.id], created);
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
      navigate(`/envios/${created.id}`, { state: { created: true } });
    },
  });
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const origins = [...new Set(order.items.map((item) => locations.get(item.warehouseId) ?? `Bodega ${shortId(item.warehouseId)}`))];

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-semibold">Pedido #{shortId(order.id)}</span>
            {shipment.data && <Badge tone={SHIPMENT_STATUS[shipment.data.status].tone}>Envío creado</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted">
            Pagado · realizado el {formatDateTime(order.createdAt)} · {units} {units === 1 ? "unidad" : "unidades"}
          </p>
          <ul className="mt-2 space-y-0.5 text-sm">
            {order.items.map((item) => (
              <li key={item.productId} className="truncate">
                <span className="tabular-nums">{item.quantity} ×</span> {names.get(item.productId) ?? `Producto ${shortId(item.productId)}`}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Sale de: {origins.join(" · ")}</p>
        </div>
        <div className="shrink-0 sm:text-right">
          {shipment.isPending ? (
            <Spinner className="size-5 text-brand-fg" />
          ) : shipment.data ? (
            <Link to={`/envios/${shipment.data.id}`} className="inline-flex items-center gap-1 text-sm text-brand-fg hover:underline">
              Guía <span className="font-mono">{shipment.data.trackingCode}</span> <ChevronRight className="size-4" />
            </Link>
          ) : (
            <Button icon={<Truck className="size-4" />} loading={create.isPending} onClick={() => create.mutate()}>
              Crear envío
            </Button>
          )}
        </div>
      </div>
      {(shipment.error ?? create.error) && (
        <Alert tone="error" className="mt-3">
          {errorMessage(shipment.error ?? create.error, "No se pudo crear el envío.")}
        </Alert>
      )}
    </Card>
  );
}

function PaidOrders() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = usePage(params, setParams);
  const warehouses = useAllWarehouses();
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["orders", { status: "PAID", page }],
    queryFn: ({ signal }) => ordersApi.list({ status: "PAID", page, pageSize: PAGE_SIZE }, signal),
    placeholderData: keepPreviousData,
  });
  const { products } = useProductsById(data?.items.flatMap((order) => order.items.map((item) => item.productId)) ?? []);
  const names = new Map([...products].map(([id, product]) => [id, product.name]));
  const locations = new Map((warehouses.data ?? []).map((warehouse) => [warehouse.id, warehouse.location]));

  if (error) return <Alert tone="error">{errorMessage(error, "No se pudieron cargar los pedidos.")}</Alert>;
  if (isPending) return <PageLoader />;
  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={<PackageCheck className="size-6" />}
        title="No hay pedidos pagados por despachar"
        description="Cuando un comprador pague un pedido, aparecerá aquí para crear su envío."
      />
    );
  }
  return (
    <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
      {data.items.map((order) => (
        <PaidOrderCard key={order.id} order={order} names={names} locations={locations} />
      ))}
      <div className="pt-4">
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={setPage} />
      </div>
    </div>
  );
}

function ShipmentList({ status }: { status: ShipmentStatus | undefined }) {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = usePage(params, setParams);
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["shipments", { status, page }],
    queryFn: ({ signal }) => shipmentsApi.list({ status, page, pageSize: PAGE_SIZE }, signal),
    placeholderData: keepPreviousData,
  });

  if (error) return <Alert tone="error">{errorMessage(error, "No se pudieron cargar los envíos.")}</Alert>;
  if (isPending) return <PageLoader />;
  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={<Truck className="size-6" />}
        title={status ? "No hay envíos en este estado" : "Aún no hay envíos"}
        description="Los envíos se crean desde la pestaña Pagados."
      />
    );
  }
  return (
    <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
      {data.items.map((shipment) => {
        const last = shipment.events[shipment.events.length - 1];
        return (
          <Link key={shipment.id} to={`/envios/${shipment.id}`} className="group block">
            <Card className="flex items-center gap-4 p-4 transition-colors group-hover:border-brand/50">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-fg">
                <Truck className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-semibold">{shipment.trackingCode}</span>
                  <Badge tone={SHIPMENT_STATUS[shipment.status].tone}>{SHIPMENT_STATUS[shipment.status].label}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">
                  Pedido #{shortId(shipment.orderId)}
                  {last && ` · ${formatDateTime(last.createdAt)}`}
                  {last?.note && ` · ${last.note}`}
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-fg" />
            </Card>
          </Link>
        );
      })}
      <div className="pt-4">
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={setPage} />
      </div>
    </div>
  );
}

export function ShipmentsPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("vista");
  const view: View = raw === "todos" ? "todos" : (SHIPMENT_STEPS.find((step) => step === raw) ?? "pagados");

  return (
    <div className="space-y-6">
      <PageHeader title="Envíos" description="Crea el envío de cada pedido pagado y actualiza su seguimiento hasta la entrega." />
      <Segmented<View>
        label="Vista"
        value={view}
        onChange={(next) => setParams(next === "pagados" ? {} : { vista: next }, { replace: true })}
        options={[
          { value: "pagados", label: "Pagados" },
          ...SHIPMENT_STEPS.map((step) => ({ value: step, label: step === "DELIVERED" ? "Entregados" : SHIPMENT_STATUS[step].label })),
          { value: "todos", label: "Todos" },
        ]}
      />
      {view === "pagados" ? <PaidOrders /> : <ShipmentList key={view} status={view === "todos" ? undefined : view} />}
    </div>
  );
}
