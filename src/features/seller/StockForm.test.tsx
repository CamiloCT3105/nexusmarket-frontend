import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Product, Warehouse } from "@/api/types";
import { jsonResponse, makeUser, renderWithApp, requestBody, requestUrl } from "@/test/render";
import { StockForm } from "./StockForm";

const product = (id: string, name: string, sellerId: string): Product => ({
  id,
  sellerId,
  name,
  description: "",
  price: 1000,
  type: "PHYSICAL",
  variants: [],
  status: "PUBLISHED",
});

const products = [product("p1", "Teclado Nova", "nova"), product("p2", "Libro Páginas", "paginas")];
const warehouses: Warehouse[] = [
  { id: "w-nova", type: "SELLER", sellerId: "nova", location: "Bogotá - Nova" },
  { id: "w-market", type: "MARKETPLACE", location: "Bogotá - Marketplace" },
];
// Misma regla que usa el inventario del operador logístico
const fits = (item: Product, warehouse: Warehouse) => warehouse.type === "MARKETPLACE" || warehouse.sellerId === item.sellerId;

describe("StockForm (ingreso de mercancía)", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => vi.stubGlobal("fetch", fetchMock));
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  const renderForm = () =>
    renderWithApp(<StockForm mode="inbound" products={products} warehouses={warehouses} productFitsWarehouse={fits} />, {
      user: makeUser("LOGISTICS_OPERATOR"),
    });

  it("en una bodega de vendedor solo ofrece los productos de ese vendedor", () => {
    renderForm();
    const options = within(screen.getByLabelText("Producto")).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(["Teclado Nova"]);
  });

  it("en una bodega del marketplace ofrece todos los productos", async () => {
    renderForm();
    await userEvent.selectOptions(screen.getByLabelText("Bodega"), "w-market");
    const options = within(screen.getByLabelText("Producto")).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(["Teclado Nova", "Libro Páginas"]);
  });

  it("valida la cantidad antes de llamar al backend", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText("Unidades que ingresan"), "0");
    await userEvent.click(screen.getByRole("button", { name: "Registrar ingreso" }));
    expect(screen.getByText("Ingresa un número entero mayor a cero.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envía el ingreso con producto, bodega y cantidad", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    renderForm();
    await userEvent.type(screen.getByLabelText("Unidades que ingresan"), "5");
    await userEvent.click(screen.getByRole("button", { name: "Registrar ingreso" }));
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(requestUrl(url).pathname).toBe("/api/inventory/inbound");
    expect(requestBody(init)).toEqual({ productId: "p1", warehouseId: "w-nova", quantity: 5 });
  });
});
