import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { buyersApi } from "@/api/buyers";
import { cartApi } from "@/api/cart";
import { ApiError } from "@/api/client";
import { productsApi } from "@/api/products";
import type { Cart, Product } from "@/api/types";
import { useCurrentUser } from "@/auth/AuthContext";

export const buyerKey = (userId: string) => ["buyer", userId] as const;
export const cartKey = (userId: string) => ["cart", userId] as const;

// Perfil de comprador de la sesión. Registrarse no lo crea: null significa "aún sin perfil"
// (el backend responde 404 y el carrito no funciona hasta registrar una dirección principal).
export function useBuyerProfile() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: buyerKey(user.id),
    enabled: user.role === "BUYER",
    queryFn: async ({ signal }) => {
      try {
        return await buyersApi.get(user.id, signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });
}

export function useCart() {
  const user = useCurrentUser();
  const profile = useBuyerProfile();
  const query = useQuery({
    queryKey: cartKey(user.id),
    enabled: Boolean(profile.data),
    queryFn: ({ signal }) => cartApi.get(user.id, signal),
  });
  return { ...query, hasProfile: Boolean(profile.data), profileLoading: profile.isPending && user.role === "BUYER" };
}

// Cada operación del carrito devuelve el carrito actualizado: se guarda directo en la caché
export function useCartActions() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const onSuccess = (cart: Cart) => queryClient.setQueryData(cartKey(user.id), cart);

  return {
    add: useMutation({
      mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) => cartApi.add(user.id, productId, quantity),
      onSuccess,
    }),
    setQuantity: useMutation({
      mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) => cartApi.setQuantity(user.id, productId, quantity),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (productId: string) => cartApi.remove(user.id, productId),
      onSuccess,
    }),
  };
}

// Carrito, pedidos y devoluciones guardan solo el id del producto: se consultan los productos
// (con la misma clave de caché que el detalle, así no se piden dos veces).
export function useProductsById(ids: string[]) {
  const unique = [...new Set(ids)];
  return useQueries({
    queries: unique.map((id) => ({
      queryKey: ["product", id],
      queryFn: ({ signal }: { signal: AbortSignal }) => productsApi.get(id, signal),
      staleTime: 5 * 60_000,
    })),
    combine: (results) => {
      const map = new Map<string, Product>();
      results.forEach((result, index) => {
        const id = unique[index];
        if (id && result.data) map.set(id, result.data);
      });
      return { products: map, isPending: results.some((result) => result.isPending) };
    },
  });
}
