import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { sellerProductsApi } from "@/api/products";
import type { ProductType } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/PageLoader";
import { TYPE_LABEL } from "@/features/catalog/productLabels";
import { useSellerProfile } from "@/features/seller/hooks";
import { SellerRequired } from "@/features/seller/SellerRequired";
import { errorMessage } from "@/lib/errors";

type Errors = Partial<Record<"name" | "price", string>>;

// Mismas reglas que el backend: nombre obligatorio, precio > 0 con máximo dos decimales
function validate(name: string, price: string): Errors {
  const errors: Errors = {};
  if (!name.trim()) errors.name = "El nombre es obligatorio.";
  const value = Number(price);
  if (!price.trim() || !Number.isFinite(value) || value <= 0) errors.price = "El precio debe ser mayor a cero.";
  else if (Number(value.toFixed(2)) !== value) errors.price = "El precio admite como máximo dos decimales.";
  return errors;
}

export function ProductFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const seller = useSellerProfile();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<ProductType>("PHYSICAL");
  const [errors, setErrors] = useState<Errors>({});

  const create = useMutation({
    mutationFn: sellerProductsApi.create,
    onSuccess: (product) => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.setQueryData(["product", product.id], product);
      void navigate(`/productos/${product.id}`, { state: { created: true } });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validate(name, price);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    create.mutate({ name: name.trim(), description: description.trim(), price: Number(price), type });
  };

  const back = (
    <Link to="/productos" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Mis productos
    </Link>
  );

  if (seller.isPending) return <PageLoader />;
  if (!seller.data) {
    return (
      <div className="space-y-6">
        {back}
        {seller.error ? <Alert tone="error">{errorMessage(seller.error)}</Alert> : <SellerRequired />}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {back}
      <PageHeader title="Nuevo producto" description="Se publica de inmediato. Después podrás agregar variantes y registrar inventario." />
      <Card className="p-5 sm:p-6">
        <form onSubmit={submit} noValidate className="space-y-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
            maxLength={120}
            autoFocus
          />
          <Textarea
            label="Descripción"
            hint="Opcional. Cuéntale al comprador qué incluye y sus características."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1000}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Precio (COP)"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              error={errors.price}
            />
            <Select
              label="Tipo"
              value={type}
              onChange={(event) => setType(event.target.value as ProductType)}
              options={(Object.keys(TYPE_LABEL) as ProductType[]).map((value) => ({ value, label: TYPE_LABEL[value] }))}
            />
          </div>
          {create.error && <Alert tone="error">{errorMessage(create.error, "No se pudo crear el producto.")}</Alert>}
          <div className="flex justify-end gap-2 pt-2">
            <Link to="/productos">
              <Button variant="ghost">Cancelar</Button>
            </Link>
            <Button type="submit" loading={create.isPending}>
              Crear producto
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
