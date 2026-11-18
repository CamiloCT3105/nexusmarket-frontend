import { Link, useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight, PackageOpen } from "lucide-react";
import { ordersApi } from "@/api/orders";
import type { OrderStatus } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/PageLoader";
import { Pagination } from "@/components/ui/Pagination";
import { Segmented } from "@/components/ui/Segmented";
import { useProductsById } from "@/features/buyer/hooks";
import { ORDER_STATUS, ORDER_STEPS } from "@/features/orders/labels";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, formatMoney, shortId } from "@/lib/format";

const PAGE_SIZE = 10;
type Filter = OrderStatus | "ALL";

export function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const rawStatus = params.get("estado");
  const status = ORDER_STEPS.find((step) => step === rawStatus);
  const page = Math.max(1, Number(params.get("pagina")) || 1);

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["orders", { status, page }],
    queryFn: ({ signal }) => ordersApi.list({ status, page, pageSize: PAGE_SIZE }, signal),
    placeholderData: keepPreviousData,
  });
  const { products } = useProductsById(data?.items.flatMap((order) => order.items.map((item) => item.productId)) ?? []);

  const setFilter = (next: Filter) => setParams(next === "ALL" ? {} : { estado: next }, { replace: true });

  return (
    <div className="space-y-6">
      <PageHeader title="Mis pedidos" description="Estado, pago, factura y envío de cada compra." />

      <Segmented<Filter>
        label="Filtrar por estado"
        value={status ?? "ALL"}
        onChange={setFilter}
        options={[{ value: "ALL", label: "Todos" }, ...ORDER_STEPS.map((step) => ({ value: step, label: ORDER_STATUS[step].label }))]}
      />

      {error ? (
        <Alert tone="error">{errorMessage(error, "No se pudieron cargar tus pedidos.")}</Alert>
      ) : isPending ? (
        <PageLoader />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<PackageOpen className="size-6" />}
          title={status ? "No hay pedidos en este estado" : "Aún no tienes pedidos"}
          description={status ? "Prueba con otro filtro." : "Cuando confirmes una compra desde el carrito, aparecerá aquí."}
          action={
            !status && (
              <Link to="/catalogo">
                <Button>Explorar catálogo</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
          {data.items.map((order) => {
            const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const names = order.items.map((item) => products.get(item.productId)?.name).filter(Boolean);
            return (
              <Link key={order.id} to={`/pedidos/${order.id}`} className="group block">
                <Card className="flex items-center gap-4 p-4 transition-colors group-hover:border-brand/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-semibold">Pedido #{shortId(order.id)}</span>
                      <Badge tone={ORDER_STATUS[order.status].tone}>{ORDER_STATUS[order.status].label}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted">{names.length > 0 ? names.join(" · ") : " "}</p>
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
                setParams(
                  (current) => {
                    const updated = new URLSearchParams(current);
                    if (next > 1) updated.set("pagina", String(next));
                    else updated.delete("pagina");
                    return updated;
                  },
                  { replace: true }
                );
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
