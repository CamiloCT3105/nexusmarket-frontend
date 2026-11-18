import { useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, FileText, RotateCcw, Truck } from "lucide-react";
import { invoicesApi, ordersApi, shipmentsApi } from "@/api/orders";
import { returnsApi } from "@/api/returns";
import type { Order } from "@/api/types";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/PageLoader";
import { Spinner } from "@/components/ui/Spinner";
import { useProductsById } from "@/features/buyer/hooks";
import { ProductArt } from "@/features/catalog/ProductArt";
import { ORDER_STATUS, RETURN_STATUS, SHIPMENT_STATUS } from "@/features/orders/labels";
import { OrderProgress } from "@/features/orders/OrderProgress";
import { ReturnForm } from "@/features/orders/ReturnForm";
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

function PaymentCard({ order }: { order: Order }) {
  const queryClient = useQueryClient();
  const pay = useMutation({
    mutationFn: () => ordersApi.pay(order.id),
    onSuccess: (updated) => {
      queryClient.setQueryData(["order", order.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  return (
    <SideCard icon={<CreditCard className="size-4" />} title="Pago">
      {order.status === "PENDING_PAYMENT" ? (
        <div className="space-y-3">
          <p className="text-muted">Tus unidades están reservadas. Paga para que el pedido pase a despacho.</p>
          {pay.error && <Alert tone="error">{errorMessage(pay.error, "No se pudo registrar el pago.")}</Alert>}
          <Button className="w-full" loading={pay.isPending} onClick={() => pay.mutate()}>
            Pagar {formatMoney(order.total)}
          </Button>
          <p className="text-xs text-muted">Pago simulado: no se solicita ningún medio de pago real.</p>
        </div>
      ) : (
        <p>
          <Badge tone="success">Pagado</Badge> <span className="ml-1 text-muted">{formatMoney(order.total)}</span>
        </p>
      )}
    </SideCard>
  );
}

function InvoiceCard({ order }: { order: Order }) {
  const paid = order.status !== "PENDING_PAYMENT";
  const { data: invoice, isPending, error } = useQuery({
    queryKey: ["invoice", "order", order.id],
    enabled: paid,
    queryFn: ({ signal }) => notFoundAsNull(invoicesApi.byOrder(order.id, signal)),
  });

  return (
    <SideCard icon={<FileText className="size-4" />} title="Factura">
      {!paid ? (
        <p className="text-muted">Se emite después del pago.</p>
      ) : isPending ? (
        <Spinner className="text-brand-fg" />
      ) : error ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : invoice ? (
        <div className="space-y-2">
          <p>
            Factura <span className="font-medium">#{shortId(invoice.id)}</span> · {formatMoney(invoice.amount)}
          </p>
          <p className="text-xs text-muted">Emitida el {formatDateTime(invoice.issuedAt)}</p>
          <Link to={`/facturas/${invoice.id}`} className="inline-block font-medium text-brand-fg hover:underline">
            Ver factura
          </Link>
        </div>
      ) : (
        <p className="text-muted">Pendiente de emisión por parte del administrador.</p>
      )}
    </SideCard>
  );
}

function ShipmentCard({ order }: { order: Order }) {
  const paid = order.status !== "PENDING_PAYMENT";
  const { data: shipment, isPending, error } = useQuery({
    queryKey: ["shipment", "order", order.id],
    enabled: paid,
    queryFn: ({ signal }) => notFoundAsNull(shipmentsApi.byOrder(order.id, signal)),
  });

  return (
    <SideCard icon={<Truck className="size-4" />} title="Envío">
      {!paid ? (
        <p className="text-muted">Se prepara cuando el pedido esté pagado.</p>
      ) : isPending ? (
        <Spinner className="text-brand-fg" />
      ) : error ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : shipment ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Guía <span className="font-mono font-medium">{shipment.trackingCode}</span>
            </span>
            <Badge tone={SHIPMENT_STATUS[shipment.status].tone}>{SHIPMENT_STATUS[shipment.status].label}</Badge>
          </div>
          <ol className="space-y-3 border-l border-border pl-4">
            {[...shipment.events].reverse().map((event, index) => (
              <li key={index} className="relative">
                <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-brand" />
                <p className="font-medium">{SHIPMENT_STATUS[event.status].label}</p>
                {event.note && <p className="text-muted">{event.note}</p>}
                <p className="text-xs text-muted">{formatDateTime(event.createdAt)}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="text-muted">El operador logístico aún no ha creado el envío.</p>
      )}
    </SideCard>
  );
}

export function OrderDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const justCreated = (location.state as { created?: boolean } | null)?.created === true;
  const [returning, setReturning] = useState<string | null>(null);
  const [returnSent, setReturnSent] = useState(false);

  const { data: order, error, isPending } = useQuery({
    queryKey: ["order", id],
    queryFn: ({ signal }) => ordersApi.get(id, signal),
  });
  const delivered = order?.status === "DELIVERED";
  const returns = useQuery({
    queryKey: ["returns", "order", id],
    enabled: delivered,
    queryFn: ({ signal }) => returnsApi.byOrder(id, signal),
  });
  const { products } = useProductsById(order?.items.map((item) => item.productId) ?? []);

  const back = (
    <Link to="/pedidos" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Mis pedidos
    </Link>
  );

  if (isPending) return <PageLoader />;
  if (error) {
    return (
      <div className="space-y-4">
        {back}
        <Alert tone="error">{errorMessage(error, "No se pudo cargar el pedido.")}</Alert>
      </div>
    );
  }

  // Unidades que aún se pueden devolver: compradas menos las solicitadas o aprobadas
  const returnable = (productId: string, bought: number) =>
    bought -
    (returns.data ?? [])
      .filter((request) => request.productId === productId && request.status !== "REJECTED")
      .reduce((sum, request) => sum + request.quantity, 0);

  return (
    <div className="space-y-6">
      {back}
      {justCreated && order.status === "PENDING_PAYMENT" && (
        <Alert tone="success">¡Pedido creado! Reservamos tus unidades. Realiza el pago para que se despache.</Alert>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Pedido #{shortId(order.id)}</h1>
          <p className="mt-1 text-muted">Realizado el {formatDateTime(order.createdAt)}</p>
        </div>
        <Badge tone={ORDER_STATUS[order.status].tone} className="self-start px-3 py-1 text-sm sm:self-auto">
          {ORDER_STATUS[order.status].label}
        </Badge>
      </div>

      <Card className="p-5">
        <OrderProgress status={order.status} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">Productos</h2>
            {returnSent && (
              <Alert tone="success" className="mb-4">
                Solicitud de devolución enviada. El vendedor la revisará; puedes seguirla en{" "}
                <Link to="/devoluciones" className="font-medium underline underline-offset-2">
                  Devoluciones
                </Link>
                .
              </Alert>
            )}
            <ul className="divide-y divide-border">
              {order.items.map((item) => {
                const product = products.get(item.productId);
                const left = delivered ? returnable(item.productId, item.quantity) : 0;
                return (
                  <li key={item.productId} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      {product ? (
                        <ProductArt id={product.id} type={product.type} name={product.name} className="size-14 shrink-0 rounded-lg" />
                      ) : (
                        <div className="size-14 shrink-0 animate-pulse rounded-lg bg-surface-2" />
                      )}
                      <div className="min-w-0 flex-1">
                        <Link to={`/catalogo/${item.productId}`} className="line-clamp-2 font-medium hover:text-brand-fg">
                          {product?.name ?? `Producto ${shortId(item.productId)}`}
                        </Link>
                        <p className="text-sm text-muted">
                          {item.quantity} × {formatMoney(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-semibold tabular-nums">{formatMoney(item.quantity * item.unitPrice)}</p>
                    </div>
                    {delivered && returning !== item.productId && left > 0 && returns.isSuccess && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        icon={<RotateCcw className="size-3.5" />}
                        onClick={() => {
                          setReturning(item.productId);
                          setReturnSent(false);
                        }}
                      >
                        Solicitar devolución
                      </Button>
                    )}
                    {returning === item.productId && (
                      <ReturnForm
                        orderId={order.id}
                        productId={item.productId}
                        maxQuantity={left}
                        onCancel={() => setReturning(null)}
                        onDone={() => {
                          setReturning(null);
                          setReturnSent(true);
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="font-medium">Total</span>
              <span className="font-display text-2xl font-semibold tabular-nums">{formatMoney(order.total)}</span>
            </div>
          </Card>

          {delivered && returns.data && returns.data.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-4 text-lg font-semibold">Devoluciones de este pedido</h2>
              <ul className="space-y-3">
                {returns.data.map((request) => (
                  <li key={request.id} className="flex flex-wrap items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {request.quantity} × {products.get(request.productId)?.name ?? shortId(request.productId)}
                      </p>
                      <p className="text-muted">“{request.reason}”</p>
                    </div>
                    <Badge tone={RETURN_STATUS[request.status].tone}>{RETURN_STATUS[request.status].label}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <PaymentCard order={order} />
          <InvoiceCard order={order} />
          <ShipmentCard order={order} />
        </div>
      </div>
    </div>
  );
}
