import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Boxes, ExternalLink, ImageIcon, Layers, Plus, ToggleRight } from "lucide-react";
import { productsApi, sellerProductsApi } from "@/api/products";
import { inventoryApi } from "@/api/seller";
import type { Product, ProductStatus, Warehouse } from "@/api/types";
import { useCurrentUser } from "@/auth/AuthContext";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/PageLoader";
import { ProductArt } from "@/features/catalog/ProductArt";
import { STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from "@/features/catalog/productLabels";
import { useMyWarehouses } from "@/features/seller/hooks";
import { ImageUrlField } from "@/features/seller/ImageUrlField";
import { InventoryList } from "@/features/seller/InventoryList";
import { STATUS_ACTION } from "@/features/seller/labels";
import { StockForm } from "@/features/seller/StockForm";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { formatMoney, shortId } from "@/lib/format";
import { imageUrlError } from "@/lib/imageUrl";

function Section({ icon, title, action, children }: { icon: ReactNode; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-fg">{icon}</span>
          <h2 className="font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function useSaveProduct(id: string) {
  const queryClient = useQueryClient();
  return (product: Product) => {
    queryClient.setQueryData(["product", id], product);
    void queryClient.invalidateQueries({ queryKey: ["products"] });
  };
}

function ImageSection({ product }: { product: Product }) {
  const save = useSaveProduct(product.id);
  const current = product.imageUrl ?? "";
  const [value, setValue] = useState(current);
  const [error, setError] = useState<string | undefined>();
  const change = useMutation({
    mutationFn: (imageUrl: string | null) => sellerProductsApi.setImage(product.id, imageUrl),
    onSuccess: (updated) => {
      save(updated);
      setValue(updated.imageUrl ?? "");
    },
  });
  const trimmed = value.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = imageUrlError(trimmed);
    setError(found);
    if (found) return;
    change.mutate(trimmed === "" ? null : trimmed);
  };

  return (
    <Section icon={<ImageIcon className="size-4" />} title="Foto">
      <form onSubmit={submit} noValidate className="space-y-3">
        <ImageUrlField value={value} onChange={setValue} error={error} previewId={product.id} name={product.name} type={product.type} />
        {change.error && <Alert tone="error">{errorMessage(change.error, "No se pudo guardar la foto.")}</Alert>}
        <div className="flex flex-wrap justify-end gap-2">
          {current && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              loading={change.isPending && change.variables === null}
              disabled={change.isPending}
              onClick={() => change.mutate(null)}
            >
              Quitar foto
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            loading={change.isPending && change.variables !== null}
            disabled={change.isPending || trimmed === current}
          >
            Guardar foto
          </Button>
        </div>
      </form>
    </Section>
  );
}

function StatusSection({ product }: { product: Product }) {
  const save = useSaveProduct(product.id);
  const change = useMutation({ mutationFn: (status: ProductStatus) => sellerProductsApi.setStatus(product.id, status), onSuccess: save });
  const others = (Object.keys(STATUS_ACTION) as ProductStatus[]).filter((status) => status !== product.status);

  return (
    <Section icon={<ToggleRight className="size-4" />} title="Estado">
      <div className="space-y-3 text-sm">
        <p>
          <Badge tone={STATUS_TONE[product.status]}>{STATUS_LABEL[product.status]}</Badge>
          <span className="ml-2 text-muted">{STATUS_ACTION[product.status].help}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {others.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={status === "PUBLISHED" ? "primary" : "secondary"}
              loading={change.isPending && change.variables === status}
              disabled={change.isPending}
              onClick={() => change.mutate(status)}
            >
              {STATUS_ACTION[status].action}
            </Button>
          ))}
        </div>
        {change.error && <Alert tone="error">{errorMessage(change.error, "No se pudo cambiar el estado.")}</Alert>}
      </div>
    </Section>
  );
}

function VariantsSection({ product }: { product: Product }) {
  const save = useSaveProduct(product.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>();
  const add = useMutation({
    mutationFn: () => sellerProductsApi.addVariant(product.id, { name: name.trim(), value: value.trim() }),
    onSuccess: (updated) => {
      save(updated);
      // Se conserva el nombre para agregar varios valores seguidos (Color: Rojo, Azul…)
      setValue("");
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !value.trim()) {
      setError("Escribe el nombre y el valor (por ejemplo, Color: Rojo).");
      return;
    }
    setError(undefined);
    add.mutate();
  };

  const groups = new Map<string, string[]>();
  for (const variant of product.variants) groups.set(variant.name, [...(groups.get(variant.name) ?? []), variant.value]);

  return (
    <Section
      icon={<Layers className="size-4" />}
      title="Variantes"
      action={
        !open && (
          <Button size="sm" variant="secondary" icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
            Agregar
          </Button>
        )
      }
    >
      {groups.size === 0 ? (
        <p className="text-sm text-muted">Sin variantes. Agrega opciones como color, talla o capacidad.</p>
      ) : (
        <div className="space-y-3">
          {[...groups.entries()].map(([group, values]) => (
            <div key={group}>
              <p className="mb-1.5 text-sm font-medium">{group}</p>
              <div className="flex flex-wrap gap-2">
                {values.map((item, index) => (
                  <span key={`${item}-${index}`} className="rounded-lg border border-border bg-surface-2/60 px-3 py-1 text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <form onSubmit={submit} noValidate className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nombre" placeholder="Color" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} />
            <Input
              label="Valor"
              placeholder="Rojo"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              maxLength={60}
              error={error}
            />
          </div>
          {add.error && <Alert tone="error">{errorMessage(add.error, "No se pudo agregar la variante.")}</Alert>}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
            <Button size="sm" type="submit" loading={add.isPending}>
              Agregar variante
            </Button>
          </div>
        </form>
      )}
    </Section>
  );
}

function StockSection({ product, warehouses }: { product: Product; warehouses: Warehouse[] }) {
  const [adding, setAdding] = useState(false);
  const inventory = useQuery({
    queryKey: ["inventory", { productId: product.id }],
    queryFn: ({ signal }) => inventoryApi.list({ productId: product.id, pageSize: 50 }, signal),
  });
  const items = inventory.data?.items ?? [];
  // Primer ingreso: solo en bodegas donde el producto aún no tiene registro
  const free = warehouses.filter((warehouse) => !items.some((item) => item.warehouseId === warehouse.id));

  return (
    <Section
      icon={<Boxes className="size-4" />}
      title="Inventario"
      action={
        !adding &&
        free.length > 0 && (
          <Button size="sm" variant="secondary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            {items.length === 0 ? "Registrar ingreso" : "Otra bodega"}
          </Button>
        )
      }
    >
      {inventory.error ? (
        <Alert tone="error">{errorMessage(inventory.error, "No se pudo cargar el inventario.")}</Alert>
      ) : inventory.isPending ? (
        <PageLoader />
      ) : warehouses.length === 0 ? (
        <p className="text-sm text-muted">
          Necesitas una bodega para registrar existencias.{" "}
          <Link to="/inventario?vista=bodegas" className="text-brand-fg hover:underline">
            Crear bodega
          </Link>
        </p>
      ) : (
        <div className="space-y-4">
          {adding && (
            <Card className="bg-surface-2/40 p-4">
              <StockForm
                mode="inbound"
                productId={product.id}
                warehouses={free}
                onDone={() => setAdding(false)}
                onCancel={() => setAdding(false)}
              />
            </Card>
          )}
          {items.length === 0 && !adding ? (
            <p className="text-sm text-muted">
              Sin existencias registradas: los compradores no podrán comprarlo hasta que registres un ingreso.
            </p>
          ) : (
            <InventoryList
              items={items}
              products={new Map([[product.id, product]])}
              warehouses={new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]))}
              hideProduct
            />
          )}
        </div>
      )}
    </Section>
  );
}

export function SellerProductDetailPage() {
  const { id = "" } = useParams();
  const user = useCurrentUser();
  const location = useLocation();
  const created = (location.state as { created?: boolean } | null)?.created === true;
  const product = useQuery({ queryKey: ["product", id], queryFn: ({ signal }) => productsApi.get(id, signal) });
  const warehouses = useMyWarehouses();

  const back = (
    <Link to="/productos" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Mis productos
    </Link>
  );

  if (product.isPending || warehouses.isPending) return <PageLoader />;
  const error = product.error ?? warehouses.error;
  if (error || !product.data) {
    return (
      <div className="space-y-4">
        {back}
        <Alert tone="error">{errorMessage(error, "No se pudo cargar el producto.")}</Alert>
      </div>
    );
  }
  const data = product.data;
  if (data.sellerId !== user.id) {
    return (
      <div className="space-y-4">
        {back}
        <Alert tone="error">Este producto pertenece a otro vendedor.</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {back}
      {created && <Alert tone="success">Producto creado y publicado. Registra un ingreso de inventario para que se pueda comprar.</Alert>}

      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <ProductArt
          id={data.id}
          type={data.type}
          name={data.name}
          imageUrl={data.imageUrl}
          className="size-20 shrink-0 rounded-2xl sm:size-24"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={STATUS_TONE[data.status]}>{STATUS_LABEL[data.status]}</Badge>
            <Badge>{TYPE_LABEL[data.type]}</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{data.name}</h1>
          {data.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{data.description}</p>}
          <p className="mt-1 text-xs text-muted">Código {shortId(data.id)}</p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <p className="font-display text-2xl font-semibold tabular-nums">{formatMoney(data.price)}</p>
          <Link
            to={`/catalogo/${data.id}`}
            className={cn(
              "inline-flex items-center gap-1 text-sm text-brand-fg hover:underline",
              data.status !== "PUBLISHED" && "text-muted",
            )}
          >
            Ver en el catálogo <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <StockSection product={data} warehouses={warehouses.data ?? []} />
        <div className="space-y-6">
          <ImageSection product={data} />
          <StatusSection product={data} />
          <VariantsSection product={data} />
        </div>
      </div>
    </div>
  );
}
