import { useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Settings2, ShoppingCart } from "lucide-react";
import { productsApi } from "@/api/products";
import { ApiError } from "@/api/client";
import { useCurrentUser } from "@/auth/AuthContext";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ProductModeration } from "@/features/admin/ProductModeration";
import { useCart, useCartActions } from "@/features/buyer/hooks";
import { QuantityStepper } from "@/features/buyer/QuantityStepper";
import { ProductArt } from "@/features/catalog/ProductArt";
import { errorMessage } from "@/lib/errors";
import { STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from "@/features/catalog/productLabels";
import { formatMoney, shortId } from "@/lib/format";

// Comprador: elegir cantidad y agregar. Sin perfil de comprador, el backend no permite carrito.
function AddToCart({ productId }: { productId: string }) {
  const cart = useCart();
  const { add } = useCartActions();
  const [quantity, setQuantity] = useState(1);
  const inCart = cart.data?.items.find((item) => item.productId === productId)?.quantity ?? 0;

  if (cart.profileLoading) return null;
  if (!cart.hasProfile) {
    return (
      <Alert tone="info">
        Para comprar, primero{" "}
        <Link to="/perfil" className="font-medium underline underline-offset-2">
          completa tu perfil con una dirección de entrega
        </Link>
        .
      </Alert>
    );
  }

  return (
    <div className="mt-2 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} disabled={add.isPending} className="h-12 px-1" />
        <Button
          size="lg"
          loading={add.isPending}
          icon={<ShoppingCart className="size-5" />}
          onClick={() => add.mutate({ productId, quantity }, { onSuccess: () => setQuantity(1) })}
        >
          Agregar al carrito
        </Button>
      </div>
      {add.error && <Alert tone="error">{errorMessage(add.error, "No se pudo agregar al carrito.")}</Alert>}
      {add.isSuccess && (
        <Alert tone="success">
          Agregado. Tienes {inCart} {inCart === 1 ? "unidad" : "unidades"} en el carrito ·{" "}
          <Link to="/carrito" className="font-medium underline underline-offset-2">
            Ver carrito
          </Link>
        </Alert>
      )}
      {!add.isSuccess && inCart > 0 && (
        <p className="text-sm text-muted">
          Ya tienes {inCart} en tu{" "}
          <Link to="/carrito" className="text-brand-fg hover:underline">
            carrito
          </Link>
          .
        </p>
      )}
    </div>
  );
}

export function ProductDetailPage() {
  const { id = "" } = useParams();
  const user = useCurrentUser();
  const {
    data: product,
    error,
    isPending,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: ({ signal }) => productsApi.get(id, signal),
  });

  const back = (
    <Link to="/catalogo" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Volver al catálogo
    </Link>
  );

  if (isPending) {
    return (
      <div className="flex justify-center py-24 text-brand-fg">
        <Spinner className="size-8" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-4">
        {back}
        <Alert tone="error">{error instanceof ApiError ? error.message : "No se pudo cargar el producto."}</Alert>
      </div>
    );
  }

  // Variantes agrupadas por nombre: Color → Rojo, Azul · Talla → M, L
  const groups = new Map<string, string[]>();
  for (const variant of product.variants) groups.set(variant.name, [...(groups.get(variant.name) ?? []), variant.value]);

  return (
    <div className="space-y-6">
      {back}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <ProductArt
            id={product.id}
            type={product.type}
            name={product.name}
            imageUrl={product.imageUrl}
            alt={product.name}
            className="aspect-[4/3]"
          />
        </Card>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{TYPE_LABEL[product.type]}</Badge>
            <Badge tone={STATUS_TONE[product.status]}>{STATUS_LABEL[product.status]}</Badge>
          </div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{product.name}</h1>
          <p className="font-display text-3xl font-semibold">{formatMoney(product.price)}</p>
          {product.description && <p className="leading-relaxed text-muted">{product.description}</p>}

          {groups.size > 0 && (
            <div className="space-y-3">
              {[...groups.entries()].map(([name, values]) => (
                <div key={name}>
                  <p className="mb-1.5 text-sm font-medium">{name}</p>
                  <div className="flex flex-wrap gap-2">
                    {values.map((value) => (
                      <span key={value} className="rounded-lg border border-border bg-surface px-3 py-1 text-sm">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {user.role === "BUYER" && product.status === "PUBLISHED" && <AddToCart productId={product.id} />}
          {user.role === "SELLER" && product.sellerId === user.id && (
            <Link to={`/productos/${product.id}`} className="self-start">
              <Button variant="secondary" icon={<Settings2 className="size-4" />}>
                Administrar producto
              </Button>
            </Link>
          )}

          {user.role === "ADMIN" && <ProductModeration product={product} />}

          <p className="text-xs text-muted">Código del producto: {shortId(product.id)}</p>
        </div>
      </div>
    </div>
  );
}
