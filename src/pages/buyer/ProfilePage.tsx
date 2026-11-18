import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Home, MapPin, Plus, ShieldAlert } from "lucide-react";
import { buyersApi } from "@/api/buyers";
import type { Address, Buyer } from "@/api/types";
import { useCurrentUser } from "@/auth/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/PageLoader";
import { AddressForm } from "@/features/buyer/AddressForm";
import { buyerKey, useBuyerProfile } from "@/features/buyer/hooks";
import { errorMessage } from "@/lib/errors";

function AddressCard({ address, primary }: { address: Address; primary?: boolean }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-surface-2/50 p-4">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-fg">
        {primary ? <Home className="size-4" /> : <MapPin className="size-4" />}
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-medium">{address.street}</p>
        <p className="text-muted">
          {address.city}, {address.country} · CP {address.postalCode}
        </p>
      </div>
      {primary && <Badge tone="brand" className="ml-auto self-start">Principal</Badge>}
    </div>
  );
}

export function ProfilePage() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const profile = useBuyerProfile();
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const save = (buyer: Buyer, message: string) => {
    queryClient.setQueryData(buyerKey(user.id), buyer);
    setNotice(message);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Mi perfil" description="Tus datos de cuenta y las direcciones de entrega." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card className="h-fit p-5">
          <h2 className="font-semibold">Cuenta</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["Nombre", user.fullName],
              ["Correo", user.email],
              ["Documento", user.documentNumber],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted">{label}</dt>
                <dd className="font-medium break-all">{value}</dd>
              </div>
            ))}
            {profile.data && (
              <div>
                <dt className="text-muted">Estado comercial</dt>
                <dd className="mt-1">
                  {profile.data.commercialStatus === "ACTIVE" ? (
                    <Badge tone="success">
                      <BadgeCheck className="size-3" /> Activo
                    </Badge>
                  ) : (
                    <Badge tone="warning">
                      <ShieldAlert className="size-3" /> Restringido
                    </Badge>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <div className="space-y-4">
          {notice && <Alert tone="success">{notice}</Alert>}
          {profile.isPending ? (
            <PageLoader />
          ) : profile.error ? (
            <Alert tone="error">{errorMessage(profile.error, "No se pudo cargar tu perfil.")}</Alert>
          ) : profile.data === null ? (
            <Card className="p-5">
              <h2 className="text-lg font-semibold">Completa tu perfil de comprador</h2>
              <p className="mt-1 mb-5 text-sm text-muted">
                Registra tu dirección principal para poder usar el carrito y recibir tus pedidos.
              </p>
              <AddressForm
                submitLabel="Guardar y activar mi perfil"
                onSubmit={async (address) => save(await buyersApi.create(address), "¡Listo! Tu perfil de comprador está activo.")}
              />
            </Card>
          ) : (
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Direcciones</h2>
                {!adding && (
                  <Button variant="secondary" size="sm" icon={<Plus className="size-4" />} onClick={() => { setAdding(true); setNotice(null); }}>
                    Agregar
                  </Button>
                )}
              </div>
              <div className="mt-4 space-y-3">
                <AddressCard address={profile.data.primaryAddress} primary />
                {profile.data.additionalAddresses.map((address, index) => (
                  <AddressCard key={index} address={address} />
                ))}
              </div>
              {adding && (
                <div className="mt-5 border-t border-border pt-5">
                  <h3 className="mb-4 font-medium">Nueva dirección</h3>
                  <AddressForm
                    submitLabel="Guardar dirección"
                    onCancel={() => setAdding(false)}
                    onSubmit={async (address) => {
                      save(await buyersApi.addAddress(user.id, address), "Dirección agregada.");
                      setAdding(false);
                    }}
                  />
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
