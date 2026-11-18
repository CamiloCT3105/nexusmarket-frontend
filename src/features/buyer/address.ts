import type { Address } from "@/api/types";

// Dirección en una línea: "Calle 1 # 2-3, Bogotá (110111), Colombia"
export function formatAddress(address: Address): string {
  return `${address.street}, ${address.city} (${address.postalCode}), ${address.country}`;
}
