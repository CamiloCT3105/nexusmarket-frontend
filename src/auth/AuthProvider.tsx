import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi, type RegisterInput } from "@/api/auth";
import { onUnauthorized, tokenStore } from "@/api/client";
import type { User } from "@/api/types";
import { AuthContext, type AuthContextValue, type AuthState } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(() =>
    tokenStore.get() ? { status: "loading", user: null } : { status: "anonymous", user: null },
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    queryClient.clear(); // ningún dato de este usuario queda en caché para el siguiente
    setState({ status: "anonymous", user: null });
  }, [queryClient]);

  // Al abrir la app con un token guardado, se confirma con el backend quién es y qué rol tiene AHORA
  // (si un administrador lo bloqueó o le cambió el rol, se refleja aquí).
  useEffect(() => {
    if (!tokenStore.get()) return;
    const controller = new AbortController();
    authApi
      .me(controller.signal)
      .then((user) => setState({ status: "authenticated", user }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        logout();
      });
    return () => controller.abort();
  }, [logout]);

  // Token vencido o cuenta bloqueada mientras se usa la app
  useEffect(() => onUnauthorized(logout), [logout]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { token, user } = await authApi.login(email, password);
    tokenStore.set(token);
    setState({ status: "authenticated", user });
    return user;
  }, []);

  const register = useCallback(
    async (input: RegisterInput): Promise<User> => {
      await authApi.register(input);
      return login(input.email, input.password); // tras registrarse, entra directamente
    },
    [login],
  );

  const value = useMemo<AuthContextValue>(() => ({ ...state, login, register, logout }), [state, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
