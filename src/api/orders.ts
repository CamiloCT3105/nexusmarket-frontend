import { api } from "./client";
import type { Invoice, Order, OrderStatus, Page, Shipment } from "./types";

export type OrdersQuery = { status?: OrderStatus | undefined; page?: number; pageSize?: number };

export const ordersApi = {
  // El backend filtra por rol: un comprador solo recibe sus pedidos
  list: (query: OrdersQuery, signal?: AbortSignal) => api<Page<Order>>("/api/orders", { query, signal }),

  get: (id: string, signal?: AbortSignal) => api<Order>(`/api/orders/${encodeURIComponent(id)}`, { signal }),

  // Convierte el carrito en un pedido: valida stock, reserva unidades y vacía el carrito
  checkout: () => api<Order>("/api/orders/checkout", { method: "POST" }),

  // Pago simulado: PENDING_PAYMENT → PAID
  pay: (id: string) => api<Order>(`/api/orders/${encodeURIComponent(id)}/pay`, { method: "POST" }),
};

export const invoicesApi = {
  list: (query: { page?: number; pageSize?: number }, signal?: AbortSignal) =>
    api<Page<Invoice>>("/api/invoices", { query, signal }),
  get: (id: string, signal?: AbortSignal) => api<Invoice>(`/api/invoices/${encodeURIComponent(id)}`, { signal }),
  byOrder: (orderId: string, signal?: AbortSignal) =>
    api<Invoice>(`/api/invoices/order/${encodeURIComponent(orderId)}`, { signal }),
};

export const shipmentsApi = {
  byOrder: (orderId: string, signal?: AbortSignal) =>
    api<Shipment>(`/api/shipments/order/${encodeURIComponent(orderId)}`, { signal }),
};
