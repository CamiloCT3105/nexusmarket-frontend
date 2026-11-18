import type { ProductStatus } from "@/api/types";

// Qué significa cada estado para el vendedor y cómo se nombra la acción que lleva a él
export const STATUS_ACTION: Record<ProductStatus, { action: string; help: string }> = {
  PUBLISHED: { action: "Publicar", help: "Visible en el catálogo; los compradores pueden agregarlo al carrito." },
  SUSPENDED: { action: "Suspender", help: "Oculto temporalmente del catálogo. Puedes volver a publicarlo." },
  DISCONTINUED: { action: "Descontinuar", help: "Ya no se vende. Queda en el historial de pedidos." },
};
