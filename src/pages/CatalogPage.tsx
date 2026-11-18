import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FilterX, PackageSearch, Search } from "lucide-react";
import { productsApi, type CatalogQuery } from "@/api/products";
import { ApiError } from "@/api/client";
import type { ProductSort, ProductStatus, ProductType } from "@/api/types";
import { useCurrentUser } from "@/auth/AuthContext";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { ProductCard, ProductCardSkeleton } from "@/features/catalog/ProductCard";
import { SORT_OPTIONS, STATUS_LABEL, TYPE_LABEL } from "@/features/catalog/productLabels";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;

// Los filtros viven en la URL (?q=&tipo=&orden=&min=&max=&estado=&mios=&pagina=):
// se pueden compartir, el botón "atrás" funciona y sobreviven a una recarga.
function readNumber(value: string | null): number | undefined {
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function CatalogPage() {
  const user = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const canSeeAllStatuses = user.role === "ADMIN" || user.role === "SUPERVISOR" || user.role === "SELLER";
  const isSeller = user.role === "SELLER";

  const page = Math.max(1, Number(params.get("pagina")) || 1);
  const type = (params.get("tipo") as ProductType | null) ?? undefined;
  const sort = (params.get("orden") as ProductSort | null) ?? "newest";
  const status = canSeeAllStatuses ? ((params.get("estado") as ProductStatus | null) ?? undefined) : undefined;
  const mine = isSeller && params.get("mios") === "1";

  // Texto de búsqueda y precios se escriben localmente y se aplican tras una pausa al escribir
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(params.get("min") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("max") ?? "");
  const debouncedSearch = useDebouncedValue(search.trim());
  const debouncedMin = useDebouncedValue(minPrice);
  const debouncedMax = useDebouncedValue(maxPrice);

  const update = (changes: Record<string, string | undefined>, resetPage = true) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined || value === "") next.delete(key);
          else next.set(key, value);
        }
        if (resetPage) next.delete("pagina");
        return next;
      },
      { replace: true },
    );
  };

  // Lleva a la URL lo escrito (sin crear una entrada de historial por cada tecla)
  useEffect(() => {
    if ((params.get("q") ?? "") !== debouncedSearch) update({ q: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacciona solo al texto ya asentado; con más dependencias, limpiar los filtros devolvería el texto viejo
  }, [debouncedSearch]);
  useEffect(() => {
    if ((params.get("min") ?? "") !== debouncedMin || (params.get("max") ?? "") !== debouncedMax) {
      update({ min: debouncedMin, max: debouncedMax });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacciona solo al texto ya asentado; con más dependencias, limpiar los filtros devolvería el texto viejo
  }, [debouncedMin, debouncedMax]);

  const query: CatalogQuery = {
    search: params.get("q") ?? undefined,
    type,
    sort,
    status,
    minPrice: readNumber(params.get("min")),
    maxPrice: readNumber(params.get("max")),
    sellerId: mine ? user.id : undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["products", query],
    queryFn: ({ signal }) => productsApi.search(query, signal),
    placeholderData: keepPreviousData, // al cambiar de página se mantiene lo anterior mientras carga
  });

  const hasFilters = Boolean(params.get("q") || type || status || mine || params.get("min") || params.get("max"));
  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setParams(new URLSearchParams(), { replace: true });
  };

  const typeOptions: Array<{ value: ProductType | undefined; label: string }> = [
    { value: undefined, label: "Todos" },
    { value: "PHYSICAL", label: TYPE_LABEL.PHYSICAL },
    { value: "DIGITAL", label: TYPE_LABEL.DIGITAL },
  ];

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Catálogo</h1>
          <p className="mt-1 text-muted">
            {user.role === "BUYER" || user.role === "LOGISTICS_OPERATOR"
              ? "Productos publicados por los vendedores del marketplace."
              : isSeller
                ? "Productos publicados y todos los tuyos, en cualquier estado."
                : "Todos los productos de la plataforma."}
          </p>
        </div>
        {data && (
          <p className="text-sm text-muted">
            {data.total} {data.total === 1 ? "producto" : "productos"}
          </p>
        )}
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface/70 p-4 shadow-card backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Input
              aria-label="Buscar productos"
              placeholder="Buscar por nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leading={<Search className="size-4" />}
              type="search"
            />
          </div>
          <div role="radiogroup" aria-label="Tipo de producto" className="flex rounded-xl border border-border bg-surface-2 p-1">
            {typeOptions.map((option) => {
              const active = option.value === type;
              return (
                <button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update({ tipo: option.value })}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="lg:w-56">
            <Select
              aria-label="Ordenar por"
              value={sort}
              onChange={(e) => update({ orden: e.target.value === "newest" ? undefined : e.target.value })}
              options={SORT_OPTIONS}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="grid grid-cols-2 gap-2 sm:w-72">
            <Input
              aria-label="Precio mínimo"
              placeholder="Precio mín."
              type="number"
              min={0}
              inputMode="decimal"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <Input
              aria-label="Precio máximo"
              placeholder="Precio máx."
              type="number"
              min={0}
              inputMode="decimal"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          {canSeeAllStatuses && (
            <div className="sm:w-48">
              <Select
                aria-label="Estado"
                value={status ?? ""}
                onChange={(e) => update({ estado: e.target.value || undefined })}
                options={[
                  { value: "", label: "Todos los estados" },
                  ...(Object.keys(STATUS_LABEL) as ProductStatus[]).map((value) => ({ value, label: STATUS_LABEL[value] })),
                ]}
              />
            </div>
          )}
          {isSeller && (
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-[var(--app-brand)]"
                checked={mine}
                onChange={(e) => update({ mios: e.target.checked ? "1" : undefined })}
              />
              Solo mis productos
            </label>
          )}
          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters} icon={<FilterX className="size-4" />} className="sm:ml-auto">
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Resultados */}
      <div className="mt-6">
        {error ? (
          <Alert tone="error">{error instanceof ApiError ? error.message : "No se pudo cargar el catálogo."}</Alert>
        ) : isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={<PackageSearch className="size-6" />}
            title="No encontramos productos"
            description={hasFilters ? "Prueba con otros filtros o una búsqueda distinta." : "Todavía no hay productos publicados."}
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className={cn("transition-opacity", isFetching && "opacity-60")}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} showStatus={canSeeAllStatuses} />
              ))}
            </div>
            <div className="mt-8">
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                pageSize={data.pageSize}
                onChange={(next) => {
                  update({ pagina: next > 1 ? String(next) : undefined }, false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
