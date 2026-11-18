// Cliente HTTP único para la API de NexusMarket.
// - Agrega el token (Authorization: Bearer) si hay sesión.
// - Convierte las respuestas de error del backend ({ message }) en ApiError.
// - Si el backend responde 401 con sesión abierta, avisa para cerrarla (token vencido o usuario bloqueado).

export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const TOKEN_KEY = "nexus-token";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Token ─────────────────────────────────────────────────────────────────────

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Sin almacenamiento: la sesión dura hasta recargar
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // nada que limpiar
    }
  },
};

const unauthorizedListeners = new Set<() => void>();
export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

// ─── Peticiones ────────────────────────────────────────────────────────────────

type QueryValue = string | number | boolean | undefined | null;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal | undefined;
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(API_URL + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    // Los filtros vacíos no se envían: el backend los interpreta como "sin filtro"
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : null,
      signal: options.signal ?? null,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.", 0);
  }

  const data: unknown = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : `Error inesperado (${response.status}).`;
    if (response.status === 401 && token) unauthorizedListeners.forEach((listener) => listener());
    throw new ApiError(message, response.status);
  }

  return data as T;
}
