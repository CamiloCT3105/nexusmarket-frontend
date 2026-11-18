import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { reportsApi, type InventoryReport, type SalesReport } from "@/api/reports";
import type { OrderStatus, ProductStatus, ReturnStatus, ShipmentStatus, UserRole } from "@/api/types";
import { roleLabel } from "@/auth/roles";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/PageLoader";
import { Segmented } from "@/components/ui/Segmented";
import { useIsSupervisor, useUsersById } from "@/features/admin/hooks";
import { ALL_ROLES } from "@/features/admin/labels";
import { STATUS_LABEL } from "@/features/catalog/productLabels";
import { useAllWarehouses } from "@/features/logistics/hooks";
import { ORDER_STATUS, ORDER_STEPS, RETURN_STATUS, SHIPMENT_STATUS, SHIPMENT_STEPS } from "@/features/orders/labels";
import { BarList, ChartCard, StatTile } from "@/features/reports/charts";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, formatMoney, shortId } from "@/lib/format";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

type View = "resumen" | "ventas" | "inventario" | "logistica" | "devoluciones";
const VIEWS: Array<{ value: View; label: string }> = [
  { value: "resumen", label: "Resumen" },
  { value: "ventas", label: "Ventas" },
  { value: "inventario", label: "Inventario" },
  { value: "logistica", label: "Logística" },
  { value: "devoluciones", label: "Devoluciones" },
];
const PRODUCT_STATUSES: ProductStatus[] = ["PUBLISHED", "SUSPENDED", "DISCONTINUED"];
const RETURN_STATUSES: ReturnStatus[] = ["REQUESTED", "APPROVED", "REJECTED"];
const sum = (values: Record<string, number>) => Object.values(values).reduce((total, value) => total + value, 0);

function useSetParams() {
  const [, setParams] = useSearchParams();
  return (changes: Record<string, string | undefined>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
}

function Failed({ error }: { error: unknown }) {
  return <Alert tone="error">{errorMessage(error, "No se pudo cargar el reporte.")}</Alert>;
}

// ─── Resumen ───────────────────────────────────────────────────────────────────

function Summary() {
  const { data, error, isPending } = useQuery({ queryKey: ["reports", "summary"], queryFn: ({ signal }) => reportsApi.summary(signal) });
  if (error) return <Failed error={error} />;
  if (isPending) return <PageLoader />;
  const orders = sum(data.ordersByStatus);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total facturado" value={formatMoney(data.totalInvoicedAmount)} hint="Facturas emitidas" />
        <StatTile label="Pedidos" value={String(orders)} hint={`${data.ordersByStatus.DELIVERED} entregados`} />
        <StatTile
          label="Devoluciones por revisar"
          value={String(data.pendingReturns)}
          tone={data.pendingReturns > 0 ? "warning" : undefined}
        />
        <StatTile
          label="Productos publicados"
          value={String(data.productsByStatus.PUBLISHED)}
          hint={`de ${sum(data.productsByStatus)} en total`}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Pedidos por estado">
          <BarList
            ariaLabel="Pedidos por estado"
            bars={ORDER_STEPS.map((status: OrderStatus) => ({
              key: status,
              label: ORDER_STATUS[status].label,
              value: data.ordersByStatus[status],
            }))}
          />
        </ChartCard>
        <ChartCard title="Usuarios por rol">
          <BarList
            ariaLabel="Usuarios por rol"
            bars={ALL_ROLES.map((role: UserRole) => ({ key: role, label: roleLabel(role), value: data.usersByRole[role] }))}
          />
        </ChartCard>
        <ChartCard title="Productos por estado">
          <BarList
            ariaLabel="Productos por estado"
            bars={PRODUCT_STATUSES.map((status) => ({ key: status, label: STATUS_LABEL[status], value: data.productsByStatus[status] }))}
          />
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Ventas ────────────────────────────────────────────────────────────────────

// Fecha local AAAA-MM-DD (toISOString daría el día UTC, que en la noche ya es el siguiente)
const toInput = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toInput(date);
}

function SalesContent({ data }: { data: SalesReport }) {
  const sellers = useUsersById(data.revenueBySeller.map((row) => row.sellerId));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Ingresos" value={formatMoney(data.totalRevenue)} hint="Pedidos pagados, antes de reembolsos" />
        <StatTile label="Pedidos pagados" value={String(data.orderCount)} />
        <StatTile label="Ticket promedio" value={formatMoney(data.averageTicket)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Productos más vendidos" description="Los 5 con más unidades vendidas en el periodo.">
          <BarList
            ariaLabel="Productos más vendidos por unidades"
            format={(units) => `${units} ${units === 1 ? "unidad" : "unidades"}`}
            emptyText="Sin ventas en este periodo."
            bars={data.topProducts.map((row) => ({
              key: row.productId,
              label: row.productName,
              href: `/catalogo/${row.productId}`,
              value: row.unitsSold,
              hint: `Ingresos: ${formatMoney(row.revenue)}`,
            }))}
          />
        </ChartCard>
        <ChartCard title="Ingresos por vendedor">
          <BarList
            ariaLabel="Ingresos por vendedor"
            format={formatMoney}
            emptyText="Sin ventas en este periodo."
            bars={data.revenueBySeller.map((row) => ({
              key: row.sellerId,
              label: sellers.get(row.sellerId)?.fullName ?? `Vendedor ${shortId(row.sellerId)}`,
              value: row.revenue,
            }))}
          />
        </ChartCard>
      </div>
    </div>
  );
}

function Sales() {
  const [params] = useSearchParams();
  const setParams = useSetParams();
  const from = params.get("desde") ?? "";
  const to = params.get("hasta") ?? "";
  const invalid = Boolean(from && to && from > to);
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["reports", "sales", { from, to }],
    enabled: !invalid,
    queryFn: ({ signal }) => reportsApi.sales({ from: from || undefined, to: to || undefined }, signal),
    placeholderData: keepPreviousData,
  });
  const presets = [
    { label: "Últimos 7 días", from: daysAgo(6), to: toInput(new Date()) },
    { label: "Últimos 30 días", from: daysAgo(29), to: toInput(new Date()) },
    { label: "Todo", from: "", to: "" },
  ];

  return (
    <div className="space-y-6">
      {/* Filtros en una sola fila, arriba de los gráficos */}
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid grid-cols-2 gap-3 sm:w-80">
          <Input
            label="Desde"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setParams({ desde: event.target.value || undefined })}
          />
          <Input
            label="Hasta"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setParams({ hasta: event.target.value || undefined })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const active = preset.from === from && preset.to === to;
            return (
              <Button
                key={preset.label}
                size="sm"
                variant={active ? "secondary" : "ghost"}
                onClick={() => setParams({ desde: preset.from || undefined, hasta: preset.to || undefined })}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>
      </Card>
      {invalid ? (
        <Alert tone="error">La fecha inicial no puede ser posterior a la final.</Alert>
      ) : error ? (
        <Failed error={error} />
      ) : isPending ? (
        <PageLoader />
      ) : (
        <div className={cn("transition-opacity", isFetching && "opacity-60")}>
          <SalesContent data={data} />
        </div>
      )}
    </div>
  );
}

// ─── Inventario ────────────────────────────────────────────────────────────────

function InventoryTable({ data, onlyLow }: { data: InventoryReport; onlyLow: boolean }) {
  const warehouses = useAllWarehouses();
  const locations = new Map((warehouses.data ?? []).map((warehouse) => [warehouse.id, warehouse.location]));
  // Primero lo más urgente: menos unidades disponibles
  const rows = [...data.items].filter((row) => !onlyLow || row.lowStock).sort((a, b) => a.availableQuantity - b.availableQuantity);
  if (rows.length === 0)
    return (
      <p className="p-5 text-sm text-muted">{onlyLow ? "Ningún producto está por debajo del umbral." : "Sin existencias registradas."}</p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs tracking-wider text-muted uppercase">
            <th className="px-4 py-2.5 font-medium">Producto</th>
            <th className="px-4 py-2.5 font-medium">Bodega</th>
            <th className="px-4 py-2.5 text-right font-medium">Disponibles</th>
            <th className="px-4 py-2.5 text-right font-medium">Reservadas</th>
            <th className="px-4 py-2.5 text-right font-medium">Dañadas</th>
            <th className="px-4 py-2.5 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.productId}:${row.warehouseId}`} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-2.5">
                <Link to={`/catalogo/${row.productId}`} className="hover:text-brand-fg">
                  {row.productName}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-muted">{locations.get(row.warehouseId) ?? `Bodega ${shortId(row.warehouseId)}`}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-medium",
                    row.availableQuantity === 0 ? "text-danger" : row.lowStock && "text-warning",
                  )}
                >
                  {row.lowStock && <AlertTriangle className="size-3.5" aria-label="Bajo el umbral" />}
                  {row.availableQuantity}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">{row.reservedQuantity}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{row.damagedQuantity}</td>
              <td className="px-4 py-2.5 text-right text-muted tabular-nums">{row.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Inventory() {
  const [params] = useSearchParams();
  const setParams = useSetParams();
  const raw = Number(params.get("umbral"));
  const threshold = Number.isInteger(raw) && raw >= 0 && params.get("umbral") !== null ? raw : 10;
  const onlyLow = params.get("solo") === "bajo";
  const [draft, setDraft] = useState(String(threshold));
  const debounced = useDebouncedValue(draft);
  useEffect(() => {
    const value = Number(debounced);
    if (debounced !== "" && Number.isInteger(value) && value >= 0 && value !== threshold) setParams({ umbral: String(value) });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacciona solo al texto ya asentado; con más dependencias, limpiar los filtros devolvería el texto viejo
  }, [debounced]);

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["reports", "inventory", threshold],
    queryFn: ({ signal }) => reportsApi.inventory(threshold, signal),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:w-56">
          <Input
            label="Umbral de bajo stock"
            hint="Unidades disponibles o menos"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        <Segmented<"todos" | "bajo">
          label="Mostrar"
          value={onlyLow ? "bajo" : "todos"}
          onChange={(next) => setParams({ solo: next === "bajo" ? "bajo" : undefined })}
          options={[
            { value: "todos", label: "Todo el inventario" },
            { value: "bajo", label: "Solo bajo stock" },
          ]}
        />
      </Card>
      {error ? (
        <Failed error={error} />
      ) : isPending ? (
        <PageLoader />
      ) : (
        <div className={cn("space-y-6 transition-opacity", isFetching && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Unidades en bodegas" value={String(data.totalUnits)} />
            <StatTile label="Disponibles para vender" value={String(data.totalAvailable)} />
            <StatTile label="Dañadas" value={String(data.totalDamaged)} tone={data.totalDamaged > 0 ? "danger" : undefined} />
            <StatTile
              label="Bajo el umbral"
              value={String(data.lowStockCount)}
              hint={`${data.threshold} unidades o menos`}
              tone={data.lowStockCount > 0 ? "warning" : undefined}
            />
          </div>
          <Card>
            <InventoryTable data={data} onlyLow={onlyLow} />
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Logística ─────────────────────────────────────────────────────────────────

function Logistics() {
  const readOnly = useIsSupervisor();
  const { data, error, isPending } = useQuery({
    queryKey: ["reports", "logistics"],
    queryFn: ({ signal }) => reportsApi.logistics(signal),
  });
  if (error) return <Failed error={error} />;
  if (isPending) return <PageLoader />;
  const waiting = data.ordersAwaitingShipment;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <ChartCard title="Envíos por estado">
        <BarList
          ariaLabel="Envíos por estado"
          emptyText="Aún no hay envíos."
          bars={SHIPMENT_STEPS.map((status: ShipmentStatus) => ({
            key: status,
            label: SHIPMENT_STATUS[status].label,
            value: data.shipmentsByStatus[status],
          }))}
        />
      </ChartCard>
      <ChartCard title={`Pedidos pagados sin envío (${waiting.length})`} description="Esperan que el operador logístico cree su envío.">
        {waiting.length === 0 ? (
          <p className="text-sm text-muted">Todos los pedidos pagados ya tienen envío.</p>
        ) : (
          <ul className="divide-y divide-border">
            {waiting.map((order) => (
              <li key={order.orderId}>
                <Link to={`/pedidos/${order.orderId}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-brand-fg">
                  <span className="font-medium">Pedido #{shortId(order.orderId)}</span>
                  <span className="min-w-0 flex-1 truncate text-muted">{formatDateTime(order.createdAt)}</span>
                  <span className="tabular-nums">{formatMoney(order.total)}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {!readOnly && waiting.length > 0 && (
          <Link to="/envios" className="mt-3 inline-flex items-center gap-1 text-sm text-brand-fg hover:underline">
            Ir a envíos <ChevronRight className="size-4" />
          </Link>
        )}
      </ChartCard>
    </div>
  );
}

// ─── Devoluciones ──────────────────────────────────────────────────────────────

function Returns() {
  const { data, error, isPending } = useQuery({ queryKey: ["reports", "returns"], queryFn: ({ signal }) => reportsApi.returns(signal) });
  if (error) return <Failed error={error} />;
  if (isPending) return <PageLoader />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Solicitudes" value={String(sum(data.returnsByStatus))} hint={`${data.returnsByStatus.REQUESTED} por revisar`} />
        <StatTile
          label="Reembolsos por pagar"
          value={formatMoney(data.refundsPending.amount)}
          hint={`${data.refundsPending.count} ${data.refundsPending.count === 1 ? "reembolso" : "reembolsos"}`}
          tone={data.refundsPending.count > 0 ? "warning" : undefined}
        />
        <StatTile
          label="Reembolsado"
          value={formatMoney(data.refundsCompleted.amount)}
          hint={`${data.refundsCompleted.count} ${data.refundsCompleted.count === 1 ? "reembolso completado" : "reembolsos completados"}`}
        />
      </div>
      <ChartCard title="Solicitudes por estado" className="lg:max-w-xl">
        <BarList
          ariaLabel="Solicitudes de devolución por estado"
          emptyText="Aún no hay solicitudes de devolución."
          bars={RETURN_STATUSES.map((status) => ({ key: status, label: RETURN_STATUS[status].label, value: data.returnsByStatus[status] }))}
        />
      </ChartCard>
      <Link to="/devoluciones" className="inline-flex items-center gap-1 text-sm text-brand-fg hover:underline">
        Ver las solicitudes <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}

export function ReportsPage() {
  const [params, setParams] = useSearchParams();
  const view = VIEWS.find((item) => item.value === params.get("vista"))?.value ?? "resumen";
  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="Indicadores de ventas, inventario, logística y devoluciones, calculados al momento." />
      <Segmented<View>
        label="Reporte"
        value={view}
        onChange={(next) => setParams(next === "resumen" ? {} : { vista: next }, { replace: true })}
        options={VIEWS}
      />
      {view === "ventas" ? (
        <Sales />
      ) : view === "inventario" ? (
        <Inventory />
      ) : view === "logistica" ? (
        <Logistics />
      ) : view === "devoluciones" ? (
        <Returns />
      ) : (
        <Summary />
      )}
    </div>
  );
}
