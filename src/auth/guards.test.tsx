import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeUser, renderWithApp } from "@/test/render";
import { ByRole, RequireRole } from "./guards";

const home = { path: "/inicio", element: <p>Inicio</p> };

describe("RequireRole", () => {
  it("muestra la pantalla al rol permitido", () => {
    renderWithApp(
      <RequireRole roles={["ADMIN"]}>
        <p>Usuarios</p>
      </RequireRole>,
      { user: makeUser("ADMIN"), extraRoutes: [home] },
    );
    expect(screen.getByText("Usuarios")).toBeInTheDocument();
  });

  it.each(["BUYER", "SELLER", "LOGISTICS_OPERATOR", "SUPERVISOR"] as const)("redirige al inicio a %s", (role) => {
    const { router } = renderWithApp(
      <RequireRole roles={["ADMIN"]}>
        <p>Usuarios</p>
      </RequireRole>,
      { user: makeUser(role), extraRoutes: [home] },
    );
    expect(screen.queryByText("Usuarios")).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/inicio");
  });
});

describe("ByRole", () => {
  const views = { BUYER: <p>Mis pedidos</p>, SELLER: <p>Ventas</p> };

  it("elige la pantalla según el rol de la sesión", () => {
    renderWithApp(<ByRole views={views} />, { user: makeUser("SELLER"), extraRoutes: [home] });
    expect(screen.getByText("Ventas")).toBeInTheDocument();
  });

  it("redirige al inicio si el rol no tiene pantalla en esa ruta", () => {
    const { router } = renderWithApp(<ByRole views={views} />, { user: makeUser("LOGISTICS_OPERATOR"), extraRoutes: [home] });
    expect(router.state.location.pathname).toBe("/inicio");
  });
});
