import type { UserRole } from "@/api/types";

// Información de cada rol para la interfaz: nombre, descripción y módulos que tendrá.
// La seguridad real la aplica el backend; esto solo decide qué se muestra.

export type RoleModule = { title: string; description: string; to?: string };

export const ROLES: Record<UserRole, { label: string; description: string; modules: RoleModule[] }> = {
  BUYER: {
    label: "Comprador",
    description: "Explora el catálogo, compra y sigue tus pedidos.",
    modules: [
      { title: "Catálogo", description: "Busca y filtra productos publicados.", to: "/catalogo" },
      { title: "Mi perfil y direcciones", description: "Dirección principal y adicionales para tus entregas.", to: "/perfil" },
      { title: "Carrito y checkout", description: "Arma tu pedido y confirma la compra.", to: "/carrito" },
      { title: "Mis pedidos", description: "Pago, estado y seguimiento del envío.", to: "/pedidos" },
      { title: "Mis facturas", description: "Facturas de tus pedidos pagados, listas para imprimir.", to: "/facturas" },
      { title: "Devoluciones y reembolsos", description: "Solicita devoluciones de pedidos entregados.", to: "/devoluciones" },
    ],
  },
  SELLER: {
    label: "Vendedor",
    description: "Publica tus productos y administra tu inventario.",
    modules: [
      { title: "Catálogo", description: "Tus productos en cualquier estado y los publicados de otros.", to: "/catalogo" },
      { title: "Mis productos", description: "Crear productos, variantes y cambiar su estado." },
      { title: "Bodegas e inventario", description: "Ingresos de mercancía y unidades dañadas." },
      { title: "Pedidos", description: "Pedidos que incluyen tus productos (solo tus líneas)." },
      { title: "Devoluciones", description: "Aprueba o rechaza devoluciones de tus productos." },
    ],
  },
  LOGISTICS_OPERATOR: {
    label: "Operador logístico",
    description: "Opera bodegas, despachos y entregas.",
    modules: [
      { title: "Catálogo", description: "Productos publicados.", to: "/catalogo" },
      { title: "Envíos", description: "Crear envíos y actualizar su seguimiento." },
      { title: "Inventario", description: "Ingresos y unidades dañadas en cualquier bodega." },
      { title: "Bodegas", description: "Consulta de bodegas del marketplace y de vendedores." },
    ],
  },
  ADMIN: {
    label: "Administrador",
    description: "Administra usuarios, vendedores, bodegas y la operación.",
    modules: [
      { title: "Catálogo", description: "Todos los productos, con filtro por estado.", to: "/catalogo" },
      { title: "Usuarios", description: "Crear usuarios, cambiar estado y rol." },
      { title: "Vendedores y bodegas", description: "Incorporar vendedores y vincular bodegas." },
      { title: "Facturación y reembolsos", description: "Generar facturas y completar reembolsos." },
      { title: "Reportes", description: "Ventas, inventario, logística y devoluciones." },
    ],
  },
  SUPERVISOR: {
    label: "Supervisor",
    description: "Consulta y seguimiento operativo.",
    modules: [
      { title: "Catálogo", description: "Todos los productos, con filtro por estado.", to: "/catalogo" },
      { title: "Reportes", description: "Ventas, inventario, logística y devoluciones." },
      { title: "Pedidos y envíos", description: "Seguimiento de toda la operación." },
    ],
  },
};

export function roleLabel(role: UserRole): string {
  return ROLES[role].label;
}
