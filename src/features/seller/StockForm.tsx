import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/api/seller";
import type { Product, Warehouse } from "@/api/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { errorMessage } from "@/lib/errors";

export type StockMode = "inbound" | "damaged";

const COPY: Record<StockMode, { submit: string; quantity: string; hint: string }> = {
  inbound: { submit: "Registrar ingreso", quantity: "Unidades que ingresan", hint: "Se suman a las existencias de la bodega." },
  damaged: {
    submit: "Marcar como dañadas",
    quantity: "Unidades dañadas",
    hint: "Dejan de estar disponibles para la venta. Solo se pueden marcar unidades sin reservar.",
  },
};

// Ingreso de mercancía o unidades dañadas. Producto y bodega pueden venir fijos (acción sobre una fila)
// o elegirse en el formulario (primer ingreso de un producto en una bodega).
export function StockForm({
  mode,
  products,
  warehouses,
  productId: fixedProduct,
  warehouseId: fixedWarehouse,
  onDone,
  onCancel,
}: {
  mode: StockMode;
  products?: Product[];
  warehouses?: Warehouse[];
  productId?: string;
  warehouseId?: string;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState(fixedProduct ?? products?.[0]?.id ?? "");
  const [warehouseId, setWarehouseId] = useState(fixedWarehouse ?? warehouses?.[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | undefined>();

  const save = useMutation({
    mutationFn: mode === "inbound" ? inventoryApi.inbound : inventoryApi.damaged,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setQuantity("");
      onDone?.();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(quantity);
    if (!Number.isInteger(value) || value <= 0) {
      setError("Ingresa un número entero mayor a cero.");
      return;
    }
    if (!productId || !warehouseId) {
      setError("Elige el producto y la bodega.");
      return;
    }
    setError(undefined);
    save.mutate({ productId, warehouseId, quantity: value });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      {!fixedProduct && products && (
        <Select
          label="Producto"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          options={products.map((product) => ({ value: product.id, label: product.name }))}
        />
      )}
      {!fixedWarehouse && warehouses && (
        <Select
          label="Bodega"
          value={warehouseId}
          onChange={(event) => setWarehouseId(event.target.value)}
          options={warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.location }))}
        />
      )}
      <Input
        label={COPY[mode].quantity}
        hint={COPY[mode].hint}
        type="number"
        inputMode="numeric"
        min="1"
        step="1"
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
        error={error}
      />
      {save.error && <Alert tone="error">{errorMessage(save.error, "No se pudo registrar el movimiento.")}</Alert>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" size="sm" variant={mode === "damaged" ? "danger" : "primary"} loading={save.isPending}>
          {COPY[mode].submit}
        </Button>
      </div>
    </form>
  );
}
