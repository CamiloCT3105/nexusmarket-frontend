import { Link } from "react-router";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg py-16">
      <EmptyState
        icon={<Compass className="size-6" />}
        title="Página no encontrada"
        description="La dirección que buscas no existe o fue movida."
        action={
          <Link to="/inicio" className="text-sm font-medium text-brand-fg hover:underline">
            Volver al inicio
          </Link>
        }
      />
    </div>
  );
}
