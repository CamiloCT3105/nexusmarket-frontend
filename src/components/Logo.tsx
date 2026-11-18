import { useId } from "react";
import { cn } from "@/lib/cn";

// Único lugar donde morado y verde se mezclan: el degradado de la marca.
// Cada logo usa un id de degradado propio: si dos logos compartieran id y el primero
// estuviera oculto (display: none), el navegador no pintaría el degradado del segundo.
export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  const gradientId = `nexus-logo-${useId().replace(/:/g, "")}`;
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" className="fill-fg" />
        <path
          d="M9 23V9l14 14V9"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withText && (
        <span className="font-display text-lg font-semibold tracking-tight">
          Nexus<span className="text-brand-fg">Market</span>
        </span>
      )}
    </span>
  );
}
