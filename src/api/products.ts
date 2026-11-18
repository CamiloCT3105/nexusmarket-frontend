import { api } from "./client";
import type { Page, Product, ProductSort, ProductStatus, ProductType } from "./types";

export type CatalogQuery = {
  search?: string | undefined;
  type?: ProductType | undefined;
  sellerId?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  status?: ProductStatus | undefined;
  sort?: ProductSort | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
};

export const productsApi = {
  // GET /api/products: el backend decide qué ve cada rol (comprador: solo publicados)
  search: (query: CatalogQuery, signal?: AbortSignal) =>
    api<Page<Product>>("/api/products", { query, signal }),

  get: (id: string, signal?: AbortSignal) => api<Product>(`/api/products/${encodeURIComponent(id)}`, { signal }),
};

export type NewProduct = { name: string; description: string; price: number; type: ProductType };

// Gestión del vendedor (el backend verifica que el producto sea suyo)
export const sellerProductsApi = {
  // Todos sus productos, en cualquier estado (sin paginar; para selectores)
  all: (sellerId: string, signal?: AbortSignal) =>
    api<Product[]>(`/api/products/seller/${encodeURIComponent(sellerId)}`, { signal }),
  create: (input: NewProduct) => api<Product>("/api/products", { method: "POST", body: input }),
  addVariant: (id: string, variant: { name: string; value: string }) =>
    api<Product>(`/api/products/${encodeURIComponent(id)}/variants`, { method: "PATCH", body: variant }),
  setStatus: (id: string, status: ProductStatus) =>
    api<Product>(`/api/products/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } }),
};
