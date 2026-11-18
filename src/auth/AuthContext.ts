import { createContext, useContext } from "react";
import type { User } from "@/api/types";
import type { RegisterInput } from "@/api/auth";

export type AuthState = { status: "loading"; user: null } | { status: "anonymous"; user: null } | { status: "authenticated"; user: User };

export type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return value;
}

// Atajo para pantallas que ya están protegidas por <RequireAuth>
export function useCurrentUser(): User {
  const auth = useAuth();
  if (auth.status !== "authenticated") throw new Error("Pantalla sin sesión: falta <RequireAuth>.");
  return auth.user;
}
