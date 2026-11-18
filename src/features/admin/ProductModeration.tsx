import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { sellerProductsApi } from "@/api/products";
import type { Product, ProductStatus } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { STATUS_LABEL } from "@/features/catalog/productLabels";
import { useUsersById } from "./hooks";
import { Confirm } from "./Confirm";

const MODERATION: Record<ProductStatus, { action: string; effect: string }> = {
  PUBLISHED: { action: "Publicar", effect: "Vuelve a estar visible para los compradores." },
  SUSPENDED: { action: "Suspender", effect: "Deja de verse en el catálogo de los compradores. El vendedor puede volver a publicarlo." },
  DISCONTINUED: { action: "Descontinuar", effect: "Ya no se vende. Se conserva en los pedidos anteriores." },
};

// El administrador puede cambiar el estado de cualquier producto (por ejemplo, suspender uno que incumple las normas)
export function ProductModeration({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<ProductStatus | null>(null);
  const seller = useUsersById([product.sellerId]).get(product.sellerId);
  const change = useMutation({
    mutationFn: (status: ProductStatus) => sellerProductsApi.setStatus(product.id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(["product", product.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      setTarget(null);
    },
  });
  const others = (Object.keys(MODERATION) as ProductStatus[]).filter((status) => status !== product.status);

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 text-brand-fg" />
        <h2 className="font-semibold">Moderación</h2>
      </div>
      <p className="text-sm text-muted">
        Vendedor:{" "}
        <Link to={`/usuarios/${product.sellerId}`} className="text-brand-fg hover:underline">
          {seller?.fullName ?? "ver perfil"}
        </Link>
      </p>
      {target ? (
        <Confirm
          confirmLabel={`Sí, ${MODERATION[target].action.toLowerCase()}`}
          danger={target !== "PUBLISHED"}
          loading={change.isPending}
          error={change.error}
          onConfirm={() => change.mutate(target)}
          onCancel={() => setTarget(null)}
        >
          ¿Pasar “{product.name}” de {STATUS_LABEL[product.status].toLowerCase()} a {STATUS_LABEL[target].toLowerCase()}? {MODERATION[target].effect}
        </Confirm>
      ) : (
        <div className="flex flex-wrap gap-2">
          {others.map((status) => (
            <Button key={status} size="sm" variant="secondary" onClick={() => setTarget(status)}>
              {MODERATION[status].action}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}
