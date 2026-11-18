import { useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import type { Address } from "@/api/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

const EMPTY: Address = { street: "", city: "", country: "Colombia", postalCode: "" };

// Mensajes con el género correcto de cada campo
const REQUIRED: Record<keyof Address, string> = {
  street: "La dirección es obligatoria.",
  city: "La ciudad es obligatoria.",
  country: "El país es obligatorio.",
  postalCode: "El código postal es obligatorio.",
};

const LABELS: Record<keyof Address, string> = {
  street: "Dirección",
  city: "Ciudad",
  country: "País",
  postalCode: "Código postal",
};

// Mismas reglas del backend: los cuatro campos son obligatorios
export function AddressForm({
  submitLabel,
  onSubmit,
  onCancel,
}: {
  submitLabel: string;
  onSubmit: (address: Address) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const [address, setAddress] = useState<Address>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof Address) => (value: string) => {
    setAddress((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed: Address = {
      street: address.street.trim(),
      city: address.city.trim(),
      country: address.country.trim(),
      postalCode: address.postalCode.trim(),
    };
    const nextErrors: Partial<Record<keyof Address, string>> = {};
    for (const field of Object.keys(LABELS) as Array<keyof Address>) {
      if (!trimmed[field]) nextErrors[field] = REQUIRED[field];
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setServerError(null);
    try {
      await onSubmit(trimmed);
      setAddress(EMPTY);
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "No se pudo guardar la dirección.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && <Alert tone="error">{serverError}</Alert>}
      <Input
        label={LABELS.street}
        placeholder="Calle 10 # 20-30, apto 501"
        autoComplete="street-address"
        value={address.street}
        onChange={(e) => set("street")(e.target.value)}
        error={errors.street}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label={LABELS.city} autoComplete="address-level2" value={address.city} onChange={(e) => set("city")(e.target.value)} error={errors.city} />
        <Input label={LABELS.country} autoComplete="country-name" value={address.country} onChange={(e) => set("country")(e.target.value)} error={errors.country} />
        <Input
          label={LABELS.postalCode}
          autoComplete="postal-code"
          inputMode="numeric"
          value={address.postalCode}
          onChange={(e) => set("postalCode")(e.target.value)}
          error={errors.postalCode}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

export function formatAddress(address: Address): string {
  return `${address.street}, ${address.city} (${address.postalCode}), ${address.country}`;
}
