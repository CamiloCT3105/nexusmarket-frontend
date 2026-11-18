import { useQuery } from "@tanstack/react-query";
import { sellerProductsApi } from "@/api/products";
import { sellersApi, warehousesApi } from "@/api/seller";
import { useCurrentUser } from "@/auth/AuthContext";
import { notFoundAsNull } from "@/lib/errors";

export const sellerKey = (userId: string) => ["seller", userId] as const;
export const myWarehousesKey = (userId: string) => ["warehouses", "seller", userId] as const;
export const myProductsKey = (userId: string) => ["products", "seller", userId] as const;

// Cuenta de vendedor habilitada por el administrador. null = aún no habilitada (404)
export function useSellerProfile() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: sellerKey(user.id),
    enabled: user.role === "SELLER",
    queryFn: ({ signal }) => notFoundAsNull(sellersApi.get(user.id, signal)),
  });
}

export function useMyWarehouses() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: myWarehousesKey(user.id),
    enabled: user.role === "SELLER",
    queryFn: ({ signal }) => warehousesApi.bySeller(user.id, signal),
  });
}

// Todos los productos del vendedor (cualquier estado), para selectores y nombres
export function useMyProducts() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: myProductsKey(user.id),
    enabled: user.role === "SELLER",
    queryFn: ({ signal }) => sellerProductsApi.all(user.id, signal),
  });
}
