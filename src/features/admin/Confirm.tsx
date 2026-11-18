import type { ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/lib/errors";

// Confirmación en línea para acciones con consecuencias (bloquear, cambiar rol, completar un reembolso)
export function Confirm({
  children,
  confirmLabel,
  danger = false,
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  loading: boolean;
  error?: unknown;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2 rounded-xl bg-surface-2/60 p-3 text-sm">
      <div>{children}</div>
      {Boolean(error) && <Alert tone="error">{errorMessage(error)}</Alert>}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" disabled={loading} onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
