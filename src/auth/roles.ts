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
      { title: "Mis productos", description: "Crear productos, variantes y cambiar su estado.", to: "/productos" },
      { title: "Bodegas e inventario", description: "Ingresos de mercancía y unidades dañadas.", to: "/inventario" },
      { title: "Pedidos", description: "Pedidos que incluyen tus productos (solo tus líneas).", to: "/pedidos" },
      { title: "Devoluciones", description: "Aprueba o rechaza devoluciones de tus productos.", to: "/devoluciones" },
    ],
  },
  LOGISTICS_OPERATOR: {
    label: "Operador logístico",
    description: "Opera bodegas, despachos y entregas.",
    modules: [
      { title: "Catálogo", description: "Productos publicados.", to: "/catalogo" },
      { title: "Envíos", description: "Crear envíos de pedidos pagados y actualizar su seguimiento.", to: "/envios" },
      { title: "Inventario", description: "Ingresos y unidades dañadas en cualquier bodega.", to: "/inventario" },
      { title: "Bodegas", description: "Consulta de bodegas del marketplace y de vendedores.", to: "/inventario?vista=bodegas" },
    ],
  },
  ADMIN: {
    label: "Administrador",
    description: "Administra usuarios, vendedores, bodegas y la operación.",
    modules: [
      { title: "Catálogo", description: "Todos los productos, con filtro por estado y moderación.", to: "/catalogo" },
      { title: "Usuarios", description: "Crear usuarios de cualquier rol, bloquearlos y cambiar su rol.", to: "/usuarios" },
      { title: "Vendedores", description: "Habilitar cuentas de vendedor y crear sus bodegas.", to: "/usuarios?rol=SELLER" },
      { title: "Pedidos y facturación", description: "Todos los pedidos; generar la factura de los pagados.", to: "/pedidos" },
      { title: "Envíos", description: "Crear envíos, despacharlos y confirmar entregas.", to: "/envios" },
      { title: "Bodegas e inventario", description: "Bodegas del marketplace y de vendedores, ingresos y daños.", to: "/inventario?vista=bodegas" },
      { title: "Devoluciones y reembolsos", description: "Decidir devoluciones y registrar reembolsos pagados.", to: "/devoluciones" },
      { title: "Reportes", description: "Ventas, inventario, logística y devoluciones.", to: "/reportes" },
    ],
  },
  SUPERVISOR: {
    label: "Supervisor",
    description: "Consulta y seguimiento operativo.",
    modules: [
      { title: "Reportes", description: "Ventas, inventario, logística y devoluciones.", to: "/reportes" },
      { title: "Pedidos", description: "Todos los pedidos, con su factura, envío y devoluciones.", to: "/pedidos" },
      { title: "Envíos", description: "Seguimiento de cada envío hasta la entrega.", to: "/envios" },
      { title: "Inventario y bodegas", description: "Existencias en todas las bodegas y bajo stock.", to: "/inventario" },
      { title: "Devoluciones y reembolsos", description: "Solicitudes y reembolsos de toda la plataforma.", to: "/devoluciones" },
      { title: "Usuarios", description: "Cuentas de la plataforma, con su rol y estado.", to: "/usuarios" },
      { title: "Catálogo", description: "Todos los productos, con filtro por estado.", to: "/catalogo" },
    ],
  },
};

export function roleLabel(role: UserRole): string {
  return ROLES[role].label;
}
