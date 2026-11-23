import { ImageIcon } from "lucide-react";
import type { ProductType } from "@/api/types";
import { Input } from "@/components/ui/Field";
import { ProductArt } from "@/features/catalog/ProductArt";
import { imageUrlError, MAX_IMAGE_URL_LENGTH } from "@/lib/imageUrl";

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  // Para la ilustración de respaldo de la vista previa
  previewId: string;
  name: string;
  type: ProductType;
};

// Campo de URL de la foto con vista previa. La foto vive en un servicio externo (por ejemplo, el
// almacenamiento de tu tienda o un banco de imágenes): la plataforma no guarda archivos.
export function ImageUrlField({ value, onChange, error, previewId, name, type }: Props) {
  const trimmed = value.trim();
  const preview = trimmed !== "" && !imageUrlError(trimmed) ? trimmed : undefined;
  return (
    <div className="flex items-start gap-4">
      <ProductArt
        id={previewId}
        type={type}
        name={name || "?"}
        imageUrl={preview}
        alt="Vista previa de la foto"
        className="mt-7 size-20 shrink-0 rounded-xl border border-border"
      />
      <div className="min-w-0 flex-1">
        <Input
          label="Foto (URL)"
          type="url"
          inputMode="url"
          placeholder="https://…/foto.jpg"
          hint="Opcional. Pega el enlace https de una imagen; si no carga, se muestra la ilustración."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          error={error}
          maxLength={MAX_IMAGE_URL_LENGTH}
          leading={<ImageIcon className="size-4" />}
        />
      </div>
    </div>
  );
}
