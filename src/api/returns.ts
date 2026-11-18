import { api } from "./client";
import type { Page, Refund, RefundStatus, ReturnRequest, ReturnStatus } from "./types";

export type NewReturn = { orderId: string; productId: string; quantity: number; reason: string };

export const returnsApi = {
  list: (query: { status?: ReturnStatus | undefined; page?: number; pageSize?: number }, signal?: AbortSignal) =>
    api<Page<ReturnRequest>>("/api/returns", { query, signal }),
  get: (id: string, signal?: AbortSignal) => api<ReturnRequest>(`/api/returns/${encodeURIComponent(id)}`, { signal }),
  byOrder: (orderId: string, signal?: AbortSignal) =>
    api<ReturnRequest[]>(`/api/returns/order/${encodeURIComponent(orderId)}`, { signal }),
  create: (input: NewReturn) => api<ReturnRequest>("/api/returns", { method: "POST", body: input }),
};

export const refundsApi = {
  list: (query: { status?: RefundStatus | undefined; page?: number; pageSize?: number }, signal?: AbortSignal) =>
    api<Page<Refund>>("/api/refunds", { query, signal }),
};

// Vendedor: aprobar (reingresa el stock y genera el reembolso) o rechazar
export function processReturn(id: string, approve: boolean) {
  return api<ReturnRequest>(`/api/returns/${encodeURIComponent(id)}/process`, { method: "PATCH", body: { approve } });
}
