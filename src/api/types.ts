// Tipos de la API de NexusMarket. Reflejan los modelos del backend (src/models).

export type UserRole = "BUYER" | "SELLER" | "LOGISTICS_OPERATOR" | "ADMIN" | "SUPERVISOR";
export type UserStatus = "ACTIVE" | "BLOCKED";

export type User = {
  id: string;
  fullName: string;
  email: string;
  documentNumber: string;
  role: UserRole;
  status: UserStatus;
};

export type ProductType = "PHYSICAL" | "DIGITAL";
export type ProductStatus = "PUBLISHED" | "SUSPENDED" | "DISCONTINUED";

export type Variant = { id: string; name: string; value: string };

export type Product = {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  type: ProductType;
  variants: Variant[];
  status: ProductStatus;
};

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc";

// Formato común de todos los listados paginados del backend
export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type LoginResponse = { token: string; user: User };
