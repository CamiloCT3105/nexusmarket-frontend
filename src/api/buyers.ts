import { api } from "./client";
import type { Address, Buyer } from "./types";

export const buyersApi = {
  get: (userId: string, signal?: AbortSignal) => api<Buyer>(`/api/buyers/${encodeURIComponent(userId)}`, { signal }),

  // Crea el perfil de comprador del usuario de la sesión (registrarse no lo crea)
  create: (primaryAddress: Address) => api<Buyer>("/api/buyers", { method: "POST", body: { primaryAddress } }),

  addAddress: (userId: string, address: Address) =>
    api<Buyer>(`/api/buyers/${encodeURIComponent(userId)}/addresses`, { method: "PATCH", body: address }),
};
