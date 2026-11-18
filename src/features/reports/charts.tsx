import type { ReactNode } from "react";
import { Link } from "react-router";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

// Barras horizontales de una sola serie: un solo tono (morado) porque el color no distingue categorías,
// solo marca la magnitud. Cada fila lleva su etiqueta y su valor en texto (no depende del color),
// y al pasar el cursor o enfocar la fila se muestra el detalle con la participación sobre el total.

export type Bar = { key: string; label: string; href?: string; value: number; hint?: string };

export function BarList({
  bars,
  format = (value) => String(value),
  emptyText = "Sin datos para mostrar.",
  ariaLabel,
}: {
  bars: Bar[];
  format?: (value: number) => string;
  emptyText?: string;
  ariaLabel: string;
}) {
  const max = Math.max(0, ...bars.map((bar) => bar.value));
  const total = bars.reduce((sum, bar) => sum + bar.value, 0);
  if (bars.length === 0 || max === 0) return <p className="text-sm text-muted">{emptyText}</p>;

  return (
    <ul className="space-y-2.5" aria-label={ariaLabel}>
      {bars.map((bar) => {
        const share = total > 0 ? Math.round((bar.value / total) * 100) : 0;
        const width = max > 0 ? (bar.value / max) * 100 : 0;
        return (
          <li
            key={bar.key}
            tabIndex={bar.href ? undefined : 0}
            className="group relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              {bar.href ? (
                <Link to={bar.href} className="min-w-0 truncate hover:text-brand-fg">
                  {bar.label}
                </Link>
              ) : (
                <span className="min-w-0 truncate">{bar.label}</span>
              )}
              <span className="shrink-0 font-medium tabular-nums">
                {format(bar.value)}
                <span className="sr-only">, {share}% del total</span>
              </span>
            </div>
            {/* Riel tenue + barra con el extremo redondeado anclada al inicio */}
            <div className="h-2 w-full rounded-full bg-surface-2">
              <div
                className="h-2 rounded-full bg-brand transition-[width] group-hover:bg-brand-hover"
                style={{ width: `${Math.max(width, bar.value > 0 ? 1.5 : 0)}%` }}
              />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 bottom-full z-10 mb-1 hidden rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-lg group-focus-within:block group-hover:block"
            >
              <span className="font-medium tabular-nums">{format(bar.value)}</span>
              <span className="text-muted"> · {share}% del total</span>
              {bar.hint && <span className="block text-muted">{bar.hint}</span>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Cifra destacada (no todo necesita un gráfico)
export function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  tone?: "success" | "warning" | "danger" | undefined;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-semibold tabular-nums",
          tone === "success" && "text-accent-fg",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

export function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}
