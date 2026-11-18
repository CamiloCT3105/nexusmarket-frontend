import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReturnRequest } from "@/api/types";
import { jsonResponse, makeUser, renderWithApp, requestBody, requestUrl } from "@/test/render";
import { ReturnRequests } from "./SellerReturnsPage";

const request: ReturnRequest = {
  id: "r1",
  orderId: "o1",
  productId: "p1",
  quantity: 1,
  reason: "Llegó rota.",
  status: "REQUESTED",
  createdAt: "2026-11-17T12:00:00.000Z",
};

// Responde según la ruta pedida: listado de devoluciones, producto o la decisión
function backend(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>) {
  fetchMock.mockImplementation((input) => {
    const url = requestUrl(input);
    if (url.pathname === "/api/returns")
      return Promise.resolve(jsonResponse({ items: [request], page: 1, pageSize: 10, total: 1, totalPages: 1 }));
    if (url.pathname === "/api/products/p1") return Promise.resolve(jsonResponse({ id: "p1", name: "Set de tazas", variants: [] }));
    if (url.pathname === "/api/returns/r1/process") return Promise.resolve(jsonResponse({ ...request, status: "APPROVED" }));
    return Promise.resolve(jsonResponse({ message: "no simulado" }, 404));
  });
}

describe("ReturnRequests", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    backend(fetchMock);
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("pide confirmación antes de aprobar y usa el singular para una unidad", async () => {
    renderWithApp(<ReturnRequests admin />, { user: makeUser("ADMIN") });
    await userEvent.click(await screen.findByRole("button", { name: "Aprobar" }));
    expect(screen.getByText(/La unidad vuelve a la bodega de origen/)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => requestUrl(url).pathname.endsWith("/process"))).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Sí, aprobar" }));
    const call = fetchMock.mock.calls.find(([url]) => requestUrl(url).pathname.endsWith("/process"));
    expect(requestBody(call?.[1])).toEqual({ approve: true });
  });

  it("en modo consulta (supervisor) muestra la solicitud sin acciones", async () => {
    renderWithApp(<ReturnRequests admin readOnly />, { user: makeUser("SUPERVISOR") });
    expect(await screen.findByText("“Llegó rota.”")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rechazar" })).not.toBeInTheDocument();
  });
});
