import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, requestUrl } from "@/test/render";
import { api, ApiError, onUnauthorized, tokenStore } from "./client";
import { availableUnits } from "./seller";

describe("api (cliente HTTP)", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => vi.stubGlobal("fetch", fetchMock));
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  const lastCall = () => {
    const [url, init] = fetchMock.mock.calls.at(-1) ?? [];
    return { url: requestUrl(url), init: init ?? {} };
  };

  it("omite los filtros vacíos y envía los demás en la URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [] }));
    await api("/api/products", { query: { search: "taza", type: undefined, sellerId: "", page: 2 } });
    const { url } = lastCall();
    expect(url.pathname).toBe("/api/products");
    expect(Object.fromEntries(url.searchParams)).toEqual({ search: "taza", page: "2" });
  });

  it("agrega el token y el cuerpo JSON cuando corresponde", async () => {
    tokenStore.set("token-123");
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }, 201));
    await api("/api/orders/checkout", { method: "POST", body: { a: 1 } });
    const { init } = lastCall();
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Authorization: "Bearer token-123", "Content-Type": "application/json" });
    expect(init.body).toBe('{"a":1}');
  });

  it("convierte la respuesta de error del backend en ApiError con su mensaje", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Stock insuficiente." }, 409));
    const error = await api("/api/orders/checkout", { method: "POST" }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: "Stock insuficiente.", status: 409 });
  });

  it("avisa a la sesión cuando el backend responde 401 con token (sesión vencida)", async () => {
    tokenStore.set("vencido");
    const listener = vi.fn();
    const stop = onUnauthorized(listener);
    fetchMock.mockResolvedValue(jsonResponse({ message: "Token inválido o expirado." }, 401));
    await expect(api("/api/auth/me")).rejects.toThrow("Token inválido o expirado.");
    expect(listener).toHaveBeenCalledOnce();
    stop();
  });

  it("explica que no hay conexión si el backend no responde", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(api("/api/products")).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining("No se pudo conectar") as unknown,
    });
  });
});

describe("availableUnits", () => {
  it("descuenta las unidades reservadas y dañadas", () => {
    expect(availableUnits({ productId: "p", warehouseId: "w", quantity: 20, reservedQuantity: 3, damagedQuantity: 2 })).toBe(15);
  });
});
