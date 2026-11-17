import { Link } from "react-router";
import type { Product } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import { ProductArt } from "./ProductArt";
import { STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from "./productLabels";

export function ProductCard({ product, showStatus }: { product: Product; showStatus: boolean }) {
  const variantNames = [...new Set(product.variants.map((v) => v.name))];

  return (
    <Link to={`/catalogo/${product.id}`} className="group block focus-visible:outline-none">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-brand/50 group-focus-visible:ring-4 group-focus-visible:ring-ring">
        <ProductArt id={product.id} type={product.type} name={product.name} className="h-36" />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{TYPE_LABEL[product.type]}</Badge>
            {showStatus && <Badge tone={STATUS_TONE[product.status]}>{STATUS_LABEL[product.status]}</Badge>}
          </div>
          <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-brand-fg">{product.name}</h3>
          {product.description && <p className="line-clamp-2 text-sm text-muted">{product.description}</p>}
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <p className="font-display text-xl font-semibold">{formatMoney(product.price)}</p>
            {variantNames.length > 0 && (
              <p className="truncate text-xs text-muted" title={variantNames.join(", ")}>
                {product.variants.length} {product.variants.length === 1 ? "variante" : "variantes"}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-36 animate-pulse bg-surface-2" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-16 animate-pulse rounded-full bg-surface-2" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
        <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
        <div className="h-6 w-24 animate-pulse rounded bg-surface-2" />
      </div>
    </Card>
  );
}
