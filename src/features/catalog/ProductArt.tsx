import { useState } from "react";
import { Download, Package } from "lucide-react";
import type { ProductType } from "@/api/types";
import { cn } from "@/lib/cn";

// Variación de tono determinística por id, siempre dentro de la gama morada (sin mezclar con verde).
function hueFor(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 255 + (hash % 35); // 255°–290°: violetas
}

type Props = {
  id: string;
  type: ProductType;
  name: string;
  imageUrl?: string | undefined;
  // Texto alternativo de la foto. Por defecto vacío: en tarjetas y listas el nombre ya está al lado
  alt?: string;
  className?: string;
};

// Foto del producto si tiene una; si no, o si el enlace falla, una ilustración por tipo.
export function ProductArt({ imageUrl, ...props }: Props) {
  // key: si cambia la URL, se vuelve a intentar cargarla (el estado de error se reinicia)
  return imageUrl ? <ProductPhoto key={imageUrl} imageUrl={imageUrl} {...props} /> : <Illustration {...props} />;
}

function ProductPhoto({ imageUrl, alt = "", ...props }: Props & { imageUrl: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Illustration {...props} />;
  return (
    <div className={cn("relative overflow-hidden bg-surface-2", props.className)}>
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="size-full object-cover object-[50%_30%]"
      />
    </div>
  );
}

function Illustration({ id, type, name, className }: Omit<Props, "imageUrl" | "alt">) {
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
