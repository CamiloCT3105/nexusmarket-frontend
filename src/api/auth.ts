import { api } from "./client";
import type { LoginResponse, User } from "./types";

export type RegisterInput = {
  fullName: string;
  email: string;
  documentNumber: string;
  password: string;
};

export const authApi = {
  login: (email: string, password: string) =>
    api<LoginResponse>("/api/auth/login", { method: "POST", body: { email, password } }),

  // El registro público siempre crea compradores (el backend ignora cualquier rol enviado)
  register: (input: RegisterInput) => api<User>("/api/auth/register", { method: "POST", body: input }),

  me: (signal?: AbortSignal) => api<User>("/api/auth/me", { signal }),
};
