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
  productFitsWarehouse,
}: {
  mode: StockMode;
  products?: Product[];
  warehouses?: Warehouse[];
  productId?: string;
  warehouseId?: string;
  onDone?: () => void;
  onCancel?: () => void;
  // Limita los productos que se ofrecen según la bodega elegida
  productFitsWarehouse?: (product: Product, warehouse: Warehouse) => boolean;
}) {
  const queryClient = useQueryClient();
  const [chosenProduct, setProductId] = useState(fixedProduct ?? "");
  const [warehouseId, setWarehouseId] = useState(fixedWarehouse ?? warehouses?.[0]?.id ?? "");
  const warehouse = warehouses?.find((item) => item.id === warehouseId);
  const options = products?.filter((product) => !productFitsWarehouse || !warehouse || productFitsWarehouse(product, warehouse));
  // Si el producto elegido no aplica a la bodega nueva, se toma el primero disponible
  const productId = fixedProduct ?? (options?.some((product) => product.id === chosenProduct) ? chosenProduct : (options?.[0]?.id ?? ""));
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
      {!fixedWarehouse && warehouses && (
        <Select
          label="Bodega"
          value={warehouseId}
          onChange={(event) => setWarehouseId(event.target.value)}
          options={warehouses.map((item) => ({ value: item.id, label: item.location }))}
        />
      )}
      {!fixedProduct &&
        options &&
        (options.length > 0 ? (
          <Select
            label="Producto"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            options={options.map((product) => ({ value: product.id, label: product.name }))}
          />
        ) : (
          <Alert tone="info">No hay productos publicados que puedan ingresar a esta bodega.</Alert>
        ))}
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
