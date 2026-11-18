import { useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, PackagePlus } from "lucide-react";
import { availableUnits } from "@/api/seller";
import type { InventoryItem, Product, Warehouse } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { shortId } from "@/lib/format";
import { StockForm, type StockMode } from "./StockForm";

const LOW_STOCK = 5;

function Figure({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("font-display text-lg font-semibold tabular-nums", className)}>{value}</p>
    </div>
  );
}

// Existencias por producto y bodega, con ingreso y unidades dañadas en cada fila
export function InventoryList({
  items,
  products,
  warehouses,
  hideProduct = false,
}: {
  items: InventoryItem[];
  products: Map<string, Product>;
  warehouses: Map<string, Warehouse>;
  hideProduct?: boolean;
}) {
  const [open, setOpen] = useState<{ key: string; mode: StockMode } | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const key = `${item.productId}:${item.warehouseId}`;
        const product = products.get(item.productId);
        const warehouse = warehouses.get(item.warehouseId);
        const available = availableUnits(item);
        const active = open?.key === key ? open.mode : null;

        return (
          <Card key={key} className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                {!hideProduct && (
                  <Link to={`/productos/${item.productId}`} className="block truncate font-medium hover:text-brand-fg">
                    {product?.name ?? `Producto ${shortId(item.productId)}`}
                  </Link>
                )}
                <p className={cn("text-sm text-muted", hideProduct && "font-medium text-fg")}>
                  {warehouse?.location ?? `Bodega ${shortId(item.warehouseId)}`}
                </p>
                {available === 0 ? (
                  <Badge tone="danger" className="mt-1">
                    <AlertTriangle className="size-3" /> Agotado
                  </Badge>
                ) : (
                  available <= LOW_STOCK && (
                    <Badge tone="warning" className="mt-1">
                      <AlertTriangle className="size-3" /> Pocas unidades
                    </Badge>
                  )
                )}
              </div>
              <div className="grid grid-cols-4 gap-3 sm:gap-6">
                <Figure label="Disponibles" value={available} className={available > 0 ? "text-accent-fg" : "text-danger"} />
                <Figure label="Reservadas" value={item.reservedQuantity} />
                <Figure label="Dañadas" value={item.damagedQuantity} />
                <Figure label="Total" value={item.quantity} className="text-muted" />
              </div>
            </div>

            {active ? (
              <div className="mt-4 border-t border-border pt-4">
                <StockForm
                  mode={active}
                  productId={item.productId}
                  warehouseId={item.warehouseId}
                  onDone={() => setOpen(null)}
                  onCancel={() => setOpen(null)}
                />
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setOpen({ key, mode: "damaged" })}>
                  Marcar dañadas
                </Button>
                <Button size="sm" variant="secondary" icon={<PackagePlus className="size-4" />} onClick={() => setOpen({ key, mode: "inbound" })}>
                  Ingreso
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
