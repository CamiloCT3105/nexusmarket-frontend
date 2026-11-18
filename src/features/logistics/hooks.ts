import { useQuery } from "@tanstack/react-query";
import { warehousesApi } from "@/api/seller";

// Todas las bodegas (marketplace y de vendedores). El máximo por página del backend es 100.
export function useAllWarehouses() {
  return useQuery({
    queryKey: ["warehouses", "all"],
    queryFn: ({ signal }) => warehousesApi.list({ pageSize: 100 }, signal),
    staleTime: 5 * 60_000,
    select: (page) => page.items,
  });
}
