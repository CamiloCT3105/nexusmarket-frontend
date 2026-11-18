import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarList } from "./charts";

describe("BarList", () => {
  it("muestra cada barra con su valor en texto y su participación para lectores de pantalla", () => {
    render(
      <BarList
        ariaLabel="Pedidos por estado"
        bars={[
          { key: "a", label: "Pagado", value: 3 },
          { key: "b", label: "Entregado", value: 1 },
        ]}
      />,
    );
    const list = screen.getByRole("list", { name: "Pedidos por estado" });
    const [paid, delivered] = within(list).getAllByRole("listitem");
    expect(paid).toHaveTextContent("Pagado3, 75% del total");
    expect(delivered).toHaveTextContent("Entregado1, 25% del total");
  });

  it("usa el formato indicado para los valores", () => {
    render(<BarList ariaLabel="Ingresos" format={(value) => `$ ${value}`} bars={[{ key: "x", label: "Nova", value: 500 }]} />);
    expect(screen.getAllByText("$ 500")[0]).toBeInTheDocument();
  });

  it("muestra el texto vacío si no hay datos o todo está en cero", () => {
    render(<BarList ariaLabel="Ventas" emptyText="Sin ventas en este periodo." bars={[{ key: "x", label: "Nova", value: 0 }]} />);
    expect(screen.getByText("Sin ventas en este periodo.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
