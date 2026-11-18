import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, FileText, RotateCcw, Truck, User as UserIcon } from "lucide-react";
import { adminInvoicesApi } from "@/api/admin";
import { invoicesApi, ordersApi, shipmentsApi } from "@/api/orders";
import { returnsApi } from "@/api/returns";
import type { Order } from "@/api/types";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/PageLoader";
import { Spinner } from "@/components/ui/Spinner";
import { useIsSupervisor, useUsersById } from "@/features/admin/hooks";
import { useProductsById } from "@/features/buyer/hooks";
import { ProductArt } from "@/features/catalog/ProductArt";
import { useAllWarehouses } from "@/features/logistics/hooks";
import { ORDER_STATUS, RETURN_STATUS, SHIPMENT_STATUS } from "@/features/orders/labels";
import { OrderProgress } from "@/features/orders/OrderProgress";
import { ShippingAddressCard } from "@/features/orders/ShippingAddressCard";
import { errorMessage, notFoundAsNull } from "@/lib/errors";
import { formatDateTime, formatMoney, shortId } from "@/lib/format";

function SideCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-fg">{icon}</span>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="text-sm">{children}</div>
    </Card>
  );
}

// La factura no se genera sola al pagar: la emite el administrador
function InvoiceCard({ order }: { order: Order }) {
  const readOnly = useIsSupervisor();
  const queryClient = useQueryClient();
  const invoice = useQuery({
    queryKey: ["invoice", "order", order.id],
    queryFn: ({ signal }) => notFoundAsNull(invoicesApi.byOrder(order.id, signal)),
  });
  const generate = useMutation({
    mutationFn: () => adminInvoicesApi.generate(order.id),
    onSuccess: (created) => {
      queryClient.setQueryData(["invoice", "order", order.id], created);
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  return (
    <SideCard icon={<FileText className="size-4" />} title="Factura">
      {invoice.error ? (
        <Alert tone="error">{errorMessage(invoice.error)}</Alert>
      ) : invoice.isPending ? (
        <Spinner className="size-5 text-brand-fg" />
      ) : invoice.data ? (
        <div className="space-y-2">
          <p>
            <Badge tone="success">Emitida</Badge> <span className="ml-1 text-muted">el {formatDateTime(invoice.data.issuedAt)}</span>
          </p>
          <Link to={`/facturas/${invoice.data.id}`} className="inline-flex items-center gap-1 text-brand-fg hover:underline">
            Ver factura #{shortId(invoice.data.id)} <ChevronRight className="size-4" />
          </Link>
        </div>
      ) : order.status === "PENDING_PAYMENT" ? (
        <p className="text-muted">Se podrá facturar cuando el comprador pague.</p>
      ) : readOnly ? (
        <p className="text-muted">Pagado y aún sin factura: la emite el administrador.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-muted">Este pedido aún no tiene factura. Al generarla, el comprador la verá en “Mis facturas”.</p>
          {generate.error && <Alert tone="error">{errorMessage(generate.error, "No se pudo generar la factura.")}</Alert>}
          <Button className="w-full" loading={generate.isPending} onClick={() => generate.mutate()}>
            Generar factura por {formatMoney(order.total)}
          </Button>
        </div>
      )}
    </SideCard>
  );
}

function ShipmentCard({ order }: { order: Order }) {
  const readOnly = useIsSupervisor();
  const shipment = useQuery({
    queryKey: ["shipment", "order", order.id],
    queryFn: ({ signal }) => notFoundAsNull(shipmentsApi.byOrder(order.id, signal)),
  });
  return (
    <SideCard icon={<Truck className="size-4" />} title="Envío">
      {shipment.error ? (
        <Alert tone="error">{errorMessage(shipment.error)}</Alert>
      ) : shipment.isPending ? (
        <Spinner className="size-5 text-brand-fg" />
      ) : shipment.data ? (
        <div className="space-y-2">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-medium">{shipment.data.trackingCode}</span>
            <Badge tone={SHIPMENT_STATUS[shipment.data.status].tone}>{SHIPMENT_STATUS[shipment.data.status].label}</Badge>
          </p>
          <Link to={`/envios/${shipment.data.id}`} className="inline-flex items-center gap-1 text-brand-fg hover:underline">
            Ver seguimiento <ChevronRight className="size-4" />
          </Link>
        </div>
      ) : order.status === "PAID" ? (
        <p className="text-muted">
          Pagado y sin envío.
          {!readOnly && (
            <>
              {" "}
              <Link to="/envios" className="text-brand-fg hover:underline">
                Crear envío
              </Link>
            </>
          )}
        </p>
      ) : (
        <p className="text-muted">Se crea cuando el pedido esté pagado.</p>
      )}
    </SideCard>
  );
}

function ReturnsCard({ order, names }: { order: Order; names: Map<string, string> }) {
  const returns = useQuery({
    queryKey: ["returns", "order", order.id],
    enabled: order.status === "DELIVERED",
    queryFn: ({ signal }) => returnsApi.byOrder(order.id, signal),
  });
  if (order.status !== "DELIVERED") return null;
  return (
    <SideCard icon={<RotateCcw className="size-4" />} title="Devoluciones">
      {returns.error ? (
        <Alert tone="error">{errorMessage(returns.error)}</Alert>
      ) : returns.isPending ? (
        <Spinner className="size-5 text-brand-fg" />
      ) : returns.data.length === 0 ? (
        <p className="text-muted">Sin solicitudes de devolución.</p>
      ) : (
        <ul className="space-y-2">
          {returns.data.map((request) => (
            <li key={request.id} className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                {request.quantity} × {names.get(request.productId) ?? `Producto ${shortId(request.productId)}`}
              </span>
              <Badge tone={RETURN_STATUS[request.status].tone}>{RETURN_STATUS[request.status].label}</Badge>
            </li>
          ))}
          <li>
            <Link to="/devoluciones?estado=todas" className="inline-flex items-center gap-1 text-brand-fg hover:underline">
              Ir a devoluciones <ChevronRight className="size-4" />
            </Link>
          </li>
        </ul>
      )}
    </SideCard>
  );
}

export function AdminOrderDetailPage() {
  const { id = "" } = useParams();
  const order = useQuery({ queryKey: ["order", id], queryFn: ({ signal }) => ordersApi.get(id, signal) });
  const warehouses = useAllWarehouses();
  const { products } = useProductsById(order.data?.items.map((item) => item.productId) ?? []);
  const users = useUsersById(order.data ? [order.data.buyerId] : []);

  const back = (
    <Link to="/pedidos" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Pedidos
    </Link>
  );

  if (order.isPending) return <PageLoader />;
  if (order.error) {
    return (
      <div className="space-y-4">
        {back}
        <Alert tone="error">{errorMessage(order.error, "No se pudo cargar el pedido.")}</Alert>
      </div>
    );
  }

  const data = order.data;
  const buyer = users.get(data.buyerId);
  const locations = new Map((warehouses.data ?? []).map((warehouse) => [warehouse.id, warehouse.location]));
  const names = new Map([...products].map(([productId, product]) => [productId, product.name]));

  return (
    <div className="space-y-6">
      {back}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">Pedido #{shortId(data.id)}</h1>
          <Badge tone={ORDER_STATUS[data.status].tone}>{ORDER_STATUS[data.status].label}</Badge>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-1 text-sm text-muted">
          Realizado el {formatDateTime(data.createdAt)} ·
          <UserIcon className="size-3.5" />
          <Link to={`/usuarios/${data.buyerId}`} className="text-brand-fg hover:underline">
            {buyer?.fullName ?? `Comprador ${shortId(data.buyerId)}`}
          </Link>
        </p>
      </div>

      <Card className="p-5">
        <OrderProgress status={data.status} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="h-fit divide-y divide-border">
          {data.items.map((item) => {
            const product = products.get(item.productId);
            return (
              <div key={item.productId} className="flex items-center gap-3 p-4 sm:gap-4">
                {product ? (
                  <ProductArt id={product.id} type={product.type} name={product.name} className="size-14 shrink-0 rounded-xl" />
                ) : (
                  <div className="size-14 shrink-0 animate-pulse rounded-xl bg-surface-2" />
                )}
                <div className="min-w-0 flex-1">
                  <Link to={`/catalogo/${item.productId}`} className="line-clamp-2 font-medium hover:text-brand-fg">
                    {product?.name ?? `Producto ${shortId(item.productId)}`}
                  </Link>
                  <p className="text-sm text-muted">
                    {item.quantity} × {formatMoney(item.unitPrice)} ·{" "}
                    {locations.get(item.warehouseId) ?? `Bodega ${shortId(item.warehouseId)}`}
                  </p>
                </div>
                <p className="font-semibold tabular-nums">{formatMoney(item.quantity * item.unitPrice)}</p>
              </div>
            );
          })}
          <div className="flex items-center justify-between p-4">
            <span className="font-medium">Total</span>
            <span className="font-display text-2xl font-semibold tabular-nums">{formatMoney(data.total)}</span>
          </div>
        </Card>

        <div className="space-y-4">
          <ShippingAddressCard address={data.shippingAddress} />
          <InvoiceCard order={data} />
          <ShipmentCard order={data} />
          <ReturnsCard order={data} names={names} />
        </div>
      </div>
    </div>
  );
}
