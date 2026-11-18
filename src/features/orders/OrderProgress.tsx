import { Check } from "lucide-react";
import type { OrderStatus } from "@/api/types";
import { cn } from "@/lib/cn";
import { ORDER_STATUS, ORDER_STEPS } from "./labels";

// Línea de tiempo del pedido: Pendiente de pago → Pagado → Enviado → Entregado
export function OrderProgress({ status }: { status: OrderStatus }) {
  const current = ORDER_STEPS.indexOf(status);
  const finished = status === "DELIVERED";
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Progreso del pedido">
      {ORDER_STEPS.map((step, index) => {
        const done = index < current || finished;
        const active = index === current && !finished;
        return (
          <li key={step} className="flex flex-col gap-2" aria-current={active ? "step" : undefined}>
            <div
              className={cn(
                "h-1.5 rounded-full",
                // Verde solo cuando el pedido terminó; mientras avanza, morado
                done ? (finished ? "bg-accent" : "bg-brand") : active ? "bg-brand/40" : "bg-surface-2",
              )}
            />
            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
              {done && <Check className={cn("size-3.5 shrink-0", finished ? "text-accent-fg" : "text-brand-fg")} />}
              <span className={cn(done || active ? "font-medium text-fg" : "text-muted")}>{ORDER_STATUS[step].label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
