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
