import { Link, useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { HandCoins, RotateCcw } from "lucide-react";
import { refundsApi, returnsApi } from "@/api/returns";
import type { ReturnStatus } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/PageLoader";
import { Pagination } from "@/components/ui/Pagination";
import { Segmented } from "@/components/ui/Segmented";
import { useProductsById } from "@/features/buyer/hooks";
import { REFUND_STATUS, RETURN_STATUS } from "@/features/orders/labels";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, formatMoney, shortId } from "@/lib/format";

const PAGE_SIZE = 10;
type View = "devoluciones" | "reembolsos";
type ReturnFilter = ReturnStatus | "ALL";
const RETURN_STATUSES = Object.keys(RETURN_STATUS) as ReturnStatus[];

function usePageParam(params: URLSearchParams, setParams: ReturnType<typeof useSearchParams>[1]) {
  const page = Math.max(1, Number(params.get("pagina")) || 1);
  const setPage = (next: number) => {
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
  };
  return [page, setPage] as const;
}

function ReturnsList() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = usePageParam(params, setParams);
  const status = RETURN_STATUSES.find((value) => value === params.get("estado"));

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["returns", { status, page }],
    queryFn: ({ signal }) => returnsApi.list({ status, page, pageSize: PAGE_SIZE }, signal),
    placeholderData: keepPreviousData,
  });
  const { products } = useProductsById(data?.items.map((request) => request.productId) ?? []);

  return (
    <div className="space-y-4">
      <Segmented<ReturnFilter>
        label="Filtrar devoluciones por estado"
        value={status ?? "ALL"}
        onChange={(next) => setParams(next === "ALL" ? {} : { estado: next }, { replace: true })}
        options={[{ value: "ALL", label: "Todas" }, ...RETURN_STATUSES.map((value) => ({ value, label: RETURN_STATUS[value].label }))]}
      />
      {error ? (
        <Alert tone="error">{errorMessage(error, "No se pudieron cargar tus devoluciones.")}</Alert>
      ) : isPending ? (
        <PageLoader />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<RotateCcw className="size-6" />}
          title={status ? "No hay devoluciones en este estado" : "No has solicitado devoluciones"}
          description="Puedes solicitar una desde el detalle de un pedido entregado."
        />
      ) : (
        <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
          {data.items.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    {request.quantity} × {products.get(request.productId)?.name ?? `Producto ${shortId(request.productId)}`}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">“{request.reason}”</p>
                </div>
                <Badge tone={RETURN_STATUS[request.status].tone}>{RETURN_STATUS[request.status].label}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted">
                Solicitud #{shortId(request.id)} · {formatDateTime(request.createdAt)} ·{" "}
                <Link to={`/pedidos/${request.orderId}`} className="text-brand-fg hover:underline">
                  Pedido #{shortId(request.orderId)}
                </Link>
              </p>
            </Card>
          ))}
          <div className="pt-4">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}

function RefundsList() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = usePageParam(params, setParams);
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["refunds", { page }],
    queryFn: ({ signal }) => refundsApi.list({ page, pageSize: PAGE_SIZE }, signal),
    placeholderData: keepPreviousData,
  });

  if (error) return <Alert tone="error">{errorMessage(error, "No se pudieron cargar tus reembolsos.")}</Alert>;
  if (isPending) return <PageLoader />;
  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={<HandCoins className="size-6" />}
        title="Aún no tienes reembolsos"
        description="Cuando el vendedor aprueba una devolución se genera un reembolso automáticamente."
      />
    );
  }
  return (
    <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
      {data.items.map((refund) => (
        <Card key={refund.id} className="flex items-center gap-4 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-fg">
            <HandCoins className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold tabular-nums">{formatMoney(refund.amount)}</p>
            <p className="text-xs text-muted">
              Reembolso #{shortId(refund.id)} · devolución #{shortId(refund.returnId)} · {formatDateTime(refund.createdAt)}
            </p>
          </div>
          <Badge tone={REFUND_STATUS[refund.status].tone}>{REFUND_STATUS[refund.status].label}</Badge>
        </Card>
      ))}
      <div className="pt-4">
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={setPage} />
      </div>
    </div>
  );
}

export function ReturnsPage() {
  const [params, setParams] = useSearchParams();
  const view: View = params.get("vista") === "reembolsos" ? "reembolsos" : "devoluciones";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devoluciones y reembolsos"
        description="El vendedor revisa cada solicitud; si la aprueba, se genera el reembolso."
        actions={
          <Segmented<View>
            label="Vista"
            value={view}
            onChange={(next) => setParams(next === "reembolsos" ? { vista: "reembolsos" } : {}, { replace: true })}
            options={[
              { value: "devoluciones", label: "Devoluciones" },
              { value: "reembolsos", label: "Reembolsos" },
            ]}
          />
        }
      />
      {view === "devoluciones" ? <ReturnsList /> : <RefundsList />}
    </div>
  );
}
