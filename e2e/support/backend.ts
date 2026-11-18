import { randomBytes } from "node:crypto";

// Preparación de datos por la API (más rápido y estable que hacerlo por la interfaz).
// Cada ejecución crea sus propias cuentas y productos con un sufijo único: no depende de datos previos.

export const API_URL = (process.env.E2E_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const ADMIN = { email: process.env.E2E_ADMIN_EMAIL ?? "", password: process.env.E2E_ADMIN_PASSWORD ?? "" };

type Method = "GET" | "POST" | "PATCH";

export async function call<T>(method: Method, path: string, token?: string, body?: unknown): Promise<T> {
  const response = await fetch(API_URL + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : null,
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${method} ${path} → ${response.status} ${JSON.stringify(data)}`);
  return data as T;
}

export async function login(email: string, password: string): Promise<string> {
  const { token } = await call<{ token: string }>("POST", "/api/auth/login", undefined, { email, password });
  return token;
}

export type Account = { id: string; email: string; password: string; fullName: string };

// Sufijo único por ejecución: correos y documentos no chocan con ejecuciones anteriores
export const RUN = `${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
const digits = () => String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 90) + 10);

export function newAccountData(prefix: string) {
  return {
    fullName: `${prefix} E2E ${RUN}`,
    email: `${prefix.toLowerCase()}.${RUN}@e2e.test`,
    documentNumber: `E2E${digits()}`,
    password: `E2e-${randomBytes(9).toString("base64url")}`,
  };
}

export async function createUser(adminToken: string, prefix: string, role: string): Promise<Account> {
  const data = newAccountData(prefix);
  const user = await call<{ id: string }>("POST", "/api/users", adminToken, { ...data, role });
  return { id: user.id, email: data.email, password: data.password, fullName: data.fullName };
}

export type Catalog = { seller: Account; operator: Account; productId: string; productName: string; warehouseId: string; price: number };

// Vendedor habilitado con bodega, un producto publicado y 5 unidades; más un operador logístico
export async function prepareCatalog(): Promise<Catalog> {
  const admin = await login(ADMIN.email, ADMIN.password);

  const seller = await createUser(admin, "Vendedor", "SELLER");
  await call("POST", "/api/sellers", admin, { userId: seller.id });
  const sellerToken = await login(seller.email, seller.password);

  const warehouse = await call<{ id: string }>("POST", "/api/warehouses", sellerToken, { type: "SELLER", location: `Bodega E2E ${RUN}` });
  const price = 50_000;
  const productName = `Producto E2E ${RUN}`;
  const product = await call<{ id: string }>("POST", "/api/products", sellerToken, {
    name: productName,
    description: "Creado por las pruebas de punta a punta.",
    price,
    type: "PHYSICAL",
  });
  await call("POST", "/api/inventory/inbound", sellerToken, { productId: product.id, warehouseId: warehouse.id, quantity: 5 });

  const operator = await createUser(admin, "Operador", "LOGISTICS_OPERATOR");
  return { seller, operator, productId: product.id, productName, warehouseId: warehouse.id, price };
}

export async function stockOf(productId: string, warehouseId: string): Promise<{ quantity: number; reservedQuantity: number }> {
  const admin = await login(ADMIN.email, ADMIN.password);
  const page = await call<{ items: Array<{ quantity: number; reservedQuantity: number }> }>(
    "GET",
    `/api/inventory?productId=${productId}&warehouseId=${warehouseId}`,
    admin,
  );
  const item = page.items[0];
  if (!item) throw new Error("Sin existencias para el producto de prueba");
  return item;
}
