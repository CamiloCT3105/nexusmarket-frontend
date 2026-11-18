import { api } from "./client";
import type { Invoice, Order, OrderStatus, Page, SellerOrder, Shipment, ShipmentStatus } from "./types";

// buyerId: solo administrador y supervisor (el comprador siempre recibe los suyos)
export type OrdersQuery = { status?: OrderStatus | undefined; buyerId?: string | undefined; page?: number; pageSize?: number };

export const ordersApi = {
  // El backend filtra por rol: un comprador solo recibe sus pedidos
  list: (query: OrdersQuery, signal?: AbortSignal) => api<Page<SellerOrder>>("/api/orders", { query, signal }),

  get: (id: string, signal?: AbortSignal) => api<SellerOrder>(`/api/orders/${encodeURIComponent(id)}`, { signal }),

  // Convierte el carrito en un pedido: valida stock, reserva unidades y vacía el carrito
  checkout: () => api<Order>("/api/orders/checkout", { method: "POST" }),

  // Pago simulado: PENDING_PAYMENT → PAID
  pay: (id: string) => api<Order>(`/api/orders/${encodeURIComponent(id)}/pay`, { method: "POST" }),
};

export const invoicesApi = {
  list: (query: { page?: number; pageSize?: number }, signal?: AbortSignal) => api<Page<Invoice>>("/api/invoices", { query, signal }),
  get: (id: string, signal?: AbortSignal) => api<Invoice>(`/api/invoices/${encodeURIComponent(id)}`, { signal }),
  byOrder: (orderId: string, signal?: AbortSignal) => api<Invoice>(`/api/invoices/order/${encodeURIComponent(orderId)}`, { signal }),
};

export const shipmentsApi = {
  list: (query: { status?: ShipmentStatus | undefined; page?: number; pageSize?: number }, signal?: AbortSignal) =>
    api<Page<Shipment>>("/api/shipments", { query, signal }),
  get: (id: string, signal?: AbortSignal) => api<Shipment>(`/api/shipments/${encodeURIComponent(id)}`, { signal }),
  // Solo para pedidos pagados y sin envío; nace "En preparación" con su número de guía
  create: (orderId: string) => api<Shipment>("/api/shipments", { method: "POST", body: { orderId } }),
  // PREPARING → IN_TRANSIT (el pedido pasa a Enviado y sale el inventario) → DELIVERED
  updateStatus: (id: string, status: ShipmentStatus, note: string) =>
    api<Shipment>(`/api/shipments/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status, note } }),
  byOrder: (orderId: string, signal?: AbortSignal) => api<Shipment>(`/api/shipments/order/${encodeURIComponent(orderId)}`, { signal }),
};
