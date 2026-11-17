import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { productsApi } from "@/api/products";
import { ApiError } from "@/api/client";
import { useCurrentUser } from "@/auth/AuthContext";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ProductArt } from "@/features/catalog/ProductArt";
import { STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from "@/features/catalog/productLabels";
import { formatMoney, shortId } from "@/lib/format";

export function ProductDetailPage() {
  const { id = "" } = useParams();
  const user = useCurrentUser();
  const { data: product, error, isPending } = useQuery({
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
          <ProductArt id={product.id} type={product.type} name={product.name} className="aspect-[4/3]" />
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

          {user.role === "BUYER" && product.status === "PUBLISHED" && (
            <div className="mt-2">
              <Button size="lg" disabled icon={<ShoppingCart className="size-5" />} title="El carrito llega en la siguiente fase">
                Agregar al carrito
              </Button>
              <p className="mt-2 text-xs text-muted">El carrito y el checkout se habilitan en la siguiente fase.</p>
            </div>
          )}

          <p className="text-xs text-muted">Código del producto: {shortId(product.id)}</p>
        </div>
      </div>
    </div>
  );
}
