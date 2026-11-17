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
