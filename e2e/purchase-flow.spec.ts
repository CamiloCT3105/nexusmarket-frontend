import { expect, test, type Browser, type Page } from "@playwright/test";
import { ADMIN, API_URL, newAccountData, prepareCatalog, stockOf, type Catalog } from "./support/backend";
import { loginAs, money } from "./support/ui";

// Flujo completo de la plataforma con cuatro actores, cada uno en su propia sesión del navegador:
// comprador → administrador → operador logístico → comprador → administrador (restricción comercial).
test.describe.configure({ mode: "serial" });

test.skip(!ADMIN.email || !ADMIN.password, "Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD (administrador del backend de pruebas).");

let catalog: Catalog;
let buyerPage: Page;
let orderId = "";
let buyerId = "";
const buyer = newAccountData("Comprador");

async function newSession(browser: Browser): Promise<Page> {
  const context = await browser.newContext();
  return context.newPage();
}

test.beforeAll(async ({ browser }) => {
  catalog = await prepareCatalog();
  buyerPage = await newSession(browser);
});

test("el comprador se registra, completa su perfil, compra y paga", async () => {
  const page = buyerPage;

  await test.step("registro", async () => {
    await page.goto("/registro");
    await page.getByLabel("Nombre completo").fill(buyer.fullName);
    await page.getByLabel("Correo electrónico").fill(buyer.email);
    await page.getByLabel("Documento de identidad").fill(buyer.documentNumber);
    await page.getByLabel("Contraseña", { exact: true }).fill(buyer.password);
    await page.getByLabel("Confirmar contraseña").fill(buyer.password);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/inicio$/);
  });

  await test.step("perfil con dirección de entrega", async () => {
    await page.goto("/perfil");
    await page.getByLabel("Dirección").fill("Calle 10 # 20-30");
    await page.getByLabel("Ciudad").fill("Bogotá");
    await page.getByLabel("País").fill("Colombia");
    await page.getByLabel("Código postal").fill("110111");
    await page.getByRole("button", { name: "Guardar y activar mi perfil" }).click();
    await expect(page.getByText("Calle 10 # 20-30")).toBeVisible();
  });

  await test.step("agrega una dirección adicional (oficina)", async () => {
    await page.getByRole("button", { name: "Agregar" }).click();
    await page.getByLabel("Dirección").fill("Carrera 50 # 10-20");
    await page.getByLabel("Ciudad").fill("Medellín");
    await page.getByLabel("País").fill("Colombia");
    await page.getByLabel("Código postal").fill("050021");
    await page.getByRole("button", { name: "Guardar dirección" }).click();
    await expect(page.getByText("Carrera 50 # 10-20")).toBeVisible();
  });

  await test.step("agrega el producto al carrito", async () => {
    await page.goto(`/catalogo/${catalog.productId}`);
    await expect(page.getByRole("heading", { name: catalog.productName })).toBeVisible();
    await page.getByRole("button", { name: "Agregar al carrito" }).click();
    await expect(page.getByText(/Agregado\. Tienes 1 unidad en el carrito/)).toBeVisible();
  });

  await test.step("confirma el pedido en la dirección de la oficina: se reserva una unidad", async () => {
    await page.goto("/carrito");
    // La persona hace clic en la tarjeta de la dirección; el radio queda marcado
    await page.getByText("Carrera 50 # 10-20, Medellín (050021), Colombia").click();
    await expect(page.getByRole("radio", { name: /Adicional 1: Carrera 50 # 10-20/ })).toBeChecked();
    await page.getByRole("button", { name: "Confirmar pedido" }).click();
    await expect(page.getByText("¡Pedido creado!")).toBeVisible();
    orderId = page.url().split("/pedidos/")[1] ?? "";
    expect(orderId).not.toBe("");
    // El pedido guardó la dirección elegida, no la principal
    await expect(page.locator("address")).toContainText("Carrera 50 # 10-20");
    expect(await stockOf(catalog.productId, catalog.warehouseId)).toMatchObject({ quantity: 5, reservedQuantity: 1 });
  });

  await test.step("paga el pedido (pago simulado)", async () => {
    await page.getByRole("button", { name: `Pagar ${money(catalog.price)}` }).click();
    await expect(page.getByText("Pagado", { exact: true }).first()).toBeVisible();
  });
});

test("el administrador genera la factura y el comprador la ve", async ({ browser }) => {
  const admin = await newSession(browser);
  await loginAs(admin, ADMIN.email, ADMIN.password);
  await admin.goto(`/pedidos/${orderId}`);
  await admin.getByRole("button", { name: `Generar factura por ${money(catalog.price)}` }).click();
  await expect(admin.getByRole("link", { name: /Ver factura/ })).toBeVisible();

  await buyerPage.goto("/facturas");
  await expect(buyerPage.getByText(money(catalog.price))).toBeVisible();
});

test("el operador logístico crea el envío, lo despacha y confirma la entrega", async ({ browser }) => {
  const page = await newSession(browser);
  await loginAs(page, catalog.operator.email, catalog.operator.password);

  await test.step("crea el envío del pedido pagado", async () => {
    await page.goto("/envios");
    await expect(page.getByText("Entregar en: Carrera 50 # 10-20, Medellín")).toBeVisible();
    // La tarjeta más interna que tiene a la vez el número del pedido y el botón
    const createButton = page.getByRole("button", { name: "Crear envío" });
    const card = page
      .locator("div")
      .filter({ hasText: `Pedido #${orderId.slice(0, 8).toUpperCase()}` })
      .filter({ has: createButton })
      .last();
    await card.getByRole("button", { name: "Crear envío" }).click();
    await expect(page).toHaveURL(/\/envios\/[\w-]+$/);
    await expect(page.getByText(/Envío creado con la guía NX-/)).toBeVisible();
    await expect(page.locator("address")).toContainText("Medellín");
  });

  await test.step("despacha: la unidad sale del inventario", async () => {
    await page.getByRole("button", { name: "Despachar" }).click();
    await page.getByRole("button", { name: "Sí, despachar" }).click();
    await expect(page.getByRole("heading", { name: /Siguiente paso: entregado/i })).toBeVisible();
    expect(await stockOf(catalog.productId, catalog.warehouseId)).toMatchObject({ quantity: 4, reservedQuantity: 0 });
  });

  await test.step("confirma la entrega", async () => {
    await page.getByRole("button", { name: "Confirmar entrega" }).click();
    await page.getByRole("button", { name: "Sí, confirmar entrega" }).click();
    await expect(page.getByText("Entregado. El envío y el pedido quedaron cerrados.")).toBeVisible();
  });
});

test("el comprador ve su pedido entregado", async () => {
  await buyerPage.goto(`/pedidos/${orderId}`);
  await expect(buyerPage.getByText("Entregado", { exact: true }).first()).toBeVisible();
  await expect(buyerPage.getByText(/NX-/).first()).toBeVisible();
});

test("cada rol solo entra a sus pantallas", async ({ browser }) => {
  const page = await newSession(browser);
  await loginAs(page, catalog.operator.email, catalog.operator.password);
  for (const path of ["/usuarios", "/reportes", "/facturas", "/productos"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/inicio$/);
  }
  await buyerPage.goto("/envios");
  await expect(buyerPage).toHaveURL(/\/inicio$/);
});

test("con restricción comercial el comprador conserva su carrito pero no puede confirmar", async ({ browser }) => {
  buyerId = (
    await buyerPage.evaluate(async (api) => {
      const token = localStorage.getItem("nexus-token");
      const response = await fetch(`${api}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      return (await response.json()) as { id: string };
    }, API_URL)
  ).id;

  const admin = await newSession(browser);
  await loginAs(admin, ADMIN.email, ADMIN.password);
  await admin.goto(`/usuarios/${buyerId}`);
  await admin.getByRole("button", { name: "Restringir comercialmente" }).click();
  await admin.getByRole("button", { name: "Sí, restringir" }).click();
  await expect(admin.getByText("Restringido", { exact: true })).toBeVisible();

  await buyerPage.goto(`/catalogo/${catalog.productId}`);
  await buyerPage.getByRole("button", { name: "Agregar al carrito" }).click();
  await buyerPage.goto("/carrito");
  await expect(buyerPage.getByText(/Tu cuenta tiene una restricción comercial/)).toBeVisible();
  await expect(buyerPage.getByRole("button", { name: "Confirmar pedido" })).toBeDisabled();

  // Al quitar la restricción vuelve a poder confirmar
  await admin.getByRole("button", { name: "Quitar restricción" }).click();
  await admin.getByRole("button", { name: "Sí, quitar restricción" }).click();
  await expect(admin.getByText("Comercialmente activo")).toBeVisible();
  await buyerPage.reload();
  await expect(buyerPage.getByRole("button", { name: "Confirmar pedido" })).toBeEnabled();
});
