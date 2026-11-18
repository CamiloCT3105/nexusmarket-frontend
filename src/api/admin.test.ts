import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, requestBody, requestUrl } from "@/test/render";
import { adminBuyersApi } from "./admin";
import { ordersApi } from "./orders";

// Contratos con el backend: nombre exacto de los campos que espera cada endpoint
describe("contratos de la API", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(jsonResponse({}));
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("el estado comercial se envía como commercialStatus", async () => {
    await adminBuyersApi.setCommercialStatus("u1", "RESTRICTED");
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(requestUrl(url).pathname).toBe("/api/buyers/u1/commercial-status");
    expect(init?.method).toBe("PATCH");
    expect(requestBody(init)).toEqual({ commercialStatus: "RESTRICTED" });
  });

  it("el checkout envía la dirección de entrega elegida (0 = principal por defecto)", async () => {
    await ordersApi.checkout();
    await ordersApi.checkout(2);
    expect(fetchMock.mock.calls.map(([, init]) => requestBody(init))).toEqual([{ addressIndex: 0 }, { addressIndex: 2 }]);
  });
});
