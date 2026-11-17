import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { Home, LogOut, Menu, Store, X } from "lucide-react";
import { useCurrentUser, useAuth } from "@/auth/AuthContext";
import { roleLabel } from "@/auth/roles";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

// Navegación común. Cada rol irá sumando sus propias secciones en las siguientes fases.
const NAV = [
  { to: "/inicio", label: "Inicio", icon: Home },
  { to: "/catalogo", label: "Catálogo", icon: Store },
];

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

  const links = (
    <>
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setMenuOpen(false)}
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
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <NavLink to="/inicio" aria-label="Ir al inicio">
            <Logo />
          </NavLink>

          <nav className="ml-4 hidden items-center gap-1 md:flex">{links}</nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden items-center gap-3 border-l border-border pl-3 sm:flex">
              <div className="text-right leading-tight">
                <p className="max-w-40 truncate text-sm font-medium">{user.fullName}</p>
                <Badge tone="brand" className="mt-0.5">
                  {roleLabel(user.role)}
                </Badge>
              </div>
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-fg">
                {initials(user.fullName)}
              </span>
            </div>
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
              className="inline-flex size-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg md:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-border px-4 py-3 md:hidden">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-muted">{roleLabel(user.role)}</p>
              </div>
              <button type="button" onClick={handleLogout} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
                <LogOut className="size-4" /> Salir
              </button>
            </div>
            <nav className="flex flex-col gap-1">{links}</nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
