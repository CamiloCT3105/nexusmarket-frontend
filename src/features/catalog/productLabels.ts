import type { ProductSort, ProductStatus, ProductType } from "@/api/types";

export const TYPE_LABEL: Record<ProductType, string> = {
  PHYSICAL: "Físico",
  DIGITAL: "Digital",
};

export const STATUS_LABEL: Record<ProductStatus, string> = {
  PUBLISHED: "Publicado",
  SUSPENDED: "Suspendido",
  DISCONTINUED: "Descontinuado",
};

// Verde = disponible (estado positivo); los demás estados en tonos de advertencia o neutros
export const STATUS_TONE: Record<ProductStatus, "success" | "warning" | "neutral"> = {
  PUBLISHED: "success",
  SUSPENDED: "warning",
  DISCONTINUED: "neutral",
};

export const SORT_OPTIONS: Array<{ value: ProductSort; label: string }> = [
  { value: "newest", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "name_asc", label: "Nombre (A-Z)" },
];
