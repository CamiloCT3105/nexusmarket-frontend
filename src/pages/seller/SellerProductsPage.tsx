import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight, PackagePlus, Search, Tags } from "lucide-react";
import { productsApi } from "@/api/products";
import type { ProductStatus } from "@/api/types";
import { useCurrentUser } from "@/auth/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/PageLoader";
import { Pagination } from "@/components/ui/Pagination";
import { Segmented } from "@/components/ui/Segmented";
import { ProductArt } from "@/features/catalog/ProductArt";
import { STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from "@/features/catalog/productLabels";
import { useSellerProfile } from "@/features/seller/hooks";
import { SellerRequired } from "@/features/seller/SellerRequired";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

const PAGE_SIZE = 12;
type Filter = ProductStatus | "ALL";
const STATUSES = Object.keys(STATUS_LABEL) as ProductStatus[];

export function SellerProductsPage() {
  const user = useCurrentUser();
  const seller = useSellerProfile();
  const [params, setParams] = useSearchParams();
  const status = STATUSES.find((value) => value === params.get("estado"));
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
        return next;
      },
      { replace: true },
    );

  // La búsqueda vive en la URL; al cambiarla se vuelve a la primera página
  useEffect(() => {
    if ((params.get("q") ?? "") !== debounced) update({ q: debounced || undefined, pagina: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacciona solo al texto ya asentado; con más dependencias, limpiar los filtros devolvería el texto viejo
  }, [debounced]);

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["products", "mine", { status, page, search: debounced }],
    enabled: Boolean(seller.data),
    queryFn: ({ signal }) =>
      productsApi.search({ sellerId: user.id, status, search: debounced, page, pageSize: PAGE_SIZE, sort: "newest" }, signal),
    placeholderData: keepPreviousData,
  });

  const newButton = (
    <Link to="/productos/nuevo">
      <Button icon={<PackagePlus className="size-4" />}>Nuevo producto</Button>
    </Link>
  );

  if (seller.isPending) return <PageLoader />;
  if (seller.error) return <Alert tone="error">{errorMessage(seller.error)}</Alert>;
  if (!seller.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mis productos" />
        <SellerRequired />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis productos"
        description="Crea productos, agrega variantes y decide cuáles se ven en el catálogo."
        actions={newButton}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-72">
          <Input
            aria-label="Buscar en mis productos"
            placeholder="Buscar por nombre…"
            leading={<Search className="size-4" />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Segmented<Filter>
          label="Filtrar por estado"
          value={status ?? "ALL"}
          onChange={(next) => update({ estado: next === "ALL" ? undefined : next, pagina: undefined })}
          options={[{ value: "ALL", label: "Todos" }, ...STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))]}
        />
      </div>

      {error ? (
        <Alert tone="error">{errorMessage(error, "No se pudieron cargar tus productos.")}</Alert>
      ) : isPending ? (
        <PageLoader />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<Tags className="size-6" />}
          title={status || debounced ? "Ningún producto coincide" : "Aún no tienes productos"}
          description={
            status || debounced
              ? "Prueba con otro filtro o búsqueda."
              : "Crea tu primer producto y luego registra su inventario en una bodega."
          }
          action={!status && !debounced && newButton}
        />
      ) : (
        <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
          {data.items.map((product) => (
            <Link key={product.id} to={`/productos/${product.id}`} className="group block">
              <Card className="flex items-center gap-3 p-3 transition-colors group-hover:border-brand/50 sm:gap-4">
                <ProductArt id={product.id} type={product.type} name={product.name} className="size-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{product.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone={STATUS_TONE[product.status]}>{STATUS_LABEL[product.status]}</Badge>
                    <Badge>{TYPE_LABEL[product.type]}</Badge>
                    {product.variants.length > 0 && (
                      <span className="text-xs text-muted">
                        {product.variants.length} {product.variants.length === 1 ? "variante" : "variantes"}
                      </span>
                    )}
                  </div>
                </div>
                <p className="font-display font-semibold tabular-nums">{formatMoney(product.price)}</p>
                <ChevronRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-fg" />
              </Card>
            </Link>
          ))}
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
