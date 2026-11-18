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

// ─── Comprador ─────────────────────────────────────────────────────────────────

export type Address = { street: string; city: string; country: string; postalCode: string };
export type CommercialStatus = "ACTIVE" | "RESTRICTED";

export type Buyer = {
  userId: string;
  primaryAddress: Address;
  additionalAddresses: Address[];
  commercialStatus: CommercialStatus;
};

export type CartItem = { productId: string; quantity: number };
export type Cart = { buyerId: string; items: CartItem[] };

// ─── Pedidos y posventa ────────────────────────────────────────────────────────

export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "SHIPPED" | "DELIVERED";

export type OrderItem = { productId: string; warehouseId: string; quantity: number; unitPrice: number };

export type Order = {
  id: string;
  buyerId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  // Copia de la dirección elegida al confirmar. No llega en pedidos anteriores ni al vendedor.
  shippingAddress?: Address;
};

export type Invoice = { id: string; orderId: string; buyerId: string; amount: number; issuedAt: string };

export type ShipmentStatus = "PREPARING" | "IN_TRANSIT" | "DELIVERED";
export type ShipmentEvent = { status: ShipmentStatus; note: string; createdAt: string };
export type Shipment = { id: string; orderId: string; trackingCode: string; status: ShipmentStatus; events: ShipmentEvent[] };

export type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED";
export type ReturnRequest = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  reason: string;
  status: ReturnStatus;
  createdAt: string;
};

export type RefundStatus = "PENDING" | "COMPLETED";
export type Refund = { id: string; returnId: string; amount: number; status: RefundStatus; createdAt: string };

// ─── Vendedor ──────────────────────────────────────────────────────────────────

export type Seller = { userId: string; warehouseIds: string[] };

export type WarehouseType = "MARKETPLACE" | "SELLER";
export type Warehouse = { id: string; type: WarehouseType; sellerId?: string; location: string };

export type InventoryItem = {
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
};

// Un vendedor recibe solo sus líneas del pedido y el subtotal de ellas
export type SellerOrder = Order & { sellerSubtotal?: number };
