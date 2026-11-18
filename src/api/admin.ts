import { api } from "./client";
import type {
  Buyer,
  CommercialStatus,
  Invoice,
  Page,
  Refund,
  RefundStatus,
  Seller,
  User,
  UserRole,
  UserStatus,
  Warehouse,
  WarehouseType,
} from "./types";

// Operaciones exclusivas del administrador. El backend vuelve a validar el rol en cada una.

export type UsersQuery = {
  role?: UserRole | undefined;
  status?: UserStatus | undefined;
  search?: string | undefined;
  page?: number;
  pageSize?: number;
};

export type NewUser = { fullName: string; email: string; documentNumber: string; password: string; role: UserRole };

const enc = encodeURIComponent;

export const usersApi = {
  list: (query: UsersQuery, signal?: AbortSignal) => api<Page<User>>("/api/users", { query, signal }),
  get: (id: string, signal?: AbortSignal) => api<User>(`/api/users/${enc(id)}`, { signal }),
  create: (input: NewUser) => api<User>("/api/users", { method: "POST", body: input }),
  // Un usuario bloqueado no puede iniciar sesión y su sesión abierta deja de funcionar
  setStatus: (id: string, status: UserStatus) => api<User>(`/api/users/${enc(id)}/status`, { method: "PATCH", body: { status } }),
  setRole: (id: string, role: UserRole) => api<User>(`/api/users/${enc(id)}/role`, { method: "PATCH", body: { role } }),
};

export const adminSellersApi = {
  // Habilita la cuenta de vendedor de un usuario con rol SELLER
  onboard: (userId: string) => api<Seller>("/api/sellers", { method: "POST", body: { userId } }),
};

export const adminBuyersApi = {
  setCommercialStatus: (userId: string, status: CommercialStatus) =>
    api<Buyer>(`/api/buyers/${enc(userId)}/commercial-status`, { method: "PATCH", body: { status } }),
};

export const adminWarehousesApi = {
  // MARKETPLACE sin vendedor; SELLER con el vendedor dueño
  create: (input: { type: WarehouseType; location: string; sellerId?: string }) =>
    api<Warehouse>("/api/warehouses", { method: "POST", body: input }),
  // Pasa una bodega de vendedor a otro vendedor
  linkToSeller: (warehouseId: string, sellerId: string) =>
    api<Warehouse>(`/api/warehouses/${enc(warehouseId)}/link-seller`, { method: "PATCH", body: { sellerId } }),
};

export const adminInvoicesApi = {
  // Solo para pedidos pagados que aún no tienen factura
  generate: (orderId: string) => api<Invoice>("/api/invoices", { method: "POST", body: { orderId } }),
};

export const adminRefundsApi = {
  list: (query: { status?: RefundStatus | undefined; page?: number; pageSize?: number }, signal?: AbortSignal) =>
    api<Page<Refund>>("/api/refunds", { query, signal }),
  // PENDING → COMPLETED cuando el dinero ya se devolvió al comprador
  complete: (id: string) => api<Refund>(`/api/refunds/${enc(id)}/status`, { method: "PATCH", body: { status: "COMPLETED" } }),
};
