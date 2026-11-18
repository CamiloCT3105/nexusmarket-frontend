import type { CommercialStatus, UserRole, UserStatus } from "@/api/types";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

export const ALL_ROLES: UserRole[] = ["BUYER", "SELLER", "LOGISTICS_OPERATOR", "SUPERVISOR", "ADMIN"];

export const USER_STATUS: Record<UserStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Activo", tone: "neutral" },
  BLOCKED: { label: "Bloqueado", tone: "danger" },
};

export const COMMERCIAL_STATUS: Record<CommercialStatus, { label: string; tone: Tone; help: string }> = {
  ACTIVE: { label: "Comercialmente activo", tone: "neutral", help: "Opera con normalidad en el marketplace." },
  RESTRICTED: { label: "Restringido", tone: "warning", help: "No puede confirmar pedidos; conserva su acceso, su carrito y sus pedidos." },
};

// Qué implica cada rol al asignarlo, para que el administrador decida con contexto
export const ROLE_IMPLICATION: Record<UserRole, string> = {
  BUYER: "Compra en el catálogo. Debe completar su perfil con una dirección para usar el carrito.",
  SELLER: "Publica productos. Después de asignar el rol hay que habilitar su cuenta de vendedor.",
  LOGISTICS_OPERATOR: "Crea envíos, los despacha y registra movimientos de inventario en cualquier bodega.",
  SUPERVISOR: "Consulta reportes, pedidos y envíos de toda la operación, sin modificar nada.",
  ADMIN: "Acceso total: usuarios, vendedores, bodegas, facturación y reembolsos.",
};

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
