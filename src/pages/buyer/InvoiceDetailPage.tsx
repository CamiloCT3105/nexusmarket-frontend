import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { invoicesApi, ordersApi } from "@/api/orders";
import { useCurrentUser } from "@/auth/AuthContext";
import { Logo } from "@/components/Logo";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/PageLoader";
import { formatAddress } from "@/features/buyer/AddressForm";
import { useBuyerProfile, useProductsById } from "@/features/buyer/hooks";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, formatMoney, shortId } from "@/lib/format";

// Factura lista para imprimir o guardar como PDF (al imprimir se ocultan la barra y los botones)
export function InvoiceDetailPage() {
  const { id = "" } = useParams();
  const user = useCurrentUser();
  const profile = useBuyerProfile();
  const invoice = useQuery({ queryKey: ["invoice", id], queryFn: ({ signal }) => invoicesApi.get(id, signal) });
  const orderId = invoice.data?.orderId;
  const order = useQuery({
    queryKey: ["order", orderId],
    enabled: Boolean(orderId),
    queryFn: ({ signal }) => ordersApi.get(orderId ?? "", signal),
  });
  const { products } = useProductsById(order.data?.items.map((item) => item.productId) ?? []);

  const back = (
    <Link to="/facturas" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg print:hidden">
      <ArrowLeft className="size-4" /> Mis facturas
    </Link>
  );

  if (invoice.isPending || (orderId && order.isPending)) return <PageLoader />;
  const error = invoice.error ?? order.error;
  if (error || !invoice.data || !order.data) {
    return (
      <div className="space-y-4">
        {back}
        <Alert tone="error">{errorMessage(error, "No se pudo cargar la factura.")}</Alert>
      </div>
    );
  }

  const data = invoice.data;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        {back}
        <Button variant="secondary" icon={<Printer className="size-4" />} onClick={() => window.print()}>
          Imprimir / PDF
        </Button>
      </div>

      <Card className="p-6 sm:p-10 print:border-0 print:shadow-none">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-muted">Marketplace NexusMarket</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs tracking-widest text-muted uppercase">Factura</p>
            <p className="font-display text-2xl font-semibold">#{shortId(data.id)}</p>
            <p className="text-sm text-muted">Emitida el {formatDateTime(data.issuedAt)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs tracking-widest text-muted uppercase">Cliente</p>
            <p className="mt-1 font-medium">{user.fullName}</p>
            <p className="text-muted">Documento {user.documentNumber}</p>
            <p className="text-muted">{user.email}</p>
            {profile.data && <p className="text-muted">{formatAddress(profile.data.primaryAddress)}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs tracking-widest text-muted uppercase">Pedido</p>
            <Link to={`/pedidos/${order.data.id}`} className="mt-1 inline-block font-medium text-brand-fg hover:underline print:text-fg">
              #{shortId(order.data.id)}
            </Link>
            <p className="text-muted">Realizado el {formatDateTime(order.data.createdAt)}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wider text-muted uppercase">
              <th className="py-2 font-medium">Producto</th>
              <th className="py-2 text-right font-medium">Cant.</th>
              <th className="hidden py-2 text-right font-medium sm:table-cell">Precio unit.</th>
              <th className="py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.data.items.map((item) => (
              <tr key={item.productId} className="border-b border-border/60">
                <td className="py-3 pr-2">{products.get(item.productId)?.name ?? `Producto ${shortId(item.productId)}`}</td>
                <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                <td className="hidden py-3 text-right tabular-nums sm:table-cell">{formatMoney(item.unitPrice)}</td>
                <td className="py-3 text-right tabular-nums">{formatMoney(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between border-t border-border pt-3">
              <span className="font-medium">Total facturado</span>
              <span className="font-display text-xl font-semibold tabular-nums">{formatMoney(data.amount)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
