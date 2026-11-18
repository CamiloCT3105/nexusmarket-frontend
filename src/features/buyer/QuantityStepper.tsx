import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}) {
  const button =
    "flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className={cn("inline-flex items-center rounded-xl border border-border bg-surface p-0.5", className)}>
      <button
        type="button"
        className={button}
        aria-label="Quitar uno"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={button}
        aria-label="Agregar uno"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
