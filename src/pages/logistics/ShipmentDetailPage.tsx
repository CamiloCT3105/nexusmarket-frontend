import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, History, Package, Truck } from "lucide-react";
import { ordersApi, shipmentsApi } from "@/api/orders";
import type { Shipment } from "@/api/types";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/PageLoader";
import { useProductsById } from "@/features/buyer/hooks";
import { ProductArt } from "@/features/catalog/ProductArt";
import { useIsSupervisor } from "@/features/admin/hooks";
import { useAllWarehouses } from "@/features/logistics/hooks";
import { ORDER_STATUS, SHIPMENT_NEXT, SHIPMENT_STATUS, SHIPMENT_STEPS } from "@/features/orders/labels";
import { ShipmentTimeline } from "@/features/orders/ShipmentTimeline";
import { ShippingAddressCard } from "@/features/orders/ShippingAddressCard";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, shortId } from "@/lib/format";

function ShipmentProgress({ shipment }: { shipment: Shipment }) {
  const current = SHIPMENT_STEPS.indexOf(shipment.status);
  const finished = shipment.status === "DELIVERED";
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Progreso del envío">
      {SHIPMENT_STEPS.map((step, index) => {
        const done = index < current || finished;
        const active = index === current && !finished;
        return (
          <li key={step} className="flex flex-col gap-2" aria-current={active ? "step" : undefined}>
            <div className={cn("h-1.5 rounded-full", finished ? "bg-accent" : done || active ? "bg-brand" : "bg-surface-2")} />
            <span className={cn("flex items-center gap-1 text-xs sm:text-sm", done || active ? "font-medium text-fg" : "text-muted")}>
              {done && <Check className="size-3.5 shrink-0" />}
              {SHIPMENT_STATUS[step].label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Avanza el envío al siguiente estado con una nota opcional. Ambos pasos son irreversibles: se confirma.
function AdvanceCard({ shipment }: { shipment: Shipment }) {
  const queryClient = useQueryClient();
  const next = SHIPMENT_NEXT[shipment.status];
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const advance = useMutation({
    mutationFn: () => shipmentsApi.updateStatus(shipment.id, next?.status ?? shipment.status, note.trim()),
    onSuccess: (updated) => {
      queryClient.setQueryData(["shipment", shipment.id], updated);
      queryClient.setQueryData(["shipment", "order", shipment.orderId], updated);
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["order", shipment.orderId] });
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setNote("");
      setConfirming(false);
    },
  });

  if (!next) {
    return (
      <Card className="p-5">
        <Alert tone="success">Entregado. El envío y el pedido quedaron cerrados.</Alert>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-fg">
          <Truck className="size-4" />
        </span>
        <h2 className="font-semibold">Siguiente paso: {SHIPMENT_STATUS[next.status].label.toLowerCase()}</h2>
      </div>
      <p className="text-sm text-muted">{next.help}</p>
      <Textarea
        label="Nota para el seguimiento"
        hint="Opcional. El comprador la verá en el historial del envío."
        placeholder={next.status === "IN_TRANSIT" ? "Salió en la ruta de la mañana" : "Recibido por el comprador en portería"}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={200}
        className="min-h-20"
      />
      {advance.error && <Alert tone="error">{errorMessage(advance.error, "No se pudo actualizar el envío.")}</Alert>}
      {confirming ? (
        <div className="space-y-2 rounded-xl bg-surface-2/60 p-3 text-sm">
          <p>
            ¿{next.action} el envío <span className="font-mono">{shipment.trackingCode}</span>?{" "}
            <span className="text-muted">No se puede deshacer.</span>
          </p>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" disabled={advance.isPending} onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button size="sm" loading={advance.isPending} onClick={() => advance.mutate()}>
              Sí, {next.action.toLowerCase()}
            </Button>
          </div>
        </div>
      ) : (
        <Button className="w-full" onClick={() => setConfirming(true)}>
          {next.action}
        </Button>
      )}
    </Card>
  );
}

export function ShipmentDetailPage() {
  const readOnly = useIsSupervisor();
  const { id = "" } = useParams();
  const location = useLocation();
  const created = (location.state as { created?: boolean } | null)?.created === true;
  const shipment = useQuery({ queryKey: ["shipment", id], queryFn: ({ signal }) => shipmentsApi.get(id, signal) });
  const orderId = shipment.data?.orderId;
  const order = useQuery({
    queryKey: ["order", orderId],
    enabled: Boolean(orderId),
    queryFn: ({ signal }) => ordersApi.get(orderId ?? "", signal),
  });
  const warehouses = useAllWarehouses();
  const { products } = useProductsById(order.data?.items.map((item) => item.productId) ?? []);
  const locations = new Map((warehouses.data ?? []).map((warehouse) => [warehouse.id, warehouse.location]));

  const back = (
    <Link to="/envios" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Envíos
    </Link>
  );

  if (shipment.isPending || (orderId && order.isPending)) return <PageLoader />;
  const error = shipment.error ?? order.error;
  if (error || !shipment.data || !order.data) {
    return (
      <div className="space-y-4">
        {back}
        <Alert tone="error">{errorMessage(error, "No se pudo cargar el envío.")}</Alert>
      </div>
    );
  }

  const data = shipment.data;
  const orderData = order.data;
  return (
    <div className="space-y-6">
      {back}
      {created && data.status === "PREPARING" && (
        <Alert tone="success">Envío creado con la guía {data.trackingCode}. Cuando salga de bodega, márcalo como despachado.</Alert>
      )}

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-3xl font-semibold">{data.trackingCode}</h1>
          <Badge tone={SHIPMENT_STATUS[data.status].tone}>{SHIPMENT_STATUS[data.status].label}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted">
          Pedido #{shortId(orderData.id)} · <Badge tone={ORDER_STATUS[orderData.status].tone}>{ORDER_STATUS[orderData.status].label}</Badge>
        </p>
      </div>

      <Card className="p-5">
        <ShipmentProgress shipment={data} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 border-b border-border p-4">
              <Package className="size-4 text-brand-fg" />
              <h2 className="font-semibold">Contenido y bodega de origen</h2>
            </div>
            <div className="divide-y divide-border">
              {orderData.items.map((item) => {
                const product = products.get(item.productId);
                return (
                  <div key={item.productId} className="flex items-center gap-3 p-4">
                    {product ? (
                      <ProductArt
                        id={product.id}
                        type={product.type}
                        name={product.name}
                        imageUrl={product.imageUrl}
                        className="size-12 shrink-0 rounded-xl"
                      />
                    ) : (
                      <div className="size-12 shrink-0 animate-pulse rounded-xl bg-surface-2" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-medium">{product?.name ?? `Producto ${shortId(item.productId)}`}</p>
                      <p className="text-sm text-muted">{locations.get(item.warehouseId) ?? `Bodega ${shortId(item.warehouseId)}`}</p>
                    </div>
                    <p className="font-display text-lg font-semibold tabular-nums">× {item.quantity}</p>
                  </div>
                );
              })}
            </div>
            <p className="border-t border-border p-4 text-xs text-muted">Pedido realizado el {formatDateTime(orderData.createdAt)}</p>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <History className="size-4 text-brand-fg" />
              <h2 className="font-semibold">Historial</h2>
            </div>
            <div className="text-sm">
              <ShipmentTimeline events={data.events} />
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <ShippingAddressCard address={orderData.shippingAddress} title="Entregar en" />
          {readOnly ? (
            <Card className="p-5 text-sm">
              <p className="font-semibold">Estado: {SHIPMENT_STATUS[data.status].label}</p>
              <p className="mt-1 text-muted">{SHIPMENT_NEXT[data.status]?.help ?? "Envío entregado y cerrado."}</p>
            </Card>
          ) : (
            <AdvanceCard shipment={data} />
          )}
        </div>
      </div>
    </div>
  );
}
