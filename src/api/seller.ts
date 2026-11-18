import { api } from "./client";
import type { InventoryItem, Page, Seller, Warehouse, WarehouseType } from "./types";

export type StockMovement = { productId: string; warehouseId: string; quantity: number };

export const sellersApi = {
  // 404 mientras el administrador no haya habilitado la cuenta como vendedor
  get: (userId: string, signal?: AbortSignal) => api<Seller>(`/api/sellers/${encodeURIComponent(userId)}`, { signal }),
};

export const warehousesApi = {
  // Todas las bodegas (operador logístico, administrador y supervisor)
  list: (query: { type?: WarehouseType | undefined; page?: number; pageSize?: number }, signal?: AbortSignal) =>
    api<Page<Warehouse>>("/api/warehouses", { query, signal }),
  bySeller: (sellerId: string, signal?: AbortSignal) =>
    api<Warehouse[]>(`/api/warehouses/seller/${encodeURIComponent(sellerId)}`, { signal }),
  // Un vendedor solo puede crear bodegas propias (tipo SELLER)
  createOwn: (location: string) => api<Warehouse>("/api/warehouses", { method: "POST", body: { type: "SELLER", location } }),
};

export const inventoryApi = {
  // El backend limita al vendedor a sus bodegas
  list: (
    query: { productId?: string | undefined; warehouseId?: string | undefined; page?: number; pageSize?: number },
    signal?: AbortSignal,
  ) => api<Page<InventoryItem>>("/api/inventory", { query, signal }),
  inbound: (movement: StockMovement) => api<InventoryItem>("/api/inventory/inbound", { method: "POST", body: movement }),
  damaged: (movement: StockMovement) => api<InventoryItem>("/api/inventory/damaged", { method: "POST", body: movement }),
};

// Unidades que se pueden vender: total menos reservadas y dañadas
export function availableUnits(item: InventoryItem): number {
  return item.quantity - item.reservedQuantity - item.damagedQuantity;
}
