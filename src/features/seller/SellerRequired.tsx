import { Store } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

// El backend exige que el administrador habilite la cuenta como vendedor antes de publicar o crear bodegas
export function SellerRequired() {
  return (
    <EmptyState
      icon={<Store className="size-6" />}
      title="Tu cuenta de vendedor aún no está habilitada"
      description="Un administrador debe incorporarte como vendedor. Cuando lo haga, podrás crear bodegas y publicar productos."
    />
  );
}
