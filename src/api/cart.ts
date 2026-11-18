import { api } from "./client";
import type { Cart } from "./types";

const base = (buyerId: string) => `/api/carts/${encodeURIComponent(buyerId)}`;

export const cartApi = {
  get: (buyerId: string, signal?: AbortSignal) => api<Cart>(base(buyerId), { signal }),

  // Si el producto ya está en el carrito, el backend suma la cantidad a la misma línea
  add: (buyerId: string, productId: string, quantity: number) =>
    api<Cart>(`${base(buyerId)}/items`, { method: "POST", body: { productId, quantity } }),

  setQuantity: (buyerId: string, productId: string, quantity: number) =>
    api<Cart>(`${base(buyerId)}/items/${encodeURIComponent(productId)}`, { method: "PATCH", body: { quantity } }),

  remove: (buyerId: string, productId: string) =>
    api<Cart>(`${base(buyerId)}/items/${encodeURIComponent(productId)}`, { method: "DELETE" }),
};
