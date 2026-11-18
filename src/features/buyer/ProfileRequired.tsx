import { Link } from "react-router";
import { UserRound } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

// El backend exige un perfil de comprador (con dirección principal) para el carrito y la compra
export function ProfileRequired({ action = "usar el carrito" }: { action?: string }) {
  return (
    <EmptyState
      icon={<UserRound className="size-6" />}
      title="Completa tu perfil de comprador"
      description={`Necesitas registrar una dirección principal para ${action}.`}
      action={
        <Link to="/perfil">
          <Button>Completar perfil</Button>
        </Link>
      }
    />
  );
}
