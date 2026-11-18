import { useQueries } from "@tanstack/react-query";
import { usersApi } from "@/api/admin";
import type { User } from "@/api/types";

// Usuarios por id (nombres de compradores en pedidos, facturas y devoluciones). Comparte caché con el detalle.
export function useUsersById(ids: string[]) {
  const unique = [...new Set(ids)];
  return useQueries({
    queries: unique.map((id) => ({
      queryKey: ["user", id],
      queryFn: ({ signal }: { signal: AbortSignal }) => usersApi.get(id, signal),
      staleTime: 5 * 60_000,
    })),
    combine: (results) => {
      const map = new Map<string, User>();
      results.forEach((result, index) => {
        const id = unique[index];
        if (id && result.data) map.set(id, result.data);
      });
      return map;
    },
  });
}
