import type { ReactElement, ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import type { UserRole } from "@/api/types";
import { Spinner } from "@/components/ui/Spinner";
import { WakingServerNotice } from "@/components/WakingServerNotice";
import { useAuth } from "./AuthContext";

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-brand-fg">
      <Spinner className="size-8" />
      <div className="max-w-sm">
        <WakingServerNotice />
      </div>
    </div>
  );
}

// Rutas que requieren sesión: sin ella, al login (recordando a dónde quería ir)
export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === "loading") return <FullScreenLoader />;
  if (auth.status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

// Login y registro: con sesión abierta no tiene sentido mostrarlos
export function RequireGuest() {
  const auth = useAuth();
  if (auth.status === "loading") return <FullScreenLoader />;
  if (auth.status === "authenticated") return <Navigate to="/inicio" replace />;
  return <Outlet />;
}

// Contenido solo para ciertos roles (el backend vuelve a validar cada petición)
export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const auth = useAuth();
  if (auth.status !== "authenticated" || !roles.includes(auth.user.role)) {
    return <Navigate to="/inicio" replace />;
  }
  return <>{children}</>;
}

// Una misma ruta con una pantalla distinta por rol (ej: /pedidos del comprador y del vendedor)
export function ByRole({ views }: { views: Partial<Record<UserRole, ReactElement>> }) {
  const auth = useAuth();
  const view = auth.status === "authenticated" ? views[auth.user.role] : undefined;
  return view ?? <Navigate to="/inicio" replace />;
}
