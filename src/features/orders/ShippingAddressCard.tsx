import { MapPin } from "lucide-react";
import type { Address } from "@/api/types";
import { Card } from "@/components/ui/Card";

// Dirección de entrega del pedido (copia guardada al confirmar). Los pedidos anteriores a este dato no la tienen.
export function ShippingAddressCard({ address, title = "Dirección de entrega" }: { address: Address | undefined; title?: string }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-fg">
          <MapPin className="size-4" />
        </span>
        <h2 className="font-semibold">{title}</h2>
      </div>
      {address ? (
        <address className="text-sm not-italic">
          <span className="block font-medium">{address.street}</span>
          <span className="block text-muted">
            {address.city} ({address.postalCode}), {address.country}
          </span>
        </address>
      ) : (
        <p className="text-sm text-muted">Pedido anterior al registro de la dirección de entrega.</p>
      )}
    </Card>
  );
}
