import type { ShipmentEvent } from "@/api/types";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { SHIPMENT_STATUS } from "./labels";

// Historial del envío, del evento más reciente al más antiguo
export function ShipmentTimeline({ events }: { events: ShipmentEvent[] }) {
  return (
    <ol className="space-y-3 border-l border-border pl-4">
      {[...events].reverse().map((event, index) => (
        <li key={index} className="relative">
          <span
            className={cn("absolute top-1.5 -left-[1.3rem] size-2 rounded-full", event.status === "DELIVERED" ? "bg-accent" : "bg-brand")}
          />
          <p className="font-medium">{SHIPMENT_STATUS[event.status].label}</p>
          {event.note && <p className="text-muted">{event.note}</p>}
          <p className="text-xs text-muted">{formatDateTime(event.createdAt)}</p>
        </li>
      ))}
    </ol>
  );
}
