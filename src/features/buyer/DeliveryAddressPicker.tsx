import { Link } from "react-router";
import { Home, MapPin } from "lucide-react";
import type { Buyer } from "@/api/types";
import { cn } from "@/lib/cn";
import { formatAddress } from "./address";

// Dirección de entrega del pedido: 0 = principal, 1.. = adicionales en su orden (igual que espera el backend).
// El pedido guarda una copia de la elegida, así que cambiar las direcciones después no lo afecta.
export function DeliveryAddressPicker({ buyer, value, onChange }: { buyer: Buyer; value: number; onChange: (index: number) => void }) {
  const addresses = [buyer.primaryAddress, ...buyer.additionalAddresses];

  if (addresses.length === 1) {
    return (
      <div className="flex gap-2 rounded-xl bg-surface-2/60 p-3 text-sm">
        <Home className="mt-0.5 size-4 shrink-0 text-brand-fg" />
        <div>
          <p className="font-medium">Entrega en tu dirección principal</p>
          <p className="text-muted">{formatAddress(buyer.primaryAddress)}</p>
          <Link to="/perfil" className="mt-1 inline-block text-xs text-brand-fg hover:underline">
            Agregar otra dirección
          </Link>
        </div>
      </div>
    );
  }

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">Dirección de entrega</legend>
      {addresses.map((address, index) => {
        const Icon = index === 0 ? Home : MapPin;
        return (
          <label
            key={`${index}-${address.street}`}
            className={cn(
              // El radio está oculto: el foco del teclado se marca en la tarjeta
              "flex cursor-pointer gap-2 rounded-xl border p-3 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring/60",
              value === index ? "border-brand bg-brand-soft/50" : "border-border hover:bg-surface-2/60",
            )}
          >
            <input
              type="radio"
              name="delivery-address"
              className="sr-only"
              checked={value === index}
              onChange={() => onChange(index)}
              aria-label={`${index === 0 ? "Principal" : `Adicional ${index}`}: ${formatAddress(address)}`}
            />
            <Icon className={cn("mt-0.5 size-4 shrink-0", value === index ? "text-brand-fg" : "text-muted")} />
            <span>
              <span className="block font-medium">{index === 0 ? "Principal" : `Adicional ${index}`}</span>
              <span className="block text-muted">{formatAddress(address)}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
