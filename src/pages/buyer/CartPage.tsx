import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Home, ShoppingBag, Trash2 } from "lucide-react";
import { ordersApi } from "@/api/orders";
import type { Cart } from "@/api/types";
import { useCurrentUser } from "@/auth/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/PageLoader";
import { formatAddress } from "@/features/buyer/address";
import { cartKey, useBuyerProfile, useCart, useCartActions, useProductsById } from "@/features/buyer/hooks";
import { ProfileRequired } from "@/features/buyer/ProfileRequired";
import { QuantityStepper } from "@/features/buyer/QuantityStepper";
import { ProductArt } from "@/features/catalog/ProductArt";
import { STATUS_LABEL } from "@/features/catalog/productLabels";
import { errorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";

export function CartPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useBuyerProfile();
  const cart = useCart();
  const actions = useCartActions();
  const items = cart.data?.items ?? [];
  const { products, isPending: productsPending } = useProductsById(items.map((item) => item.productId));
  const [actionError, setActionError] = useState<string | null>(null);

  const checkout = useMutation({
    mutationFn: ordersApi.checkout,
    onSuccess: (order) => {
      // El backend vacía el carrito al confirmar el pedido
      queryClient.setQueryData<Cart>(cartKey(user.id), { buyerId: user.id, items: [] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void navigate(`/pedidos/${order.id}`, { state: { created: true } });
    },
  });

  if (cart.profileLoading || (cart.hasProfile && cart.isPending)) return <PageLoader />;
  if (profile.error) return <Alert tone="error">{errorMessage(profile.error)}</Alert>;
  if (!cart.hasProfile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Carrito" />
        <ProfileRequired />
      </div>
    );
  }
  if (cart.error) return <Alert tone="error">{errorMessage(cart.error, "No se pudo cargar el carrito.")}</Alert>;

  const run = (promise: Promise<unknown>) => {
    setActionError(null);
    promise.catch((error: unknown) => setActionError(errorMessage(error, "No se pudo actualizar el carrito.")));
  };

  const lines = items.map((item) => ({ item, product: products.get(item.productId) }));
  const unavailable = lines.filter((line) => line.product && line.product.status !== "PUBLISHED");
  // Precio actual del catálogo; el precio definitivo se fija al confirmar el pedido
  const total = lines.reduce((sum, line) => sum + (line.product?.price ?? 0) * line.item.quantity, 0);
  const units = items.reduce((sum, item) => sum + item.quantity, 0);
  const busy = actions.setQuantity.isPending || actions.remove.isPending;

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Carrito" />
        <EmptyState
          icon={<ShoppingBag className="size-6" />}
          title="Tu carrito está vacío"
          description="Explora el catálogo y agrega los productos que quieras comprar."
          action={
            <Link to="/catalogo">
              <Button>Ir al catálogo</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Carrito" description={`${units} ${units === 1 ? "unidad" : "unidades"} en tu carrito.`} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          {actionError && <Alert tone="error">{actionError}</Alert>}
          {lines.map(({ item, product }) => (
            <Card key={item.productId} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
              <Link to={`/catalogo/${item.productId}`} className="shrink-0" aria-label={product?.name ?? "Ver producto"}>
                {product ? (
                  <ProductArt id={product.id} type={product.type} name={product.name} className="size-16 rounded-xl sm:size-24" />
                ) : (
                  <div className="size-16 animate-pulse rounded-xl bg-surface-2 sm:size-24" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  {product ? (
                    <Link to={`/catalogo/${product.id}`} className="line-clamp-2 font-medium hover:text-brand-fg">
                      {product.name}
                    </Link>
                  ) : (
                    <div className="h-4 w-40 animate-pulse rounded bg-surface-2" />
                  )}
                  {product && <p className="mt-0.5 text-sm text-muted">{formatMoney(product.price)} c/u</p>}
                  {product && product.status !== "PUBLISHED" && (
                    <Badge tone="warning" className="mt-1">
                      <AlertTriangle className="size-3" /> {STATUS_LABEL[product.status]}: no disponible
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <QuantityStepper
                    value={item.quantity}
                    disabled={busy}
                    onChange={(quantity) => run(actions.setQuantity.mutateAsync({ productId: item.productId, quantity }))}
                  />
                  <p className="ml-auto text-right font-semibold tabular-nums sm:ml-0 sm:min-w-24">
                    {product ? formatMoney(product.price * item.quantity) : "—"}
                  </p>
                  <button
                    type="button"
                    aria-label="Quitar del carrito"
                    title="Quitar del carrito"
                    disabled={busy}
                    onClick={() => run(actions.remove.mutateAsync(item.productId))}
                    className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="h-fit space-y-4 p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Resumen</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Productos ({units})</span>
            <span className="tabular-nums">{productsPending ? "…" : formatMoney(total)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-medium">Total</span>
            <span className="font-display text-2xl font-semibold tabular-nums">{productsPending ? "…" : formatMoney(total)}</span>
          </div>
          {profile.data && (
            <div className="flex gap-2 rounded-xl bg-surface-2/60 p-3 text-sm">
              <Home className="mt-0.5 size-4 shrink-0 text-brand-fg" />
              <div>
                <p className="font-medium">Entrega en tu dirección principal</p>
                <p className="text-muted">{formatAddress(profile.data.primaryAddress)}</p>
              </div>
            </div>
          )}
          {unavailable.length > 0 && <Alert tone="error">Quita los productos que ya no están disponibles para continuar.</Alert>}
          {checkout.error && <Alert tone="error">{errorMessage(checkout.error, "No se pudo confirmar el pedido.")}</Alert>}
          <Button
            size="lg"
            className="w-full"
            loading={checkout.isPending}
            disabled={unavailable.length > 0 || busy || productsPending}
            onClick={() => checkout.mutate()}
          >
            Confirmar pedido <ArrowRight className="size-4" />
          </Button>
          <p className="text-xs text-muted">
            Al confirmar se reservan las unidades y el pedido queda pendiente de pago. El precio final es el vigente al confirmar.
          </p>
        </Card>
      </div>
    </div>
  );
}
