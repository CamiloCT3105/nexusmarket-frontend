import { Download, Package } from "lucide-react";
import type { ProductType } from "@/api/types";
import { cn } from "@/lib/cn";

// El backend aún no guarda imágenes de producto: se muestra una ilustración por tipo.
// Variación de tono determinística por id, siempre dentro de la gama morada (sin mezclar con verde).
function hueFor(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 255 + (hash % 35); // 255°–290°: violetas
}

export function ProductArt({ id, type, name, className }: { id: string; type: ProductType; name: string; className?: string }) {
  const hue = hueFor(id);
  const Icon = type === "DIGITAL" ? Download : Package;
  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 55% / 0.22), hsl(${hue + 20} 60% 40% / 0.06))`,
      }}
      aria-hidden="true"
    >
      <span className="absolute right-3 -bottom-3 font-display text-8xl leading-none font-bold text-fg/[0.06] select-none">
        {name.trim().charAt(0).toUpperCase()}
      </span>
      <Icon className="size-10 text-brand-fg" strokeWidth={1.5} />
    </div>
  );
}
