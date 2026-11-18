import { api } from "./client";
import type { OrderStatus, ProductStatus, ReturnStatus, ShipmentStatus, UserRole } from "./types";

// Reportes del administrador y el supervisor (GET /api/reports/*). Montos en pesos, ya redondeados.

export type SummaryReport = {
  usersByRole: Record<UserRole, number>;
  productsByStatus: Record<ProductStatus, number>;
  ordersByStatus: Record<OrderStatus, number>;
  totalInvoicedAmount: number;
  pendingReturns: number;
};

export type SalesReport = {
  period: { from: string | null; to: string | null };
  orderCount: number;
  totalRevenue: number;
  averageTicket: number;
  topProducts: Array<{ productId: string; productName: string; unitsSold: number; revenue: number }>;
  revenueBySeller: Array<{ sellerId: string; revenue: number }>;
};

export type InventoryReportRow = {
  productId: string;
  productName: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  availableQuantity: number;
  lowStock: boolean;
};

export type InventoryReport = {
  threshold: number;
  totalUnits: number;
  totalAvailable: number;
  totalDamaged: number;
  lowStockCount: number;
  items: InventoryReportRow[];
};

export type LogisticsReport = {
  shipmentsByStatus: Record<ShipmentStatus, number>;
  ordersAwaitingShipment: Array<{ orderId: string; total: number; createdAt: string }>;
};

export type ReturnsReport = {
  returnsByStatus: Record<ReturnStatus, number>;
  refundsPending: { count: number; amount: number };
  refundsCompleted: { count: number; amount: number };
};

export const reportsApi = {
  summary: (signal?: AbortSignal) => api<SummaryReport>("/api/reports/summary", { signal }),
  // Fechas AAAA-MM-DD; "to" incluye el día completo
  sales: (query: { from?: string | undefined; to?: string | undefined }, signal?: AbortSignal) =>
    api<SalesReport>("/api/reports/sales", { query, signal }),
  inventory: (threshold: number, signal?: AbortSignal) => api<InventoryReport>("/api/reports/inventory", { query: { threshold }, signal }),
  logistics: (signal?: AbortSignal) => api<LogisticsReport>("/api/reports/logistics", { signal }),
  returns: (signal?: AbortSignal) => api<ReturnsReport>("/api/reports/returns", { signal }),
};
