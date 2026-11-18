import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Check } from "lucide-react";
import { adminRefundsApi } from "@/api/admin";
import { returnsApi } from "@/api/returns";
import type { Refund, RefundStatus, ReturnRequest } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/PageLoader";
import { Pagination } from "@/components/ui/Pagination";
import { Segmented } from "@/components/ui/Segmented";
import { Confirm } from "@/features/admin/Confirm";
import { useIsSupervisor } from "@/features/admin/hooks";
import { useProductsById } from "@/features/buyer/hooks";
import { REFUND_STATUS } from "@/features/orders/labels";
import { ReturnRequests } from "@/pages/seller/SellerReturnsPage";
import { cn } from "@/lib/cn";
import { formatDateTime, formatMoney, shortId } from "@/lib/format";

const PAGE_SIZE = 10;
type View = "solicitudes" | "reembolsos";
type RefundFilter = RefundStatus | "ALL";

// Marcar como completado = el dinero ya se devolvió al comprador. No se puede deshacer.
function CompleteRefund({ refund }: { refund: Refund }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const complete = useMutation({
    mutationFn: () => adminRefundsApi.complete(refund.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["refunds"] });
      setConfirming(false);
    },
  });

  if (confirming) {
    return (
      <div className="mt-3">
        <Confirm
          confirmLabel="Sí, completado"
          loading={complete.isPending}
          error={complete.error}
          onConfirm={() => complete.mutate()}
          onCancel={() => setConfirming(false)}
        >
          ¿Confirmas que ya se devolvieron {formatMoney(refund.amount)} al comprador? <span className="text-muted">No se puede deshacer.</span>
        </Confirm>
      </div>
    );
  }
  return (
    <div className="mt-3 flex justify-end">
      <Button size="sm" variant="secondary" icon={<Check className="size-4" />} onClick={() => setConfirming(true)}>
        Marcar como completado
      </Button>
    </div>
  );
}

function Refunds() {
  const readOnly = useIsSupervisor();
  const [params, setParams] = useSearchParams();
  // Por defecto, los pendientes de pagar
  const raw = params.get("estado");
  const status: RefundStatus | undefined = raw === "todos" ? undefined : raw === "COMPLETED" ? "COMPLETED" : "PENDING";
  const page = Math.max(1, Number(params.get("pagina")) || 1);

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["refunds", { status, page }],
    queryFn: ({ signal }) => adminRefundsApi.list({ status, page, pageSize: PAGE_SIZE }, signal),
    placeholderData: keepPreviousData,
  });
  // Cada reembolso nace de una devolución aprobada: de ahí salen el producto y el pedido
  const requests = useQueries({
    queries: (data?.items ?? []).map((refund) => ({
      queryKey: ["return", refund.returnId],
      queryFn: ({ signal }: { signal: AbortSignal }) => returnsApi.get(refund.returnId, signal),
      staleTime: 5 * 60_000,
    })),
    combine: (results) => new Map(results.flatMap((result) => (result.data ? [[result.data.id, result.data] as [string, ReturnRequest]] : []))),
  });
  const { products } = useProductsById([...requests.values()].map((request) => request.productId));

  const setParam = (changes: Record<string, string | undefined>) =>
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
      <Segmented<RefundFilter>
        label="Filtrar reembolsos"
        value={status ?? "ALL"}
        onChange={(next) => setParam({ estado: next === "PENDING" ? undefined : next === "ALL" ? "todos" : next })}
        options={[
          { value: "PENDING", label: "Por pagar" },
          { value: "COMPLETED", label: "Completados" },
          { value: "ALL", label: "Todos" },
        ]}
      />
      {error ? (
        <Alert tone="error">No se pudieron cargar los reembolsos.</Alert>
      ) : isPending ? (
        <PageLoader />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<Banknote className="size-6" />}
          title={status === "PENDING" ? "No hay reembolsos por pagar" : "No hay reembolsos en este estado"}
          description="Se generan al aprobar una devolución."
        />
      ) : (
        <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
          {data.items.map((refund) => {
            const request = requests.get(refund.returnId);
            return (
              <Card key={refund.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold tabular-nums">{formatMoney(refund.amount)}</p>
                    <p className="text-sm text-muted">
                      {request
                        ? `${request.quantity} × ${products.get(request.productId)?.name ?? `Producto ${shortId(request.productId)}`}`
                        : `Devolución #${shortId(refund.returnId)}`}
                    </p>
                  </div>
                  <Badge tone={REFUND_STATUS[refund.status].tone}>{REFUND_STATUS[refund.status].label}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Reembolso #{shortId(refund.id)} · {formatDateTime(refund.createdAt)}
                  {request && (
                    <>
                      {" · "}
                      <Link to={`/pedidos/${request.orderId}`} className="text-brand-fg hover:underline">
                        Pedido #{shortId(request.orderId)}
                      </Link>
                    </>
                  )}
                </p>
                {refund.status === "PENDING" && !readOnly && <CompleteRefund refund={refund} />}
              </Card>
            );
          })}
          <div className="pt-4">
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              onChange={(next) => {
                setParam({ pagina: next > 1 ? String(next) : undefined });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminReturnsPage() {
  const readOnly = useIsSupervisor();
  const [params, setParams] = useSearchParams();
  const view: View = params.get("vista") === "reembolsos" ? "reembolsos" : "solicitudes";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devoluciones y reembolsos"
        description={
          readOnly
            ? "Solicitudes de devolución de toda la plataforma y estado de cada reembolso."
            : "Decide las solicitudes de cualquier vendedor y registra cuándo se devolvió el dinero."
        }
        actions={
          <Segmented<View>
            label="Vista"
            value={view}
            onChange={(next) => setParams(next === "reembolsos" ? { vista: "reembolsos" } : {}, { replace: true })}
            options={[
              { value: "solicitudes", label: "Solicitudes" },
              { value: "reembolsos", label: "Reembolsos" },
            ]}
          />
        }
      />
      {view === "reembolsos" ? <Refunds key="reembolsos" /> : <ReturnRequests key="solicitudes" admin readOnly={readOnly} />}
    </div>
  );
}
