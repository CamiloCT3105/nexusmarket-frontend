import { useState } from "react";
import { Link } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight, FileText } from "lucide-react";
import { invoicesApi } from "@/api/orders";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/PageLoader";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, formatMoney, shortId } from "@/lib/format";

const PAGE_SIZE = 10;

export function InvoicesPage() {
  const [page, setPage] = useState(1);
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["invoices", { page }],
    queryFn: ({ signal }) => invoicesApi.list({ page, pageSize: PAGE_SIZE }, signal),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Mis facturas" description="Las facturas se emiten cuando un pedido ya fue pagado." />
      {error ? (
        <Alert tone="error">{errorMessage(error, "No se pudieron cargar tus facturas.")}</Alert>
      ) : isPending ? (
        <PageLoader />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-6" />}
          title="Aún no tienes facturas"
          description="Cuando pagues un pedido y el administrador emita la factura, la verás aquí."
        />
      ) : (
        <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
          {data.items.map((invoice) => (
            <Link key={invoice.id} to={`/facturas/${invoice.id}`} className="group block">
              <Card className="flex items-center gap-4 p-4 transition-colors group-hover:border-brand/50">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-fg">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold">Factura #{shortId(invoice.id)}</p>
                  <p className="text-sm text-muted">
                    Pedido #{shortId(invoice.orderId)} · {formatDateTime(invoice.issuedAt)}
                  </p>
                </div>
                <p className="font-display text-lg font-semibold tabular-nums">{formatMoney(invoice.amount)}</p>
                <ChevronRight className="size-5 shrink-0 text-muted group-hover:text-brand-fg" />
              </Card>
            </Link>
          ))}
          <div className="pt-4">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
