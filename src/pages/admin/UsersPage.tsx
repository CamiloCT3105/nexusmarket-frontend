import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight, Search, UserPlus, Users } from "lucide-react";
import { usersApi } from "@/api/admin";
import type { UserStatus } from "@/api/types";
import { useCurrentUser } from "@/auth/AuthContext";
import { roleLabel } from "@/auth/roles";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/PageLoader";
import { Pagination } from "@/components/ui/Pagination";
import { Segmented } from "@/components/ui/Segmented";
import { useIsSupervisor } from "@/features/admin/hooks";
import { ALL_ROLES, USER_STATUS, initials } from "@/features/admin/labels";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

const PAGE_SIZE = 15;
type StatusFilter = UserStatus | "ALL";

export function UsersPage() {
  const me = useCurrentUser();
  const readOnly = useIsSupervisor();
  const [params, setParams] = useSearchParams();
  const role = ALL_ROLES.find((value) => value === params.get("rol"));
  const status: UserStatus | undefined =
    params.get("estado") === "bloqueados" ? "BLOCKED" : params.get("estado") === "activos" ? "ACTIVE" : undefined;
  const page = Math.max(1, Number(params.get("pagina")) || 1);

  const [search, setSearch] = useState(params.get("q") ?? "");
  const debounced = useDebouncedValue(search.trim());

  const update = (changes: Record<string, string | undefined>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        if (!("pagina" in changes)) next.delete("pagina");
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    if ((params.get("q") ?? "") !== debounced) update({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacciona solo al texto ya asentado; con más dependencias, limpiar los filtros devolvería el texto viejo
  }, [debounced]);

  const query = { role, status, search: params.get("q") ?? undefined, page, pageSize: PAGE_SIZE };
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["users", query],
    queryFn: ({ signal }) => usersApi.list(query, signal),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description={
          readOnly
            ? "Cuentas de la plataforma, con su rol y estado."
            : "Cuentas de la plataforma: crea usuarios de cualquier rol, bloquéalos o cambia su rol."
        }
        actions={
          readOnly ? undefined : (
            <Link to="/usuarios/nuevo">
              <Button icon={<UserPlus className="size-4" />}>Nuevo usuario</Button>
            </Link>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem] lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:items-end">
        <Input
          label="Buscar"
          placeholder="Nombre, correo o documento"
          leading={<Search className="size-4" />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label="Rol"
          value={role ?? ""}
          onChange={(event) => update({ rol: event.target.value || undefined })}
          options={[{ value: "", label: "Todos los roles" }, ...ALL_ROLES.map((value) => ({ value, label: roleLabel(value) }))]}
        />
        <div className="sm:col-span-2 lg:col-span-1">
          <Segmented<StatusFilter>
            label="Estado"
            value={status ?? "ALL"}
            onChange={(next) => update({ estado: next === "ALL" ? undefined : next === "BLOCKED" ? "bloqueados" : "activos" })}
            options={[
              { value: "ALL", label: "Todos" },
              { value: "ACTIVE", label: "Activos" },
              { value: "BLOCKED", label: "Bloqueados" },
            ]}
          />
        </div>
      </div>

      {error ? (
        <Alert tone="error">{errorMessage(error, "No se pudieron cargar los usuarios.")}</Alert>
      ) : isPending ? (
        <PageLoader />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="No hay usuarios con estos filtros"
          description="Prueba con otra búsqueda o quita los filtros."
        />
      ) : (
        <div className={cn("space-y-4 transition-opacity", isFetching && "opacity-60")}>
          <Card className="divide-y divide-border">
            {data.items.map((user) => (
              <Link
                key={user.id}
                to={`/usuarios/${user.id}`}
                className="group flex items-center gap-3 p-4 transition-colors hover:bg-surface-2/50"
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    user.status === "BLOCKED" ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand-fg",
                  )}
                >
                  {initials(user.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    <span className="truncate">{user.fullName}</span>
                    {user.id === me.id && <Badge tone="brand">Tú</Badge>}
                    {user.status === "BLOCKED" && (
                      <Badge tone="danger" className="sm:hidden">
                        {USER_STATUS.BLOCKED.label}
                      </Badge>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted">
                    <span className="sm:hidden">{roleLabel(user.role)} · </span>
                    {user.email}
                  </p>
                </div>
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <Badge>{roleLabel(user.role)}</Badge>
                  {user.status === "BLOCKED" && <Badge tone="danger">{USER_STATUS.BLOCKED.label}</Badge>}
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-fg" />
              </Link>
            ))}
          </Card>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={data.pageSize}
            onChange={(next) => {
              update({ pagina: next > 1 ? String(next) : undefined });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </div>
  );
}
