import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router";
import type { User, UserRole } from "@/api/types";
import { AuthContext, type AuthContextValue } from "@/auth/AuthContext";

export function makeUser(role: UserRole, overrides: Partial<User> = {}): User {
  return {
    id: `${role.toLowerCase()}-1`,
    fullName: "Ana Prueba",
    email: "ana@prueba.test",
    documentNumber: "1020304050",
    role,
    status: "ACTIVE",
    ...overrides,
  };
}

type Options = {
  // Usuario con sesión; null = sin sesión
  user?: User | null;
  // Ruta inicial y rutas adicionales (por ejemplo, el destino de una redirección)
  path?: string;
  route?: string;
  extraRoutes?: RouteObject[];
};

// Renderiza con lo mismo que la app real: sesión, caché de datos (sin reintentos) y enrutador en memoria
export function renderWithApp(ui: ReactElement, { user = null, path = "/", route = "/", extraRoutes = [] }: Options = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const auth: AuthContextValue = {
    ...(user ? { status: "authenticated" as const, user } : { status: "anonymous" as const, user: null }),
    login: () => Promise.reject(new Error("no disponible en pruebas")),
    register: () => Promise.reject(new Error("no disponible en pruebas")),
    logout: () => undefined,
  };
  const router = createMemoryRouter([{ path, element: ui }, ...extraRoutes], { initialEntries: [route] });
  const result = render(
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
  return { ...result, router, queryClient };
}

// URL y cuerpo de una llamada a fetch simulada
export function requestUrl(input: string | URL | Request | undefined): URL {
  if (input instanceof Request) return new URL(input.url);
  return new URL(input instanceof URL ? input.href : (input ?? ""), "http://localhost");
}

export function requestBody(init: RequestInit | undefined): unknown {
  return typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
}

// Respuesta JSON simulada para fetch
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
