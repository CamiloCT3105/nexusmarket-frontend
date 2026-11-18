import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Info } from "lucide-react";
import { ordersApi } from "@/api/orders";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/PageLoader";
import { useProductsById } from "@/features/buyer/hooks";
import { ProductArt } from "@/features/catalog/ProductArt";
import { ORDER_STATUS } from "@/features/orders/labels";
import { OrderProgress } from "@/features/orders/OrderProgress";
import { useMyWarehouses } from "@/features/seller/hooks";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, formatMoney, shortId } from "@/lib/format";

const NEXT_STEP: Record<string, string> = {
  PENDING_PAYMENT: "Las unidades están reservadas en tu bodega mientras el comprador paga.",
  PAID: "Pagado. El operador logístico creará el envío y despachará desde tu bodega.",
  SHIPPED: "En camino al comprador.",
  DELIVERED: "Entregado. El comprador puede solicitar devoluciones de tus productos, que revisarás tú.",
};

export function SellerOrderDetailPage() {
  const { id = "" } = useParams();
  const order = useQuery({ queryKey: ["order", id], queryFn: ({ signal }) => ordersApi.get(id, signal) });
  const warehouses = useMyWarehouses();
  const { products } = useProductsById(order.data?.items.map((item) => item.productId) ?? []);

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
  const locations = new Map((warehouses.data ?? []).map((warehouse) => [warehouse.id, warehouse.location]));

  return (
    <div className="space-y-6">
      {back}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">Pedido #{shortId(data.id)}</h1>
        <Badge tone={ORDER_STATUS[data.status].tone}>{ORDER_STATUS[data.status].label}</Badge>
      </div>
      <p className="-mt-4 text-sm text-muted">
        Realizado el {formatDateTime(data.createdAt)} · Comprador {shortId(data.buyerId)}
      </p>

      <Card className="p-5">
        <OrderProgress status={data.status} />
        <p className="mt-4 flex items-start gap-2 text-sm text-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-brand-fg" />
          <span>
            {NEXT_STEP[data.status]}
            {data.status === "DELIVERED" && (
              <>
                {" "}
                <Link to="/devoluciones" className="text-brand-fg hover:underline">
                  Ver devoluciones
                </Link>
              </>
            )}
          </span>
        </p>
      </Card>

      <Card className="divide-y divide-border">
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
                <Link to={`/productos/${item.productId}`} className="line-clamp-2 font-medium hover:text-brand-fg">
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
          <span className="font-medium">Tu parte del pedido</span>
          <span className="font-display text-2xl font-semibold tabular-nums">{formatMoney(data.sellerSubtotal ?? 0)}</span>
        </div>
      </Card>
    </div>
  );
}
