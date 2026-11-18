import { ApiError } from "@/api/client";

// Mensaje para mostrar: el del backend si lo hay, o uno genérico
export function errorMessage(error: unknown, fallback = "Ocurrió un error inesperado."): string {
  return error instanceof ApiError ? error.message : fallback;
}

// Para recursos que pueden no existir todavía (factura, envío): 404 → null en vez de error
export async function notFoundAsNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
