import { Link, useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight, PackageOpen, X } from "lucide-react";
import { ordersApi } from "@/api/orders";
import type { OrderStatus } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/PageLoader";
import { Pagination } from "@/components/ui/Pagination";
import { Segmented } from "@/components/ui/Segmented";
import { useUsersById } from "@/features/admin/hooks";
import { ORDER_STATUS, ORDER_STEPS } from "@/features/orders/labels";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, formatMoney, shortId } from "@/lib/format";

const PAGE_SIZE = 10;
type Filter = OrderStatus | "ALL";

// Todos los pedidos de la plataforma, con filtro por estado y por comprador (?comprador=)
export function AdminOrdersPage() {
  const [params, setParams] = useSearchParams();
  const status = ORDER_STEPS.find((step) => step === params.get("estado"));
  const buyerId = params.get("comprador") ?? undefined;
  const page = Math.max(1, Number(params.get("pagina")) || 1);

  const query = { status, buyerId, page, pageSize: PAGE_SIZE };
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["orders", query],
    queryFn: ({ signal }) => ordersApi.list(query, signal),
    placeholderData: keepPreviousData,
  });
  const users = useUsersById([...(data?.items.map((order) => order.buyerId) ?? []), ...(buyerId ? [buyerId] : [])]);

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
      { replace: true }
    );

  return (
    <div className="space-y-6">
      <PageHeader title="Pedidos" description="Todos los pedidos de la plataforma. Desde el detalle se genera la factura de los pedidos pagados." />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Segmented<Filter>
          label="Filtrar por estado"
          value={status ?? "ALL"}
          onChange={(next) => update({ estado: next === "ALL" ? undefined : next })}
          options={[{ value: "ALL", label: "Todos" }, ...ORDER_STEPS.map((step) => ({ value: step, label: ORDER_STATUS[step].label }))]}
        />
        {buyerId && (
          <button
            type="button"
            onClick={() => update({ comprador: undefined })}
            className="inline-flex items-center gap-1.5 self-start rounded-full bg-brand-soft px-3 py-1.5 text-sm text-brand-fg hover:opacity-80"
          >
            Comprador: {users.get(buyerId)?.fullName ?? shortId(buyerId)}
            <X className="size-3.5" aria-label="Quitar filtro de comprador" />
          </button>
        )}
      </div>

      {error ? (
        <Alert tone="error">{errorMessage(error, "No se pudieron cargar los pedidos.")}</Alert>
      ) : isPending ? (
        <PageLoader />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<PackageOpen className="size-6" />} title="No hay pedidos con estos filtros" />
      ) : (
        <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
          {data.items.map((order) => {
            const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <Link key={order.id} to={`/pedidos/${order.id}`} className="group block">
                <Card className="flex items-center gap-4 p-4 transition-colors group-hover:border-brand/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-semibold">Pedido #{shortId(order.id)}</span>
                      <Badge tone={ORDER_STATUS[order.status].tone}>{ORDER_STATUS[order.status].label}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm">{users.get(order.buyerId)?.fullName ?? `Comprador ${shortId(order.buyerId)}`}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDateTime(order.createdAt)} · {units} {units === 1 ? "unidad" : "unidades"}
                    </p>
                  </div>
                  <p className="font-display text-lg font-semibold tabular-nums">{formatMoney(order.total)}</p>
                  <ChevronRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-fg" />
                </Card>
              </Link>
            );
          })}
          <div className="pt-4">
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
        </div>
      )}
    </div>
  );
}
