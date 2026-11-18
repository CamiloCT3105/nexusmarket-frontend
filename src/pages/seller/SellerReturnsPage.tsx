import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, RotateCcw, X } from "lucide-react";
import { processReturn, returnsApi } from "@/api/returns";
import type { ReturnRequest, ReturnStatus } from "@/api/types";
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
import { RETURN_STATUS } from "@/features/orders/labels";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, shortId } from "@/lib/format";

const PAGE_SIZE = 10;
type Filter = ReturnStatus | "ALL";
const STATUSES = Object.keys(RETURN_STATUS) as ReturnStatus[];

// Aprobar es irreversible: reingresa las unidades a la bodega y genera el reembolso. Se pide confirmación.
function Decision({ request, admin }: { request: ReturnRequest; admin: boolean }) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<boolean | null>(null);
  const decide = useMutation({
    mutationFn: (approve: boolean) => processReturn(request.id, approve),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["returns"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["refunds"] });
    },
  });

  if (confirm !== null) {
    return (
      <div className="mt-3 space-y-2 rounded-xl bg-surface-2/60 p-3 text-sm">
        <p>
          {confirm
            ? `¿Aprobar? ${request.quantity === 1 ? "La unidad vuelve" : `Las ${request.quantity} unidades vuelven`} a ${admin ? "la bodega de origen" : "tu bodega"} y se genera el reembolso al comprador.`
            : "¿Rechazar la devolución? El comprador verá la solicitud como rechazada."}{" "}
          <span className="text-muted">No se puede deshacer.</span>
        </p>
        {decide.error && <Alert tone="error">{errorMessage(decide.error, "No se pudo procesar la devolución.")}</Alert>}
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" disabled={decide.isPending} onClick={() => setConfirm(null)}>
            Cancelar
          </Button>
          <Button size="sm" variant={confirm ? "primary" : "danger"} loading={decide.isPending} onClick={() => decide.mutate(confirm)}>
            {confirm ? "Sí, aprobar" : "Sí, rechazar"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex justify-end gap-2">
      <Button size="sm" variant="secondary" icon={<X className="size-4" />} onClick={() => setConfirm(false)}>
        Rechazar
      </Button>
      <Button size="sm" icon={<Check className="size-4" />} onClick={() => setConfirm(true)}>
        Aprobar
      </Button>
    </div>
  );
}

// Solicitudes de devolución. El vendedor ve las de sus productos; el administrador, todas.
export function ReturnRequests({ admin = false, readOnly = false }: { admin?: boolean; readOnly?: boolean }) {
  const [params, setParams] = useSearchParams();
  // Por defecto, lo que espera una decisión
  const raw = params.get("estado");
  const status: ReturnStatus | undefined = raw === "todas" ? undefined : (STATUSES.find((value) => value === raw) ?? "REQUESTED");
  const page = Math.max(1, Number(params.get("pagina")) || 1);

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["returns", { status, page }],
    queryFn: ({ signal }) => returnsApi.list({ status, page, pageSize: PAGE_SIZE }, signal),
    placeholderData: keepPreviousData,
  });
  const { products } = useProductsById(data?.items.map((request) => request.productId) ?? []);

  return (
    <div className="space-y-6">
      <Segmented<Filter>
        label="Filtrar por estado"
        value={status ?? "ALL"}
        onChange={(next) =>
          setParams(
            (current) => {
              const updated = new URLSearchParams(current);
              if (next === "REQUESTED") updated.delete("estado");
              else updated.set("estado", next === "ALL" ? "todas" : next);
              updated.delete("pagina");
              return updated;
            },
            { replace: true },
          )
        }
        options={[
          ...STATUSES.map((value) => ({ value, label: value === "REQUESTED" ? "Por revisar" : RETURN_STATUS[value].label })),
          { value: "ALL", label: "Todas" },
        ]}
      />

      {error ? (
        <Alert tone="error">{errorMessage(error, "No se pudieron cargar las devoluciones.")}</Alert>
      ) : isPending ? (
        <PageLoader />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<RotateCcw className="size-6" />}
          title={status === "REQUESTED" ? "No hay devoluciones por revisar" : "No hay devoluciones en este estado"}
          description="Los compradores pueden solicitar devoluciones de pedidos entregados."
        />
      ) : (
        <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
          {data.items.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    {request.quantity} ×{" "}
                    <Link to={admin ? `/catalogo/${request.productId}` : `/productos/${request.productId}`} className="hover:text-brand-fg">
                      {products.get(request.productId)?.name ?? `Producto ${shortId(request.productId)}`}
                    </Link>
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
              {request.status === "REQUESTED" && !readOnly && <Decision request={request} admin={admin} />}
            </Card>
          ))}
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
                  { replace: true },
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

export function SellerReturnsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Devoluciones"
        description="Solicitudes sobre tus productos. Al aprobar, el stock vuelve a la bodega de origen y se reembolsa lo pagado."
      />
      <ReturnRequests />
    </div>
  );
}
