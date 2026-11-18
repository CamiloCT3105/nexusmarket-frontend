import type { OrderStatus, RefundStatus, ReturnStatus, ShipmentStatus } from "@/api/types";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

// Verde solo para lo terminado con éxito; morado para lo que está en curso
export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING_PAYMENT: { label: "Pendiente de pago", tone: "warning" },
  PAID: { label: "Pagado", tone: "brand" },
  SHIPPED: { label: "Enviado", tone: "brand" },
  DELIVERED: { label: "Entregado", tone: "success" },
};

export const ORDER_STEPS: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "SHIPPED", "DELIVERED"];

export const SHIPMENT_STATUS: Record<ShipmentStatus, { label: string; tone: Tone }> = {
  PREPARING: { label: "En preparación", tone: "neutral" },
  IN_TRANSIT: { label: "En tránsito", tone: "brand" },
  DELIVERED: { label: "Entregado", tone: "success" },
};

export const RETURN_STATUS: Record<ReturnStatus, { label: string; tone: Tone }> = {
  REQUESTED: { label: "En revisión", tone: "warning" },
  APPROVED: { label: "Aprobada", tone: "success" },
  REJECTED: { label: "Rechazada", tone: "danger" },
};

export const REFUND_STATUS: Record<RefundStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pendiente", tone: "warning" },
  COMPLETED: { label: "Completado", tone: "success" },
};

export const SHIPMENT_STEPS: ShipmentStatus[] = ["PREPARING", "IN_TRANSIT", "DELIVERED"];

// Siguiente paso del envío y cómo se nombra la acción del operador
export const SHIPMENT_NEXT: Partial<Record<ShipmentStatus, { status: ShipmentStatus; action: string; help: string }>> = {
  PREPARING: {
    status: "IN_TRANSIT",
    action: "Despachar",
    help: "El pedido pasa a Enviado y las unidades reservadas salen del inventario de cada bodega.",
  },
  IN_TRANSIT: {
    status: "DELIVERED",
    action: "Confirmar entrega",
    help: "El pedido queda Entregado y ya no se puede modificar. El comprador podrá solicitar devoluciones.",
  },
};
