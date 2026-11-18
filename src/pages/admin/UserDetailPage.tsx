import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, MapPin, Package, ShieldCheck, Store, UserCog, Warehouse as WarehouseIcon } from "lucide-react";
import { adminBuyersApi, adminSellersApi, adminWarehousesApi, usersApi } from "@/api/admin";
import { buyersApi } from "@/api/buyers";
import { sellerProductsApi } from "@/api/products";
import { sellersApi, warehousesApi } from "@/api/seller";
import type { CommercialStatus, User, UserRole } from "@/api/types";
import { useCurrentUser } from "@/auth/AuthContext";
import { roleLabel } from "@/auth/roles";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/PageLoader";
import { Spinner } from "@/components/ui/Spinner";
import { Confirm } from "@/features/admin/Confirm";
import { useIsSupervisor } from "@/features/admin/hooks";
import { ALL_ROLES, COMMERCIAL_STATUS, ROLE_IMPLICATION, USER_STATUS, initials } from "@/features/admin/labels";
import { formatAddress } from "@/features/buyer/AddressForm";
import { STATUS_LABEL, STATUS_TONE } from "@/features/catalog/productLabels";
import { cn } from "@/lib/cn";
import { errorMessage, notFoundAsNull } from "@/lib/errors";
import { formatMoney, shortId } from "@/lib/format";

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-fg">{icon}</span>
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function useSaveUser(user: User) {
  const queryClient = useQueryClient();
  return (updated: User) => {
    queryClient.setQueryData(["user", user.id], updated);
    void queryClient.invalidateQueries({ queryKey: ["users"] });
  };
}

// Bloquear impide iniciar sesión y corta la sesión abierta en su siguiente petición
function AccountSection({ user, isMe }: { user: User; isMe: boolean }) {
  const save = useSaveUser(user);
  const [confirming, setConfirming] = useState(false);
  const blocked = user.status === "BLOCKED";
  const change = useMutation({
    mutationFn: () => usersApi.setStatus(user.id, blocked ? "ACTIVE" : "BLOCKED"),
    onSuccess: (updated) => {
      save(updated);
      setConfirming(false);
    },
  });

  return (
    <Section icon={<ShieldCheck className="size-4" />} title="Acceso a la cuenta">
      <p className="text-sm">
        <Badge tone={USER_STATUS[user.status].tone}>{USER_STATUS[user.status].label}</Badge>
        <span className="ml-2 text-muted">{blocked ? "No puede iniciar sesión." : "Puede iniciar sesión y operar según su rol."}</span>
      </p>
      <div className="mt-3">
        {isMe ? (
          <p className="text-xs text-muted">No puedes bloquear tu propia cuenta.</p>
        ) : confirming ? (
          <Confirm
            confirmLabel={blocked ? "Sí, desbloquear" : "Sí, bloquear"}
            danger={!blocked}
            loading={change.isPending}
            error={change.error}
            onConfirm={() => change.mutate()}
            onCancel={() => setConfirming(false)}
          >
            {blocked
              ? `¿Desbloquear a ${user.fullName}? Podrá volver a iniciar sesión.`
              : `¿Bloquear a ${user.fullName}? No podrá iniciar sesión y su sesión abierta dejará de funcionar. Sus pedidos y productos se conservan.`}
          </Confirm>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setConfirming(true)}>
            {blocked ? "Desbloquear cuenta" : "Bloquear cuenta"}
          </Button>
        )}
      </div>
    </Section>
  );
}

// El nuevo rol aplica de inmediato: el backend lee el rol actual en cada petición
function RoleSection({ user, isMe }: { user: User; isMe: boolean }) {
  const save = useSaveUser(user);
  const [role, setRole] = useState<UserRole>(user.role);
  const [confirming, setConfirming] = useState(false);
  const change = useMutation({
    mutationFn: () => usersApi.setRole(user.id, role),
    onSuccess: (updated) => {
      save(updated);
      setConfirming(false);
    },
  });

  return (
    <Section icon={<UserCog className="size-4" />} title="Rol">
      {isMe ? (
        <p className="text-sm text-muted">
          Eres {roleLabel(user.role).toLowerCase()}. Para evitar quedarte sin acceso, otro administrador debe cambiar tu rol.
        </p>
      ) : (
        <div className="space-y-3">
          <Select
            label="Rol del usuario"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as UserRole);
              setConfirming(false);
            }}
            options={ALL_ROLES.map((value) => ({ value, label: roleLabel(value) }))}
          />
          <p className="text-xs text-muted">{ROLE_IMPLICATION[role]}</p>
          {confirming ? (
            <Confirm
              confirmLabel="Sí, cambiar rol"
              loading={change.isPending}
              error={change.error}
              onConfirm={() => change.mutate()}
              onCancel={() => setConfirming(false)}
            >
              ¿Cambiar el rol de {user.fullName} de {roleLabel(user.role).toLowerCase()} a {roleLabel(role).toLowerCase()}? Aplica de inmediato.
            </Confirm>
          ) : (
            <Button size="sm" disabled={role === user.role} onClick={() => setConfirming(true)}>
              Cambiar rol
            </Button>
          )}
        </div>
      )}
    </Section>
  );
}

function SellerWarehouses({ userId }: { userId: string }) {
  const readOnly = useIsSupervisor();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | undefined>();
  const warehouses = useQuery({
    queryKey: ["warehouses", "seller", userId],
    queryFn: ({ signal }) => warehousesApi.bySeller(userId, signal),
  });
  const create = useMutation({
    mutationFn: () => adminWarehousesApi.create({ type: "SELLER", location: location.trim(), sellerId: userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      void queryClient.invalidateQueries({ queryKey: ["seller", userId] });
      setLocation("");
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!location.trim()) {
      setError("Escribe la ubicación de la bodega.");
      return;
    }
    setError(undefined);
    create.mutate();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Bodegas</p>
      {warehouses.error ? (
        <Alert tone="error">{errorMessage(warehouses.error)}</Alert>
      ) : warehouses.isPending ? (
        <Spinner className="size-5 text-brand-fg" />
      ) : warehouses.data.length === 0 ? (
        <p className="text-sm text-muted">Sin bodegas. Sin bodega no puede registrar existencias ni vender.</p>
      ) : (
        <ul className="space-y-1.5">
          {warehouses.data.map((warehouse) => (
            <li key={warehouse.id} className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 shrink-0 text-muted" />
              <Link to={`/inventario?bodega=${warehouse.id}`} className="hover:text-brand-fg">
                {warehouse.location}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!readOnly && (
      <form onSubmit={submit} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Input
            aria-label="Ubicación de la nueva bodega"
            placeholder="Ciudad o dirección de la bodega"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            error={error}
          />
        </div>
        <Button type="submit" variant="secondary" loading={create.isPending} icon={<WarehouseIcon className="size-4" />}>
          Crear bodega
        </Button>
      </form>
      )}
      {create.error && <Alert tone="error">{errorMessage(create.error, "No se pudo crear la bodega.")}</Alert>}
    </div>
  );
}

function SellerProducts({ userId }: { userId: string }) {
  const products = useQuery({
    queryKey: ["products", "seller", userId],
    queryFn: ({ signal }) => sellerProductsApi.all(userId, signal),
  });
  if (products.error) return <Alert tone="error">{errorMessage(products.error)}</Alert>;
  if (products.isPending) return <Spinner className="size-5 text-brand-fg" />;
  const shown = products.data.slice(0, 6);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Productos ({products.data.length})</p>
      {products.data.length === 0 ? (
        <p className="text-sm text-muted">Aún no ha publicado productos.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {shown.map((product) => (
            <li key={product.id}>
              <Link to={`/catalogo/${product.id}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2/60">
                <span className="min-w-0 flex-1 truncate">{product.name}</span>
                <span className="tabular-nums text-muted">{formatMoney(product.price)}</span>
                <Badge tone={STATUS_TONE[product.status]}>{STATUS_LABEL[product.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {products.data.length > shown.length && <p className="text-xs text-muted">y {products.data.length - shown.length} más en el catálogo.</p>}
    </div>
  );
}

// Un usuario con rol vendedor necesita que el administrador habilite su cuenta antes de vender
function SellerSection({ user }: { user: User }) {
  const readOnly = useIsSupervisor();
  const queryClient = useQueryClient();
  const seller = useQuery({
    queryKey: ["seller", user.id],
    queryFn: ({ signal }) => notFoundAsNull(sellersApi.get(user.id, signal)),
  });
  const onboard = useMutation({
    mutationFn: () => adminSellersApi.onboard(user.id),
    onSuccess: (created) => queryClient.setQueryData(["seller", user.id], created),
  });

  return (
    <Section icon={<Store className="size-4" />} title="Cuenta de vendedor">
      {seller.error ? (
        <Alert tone="error">{errorMessage(seller.error)}</Alert>
      ) : seller.isPending ? (
        <Spinner className="size-5 text-brand-fg" />
      ) : seller.data === null ? (
        <div className="space-y-3">
          <Alert tone="info">Su cuenta de vendedor aún no está habilitada: no puede publicar productos ni crear bodegas.</Alert>
          {onboard.error && <Alert tone="error">{errorMessage(onboard.error)}</Alert>}
          {!readOnly && (
            <Button loading={onboard.isPending} onClick={() => onboard.mutate()}>
              Habilitar como vendedor
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm">
            <Badge tone="success">Habilitado</Badge>
            <span className="ml-2 text-muted">Puede publicar productos y administrar su inventario.</span>
          </p>
          <SellerWarehouses userId={user.id} />
          <SellerProducts userId={user.id} />
        </div>
      )}
    </Section>
  );
}

function BuyerSection({ user }: { user: User }) {
  const readOnly = useIsSupervisor();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const buyer = useQuery({
    queryKey: ["buyer", user.id],
    queryFn: ({ signal }) => notFoundAsNull(buyersApi.get(user.id, signal)),
  });
  const current: CommercialStatus = buyer.data?.commercialStatus ?? "ACTIVE";
  const target: CommercialStatus = current === "ACTIVE" ? "RESTRICTED" : "ACTIVE";
  const change = useMutation({
    mutationFn: () => adminBuyersApi.setCommercialStatus(user.id, target),
    onSuccess: (updated) => {
      queryClient.setQueryData(["buyer", user.id], updated);
      setConfirming(false);
    },
  });

  return (
    <Section icon={<Package className="size-4" />} title="Perfil de comprador">
      {buyer.error ? (
        <Alert tone="error">{errorMessage(buyer.error)}</Alert>
      ) : buyer.isPending ? (
        <Spinner className="size-5 text-brand-fg" />
      ) : buyer.data === null ? (
        <p className="text-sm text-muted">Aún no completa su perfil con una dirección de entrega, así que no ha podido comprar.</p>
      ) : (
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Dirección principal</p>
            <p className="text-muted">{formatAddress(buyer.data.primaryAddress)}</p>
            {buyer.data.additionalAddresses.length > 0 && (
              <p className="mt-1 text-xs text-muted">
                + {buyer.data.additionalAddresses.length} {buyer.data.additionalAddresses.length === 1 ? "dirección adicional" : "direcciones adicionales"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <p>
              <Badge tone={COMMERCIAL_STATUS[current].tone}>{COMMERCIAL_STATUS[current].label}</Badge>
              <span className="ml-2 text-muted">{COMMERCIAL_STATUS[current].help}</span>
            </p>
            {readOnly ? null : confirming ? (
              <Confirm
                confirmLabel={target === "RESTRICTED" ? "Sí, restringir" : "Sí, quitar restricción"}
                loading={change.isPending}
                error={change.error}
                onConfirm={() => change.mutate()}
                onCancel={() => setConfirming(false)}
              >
                {target === "RESTRICTED"
                  ? `¿Marcar a ${user.fullName} como restringido comercialmente? Es una marca de seguimiento: no bloquea su acceso ni sus compras.`
                  : `¿Quitar la restricción comercial de ${user.fullName}?`}
              </Confirm>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setConfirming(true)}>
                {target === "RESTRICTED" ? "Restringir comercialmente" : "Quitar restricción"}
              </Button>
            )}
          </div>
          <Link to={`/pedidos?comprador=${user.id}`} className="inline-flex items-center gap-1 text-brand-fg hover:underline">
            Ver sus pedidos <ChevronRight className="size-4" />
          </Link>
        </div>
      )}
    </Section>
  );
}

export function UserDetailPage() {
  const { id = "" } = useParams();
  const me = useCurrentUser();
  const readOnly = useIsSupervisor();
  const location = useLocation();
  const created = (location.state as { created?: boolean } | null)?.created === true;
  const user = useQuery({ queryKey: ["user", id], queryFn: ({ signal }) => usersApi.get(id, signal) });

  const back = (
    <Link to="/usuarios" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Usuarios
    </Link>
  );

  if (user.isPending) return <PageLoader />;
  if (user.error) {
    return (
      <div className="space-y-4">
        {back}
        <Alert tone="error">{errorMessage(user.error, "No se pudo cargar el usuario.")}</Alert>
      </div>
    );
  }

  const data = user.data;
  const isMe = data.id === me.id;
  return (
    <div className="space-y-6">
      {back}
      {created && (
        <Alert tone="success">
          Usuario creado.{data.role === "SELLER" ? " Siguiente paso: habilita su cuenta de vendedor y crea su primera bodega." : " Ya puede iniciar sesión con la contraseña inicial."}
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <span
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold",
            data.status === "BLOCKED" ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand-fg"
          )}
        >
          {initials(data.fullName)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold sm:text-3xl">{data.fullName}</h1>
            <Badge tone="brand">{roleLabel(data.role)}</Badge>
            {data.status === "BLOCKED" && <Badge tone="danger">Bloqueado</Badge>}
            {isMe && <Badge>Tú</Badge>}
          </div>
          <p className="mt-1 truncate text-sm text-muted">
            {data.email} · Documento {data.documentNumber} · #{shortId(data.id)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          {data.role === "SELLER" && <SellerSection user={data} />}
          {data.role === "BUYER" && <BuyerSection user={data} />}
          {data.role !== "SELLER" && data.role !== "BUYER" && (
            <Section icon={<UserCog className="size-4" />} title="Qué puede hacer">
              <p className="text-sm text-muted">{ROLE_IMPLICATION[data.role]}</p>
            </Section>
          )}
        </div>
        <div className="space-y-6">
          {readOnly ? (
            <Section icon={<ShieldCheck className="size-4" />} title="Cuenta">
              <p className="text-sm">
                <Badge tone={USER_STATUS[data.status].tone}>{USER_STATUS[data.status].label}</Badge>
                <span className="ml-2 text-muted">{ROLE_IMPLICATION[data.role]}</span>
              </p>
            </Section>
          ) : (
            <>
              <AccountSection user={data} isMe={isMe} />
              <RoleSection key={data.role} user={data} isMe={isMe} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
