import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { returnsApi } from "@/api/returns";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { QuantityStepper } from "@/features/buyer/QuantityStepper";
import { errorMessage } from "@/lib/errors";

// Solicitud de devolución de un producto de un pedido entregado.
// El backend vuelve a validar las unidades disponibles (incluso con solicitudes simultáneas).
export function ReturnForm({
  orderId,
  productId,
  maxQuantity,
  onDone,
  onCancel,
}: {
  orderId: string;
  productId: string;
  maxQuantity: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();

  const create = useMutation({
    mutationFn: returnsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["returns"] });
      onDone();
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!reason.trim()) {
      setReasonError("Cuéntanos el motivo de la devolución.");
      return;
    }
    create.mutate({ orderId, productId, quantity, reason: reason.trim() });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-3 rounded-xl border border-border bg-surface-2/50 p-4">
      {create.error && <Alert tone="error">{errorMessage(create.error, "No se pudo registrar la devolución.")}</Alert>}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">Unidades a devolver</span>
        <QuantityStepper value={quantity} onChange={setQuantity} max={maxQuantity} />
        <span className="text-xs text-muted">Máximo {maxQuantity}</span>
      </div>
      <Textarea
        label="Motivo"
        placeholder="Ej.: llegó con un defecto de fábrica"
        value={reason}
        maxLength={500}
        onChange={(e) => {
          setReason(e.target.value);
          setReasonError(undefined);
        }}
        error={reasonError}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={create.isPending}>
          Enviar solicitud
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
