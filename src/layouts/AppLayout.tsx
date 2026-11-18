import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { Boxes, FileText, Home, LogOut, Menu, Package, RotateCcw, ShoppingCart, Store, Tags, X, type LucideIcon } from "lucide-react";
import type { UserRole } from "@/api/types";
import { useCart } from "@/features/buyer/hooks";
import { useCurrentUser, useAuth } from "@/auth/AuthContext";
import { roleLabel } from "@/auth/roles";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type NavItem = { to: string; label: string; icon: LucideIcon };

// Navegación común más las secciones de cada rol (los demás roles se suman en sus fases)
const COMMON_NAV: NavItem[] = [
  { to: "/inicio", label: "Inicio", icon: Home },
  { to: "/catalogo", label: "Catálogo", icon: Store },
];
const ROLE_NAV: Partial<Record<UserRole, NavItem[]>> = {
  BUYER: [
    { to: "/pedidos", label: "Pedidos", icon: Package },
    { to: "/facturas", label: "Facturas", icon: FileText },
    { to: "/devoluciones", label: "Devoluciones", icon: RotateCcw },
  ],
  SELLER: [
    { to: "/productos", label: "Productos", icon: Tags },
    { to: "/inventario", label: "Inventario", icon: Boxes },
    { to: "/pedidos", label: "Pedidos", icon: Package },
    { to: "/devoluciones", label: "Devoluciones", icon: RotateCcw },
  ],
};

// Acceso al carrito con el número de unidades (solo compradores con perfil)
function CartButton({ onClick }: { onClick: () => void }) {
  const cart = useCart();
  const units = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  return (
    <NavLink
      to="/carrito"
      onClick={onClick}
      aria-label={units > 0 ? `Carrito: ${units} unidades` : "Carrito"}
      title="Carrito"
      className={({ isActive }) =>
        cn(
          "relative inline-flex size-9 items-center justify-center rounded-xl transition-colors",
          isActive ? "bg-brand-soft text-brand-fg" : "text-muted hover:bg-surface-2 hover:text-fg"
        )
      }
    >
      <ShoppingCart className="size-4.5" />
      {units > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[0.65rem] font-semibold text-white tabular-nums">
          {units > 99 ? "99+" : units}
        </span>
      )}
    </NavLink>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppLayout() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isBuyer = user.role === "BUYER";
  const nav = [...COMMON_NAV, ...(ROLE_NAV[user.role] ?? [])];
  const closeMenu = () => setMenuOpen(false);
  const avatar = (
    <span className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-fg">
      {initials(user.fullName)}
    </span>
  );

  const links = (
    <>
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={closeMenu}
          className={({ isActive }) =>
            cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-brand-soft text-brand-fg" : "text-muted hover:bg-surface-2 hover:text-fg"
            )
          }
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/75 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <NavLink to="/inicio" aria-label="Ir al inicio">
            <Logo />
          </NavLink>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">{links}</nav>

          <div className="ml-auto flex items-center gap-2">
            {isBuyer && <CartButton onClick={closeMenu} />}
            <ThemeToggle />
            {isBuyer ? (
              <NavLink
                to="/perfil"
                title="Mi perfil"
                className="hidden items-center gap-3 rounded-xl border-l border-border py-1 pr-1 pl-3 transition-colors hover:bg-surface-2 sm:flex"
              >
                <div className="text-right leading-tight">
                  <p className="max-w-40 truncate text-sm font-medium">{user.fullName}</p>
                  <Badge tone="brand" className="mt-0.5">
                    {roleLabel(user.role)}
                  </Badge>
                </div>
                {avatar}
              </NavLink>
            ) : (
              <div className="hidden items-center gap-3 border-l border-border pl-3 sm:flex">
                <div className="text-right leading-tight">
                  <p className="max-w-40 truncate text-sm font-medium">{user.fullName}</p>
                  <Badge tone="brand" className="mt-0.5">
                    {roleLabel(user.role)}
                  </Badge>
                </div>
                {avatar}
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="hidden size-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg sm:inline-flex"
            >
              <LogOut className="size-4.5" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              className="inline-flex size-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-border px-4 py-3 lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-muted">
                  {roleLabel(user.role)}
                  {isBuyer && (
                    <>
                      {" · "}
                      <NavLink to="/perfil" onClick={closeMenu} className="text-brand-fg hover:underline">
                        Mi perfil
                      </NavLink>
                    </>
                  )}
                </p>
              </div>
              <button type="button" onClick={handleLogout} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
                <LogOut className="size-4" /> Salir
              </button>
            </div>
            <nav className="flex flex-col gap-1">{links}</nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 print:p-0">
        <Outlet />
      </main>
    </div>
  );
}
