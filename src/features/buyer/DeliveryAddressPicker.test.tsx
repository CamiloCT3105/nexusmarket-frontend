import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Buyer } from "@/api/types";
import { makeUser, renderWithApp } from "@/test/render";
import { DeliveryAddressPicker } from "./DeliveryAddressPicker";

const buyer = (additional: Buyer["additionalAddresses"]): Buyer => ({
  userId: "b1",
  primaryAddress: { street: "Calle 1", city: "Bogotá", country: "Colombia", postalCode: "110111" },
  additionalAddresses: additional,
  commercialStatus: "ACTIVE",
});

describe("DeliveryAddressPicker", () => {
  it("con una sola dirección la muestra e invita a agregar otra", () => {
    renderWithApp(<DeliveryAddressPicker buyer={buyer([])} value={0} onChange={vi.fn()} />, { user: makeUser("BUYER") });
    expect(screen.getByText("Entrega en tu dirección principal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agregar otra dirección" })).toHaveAttribute("href", "/perfil");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("con varias direcciones permite elegir y devuelve su posición", async () => {
    const onChange = vi.fn();
    renderWithApp(
      <DeliveryAddressPicker
        buyer={buyer([{ street: "Carrera 50", city: "Medellín", country: "Colombia", postalCode: "050021" }])}
        value={0}
        onChange={onChange}
      />,
      { user: makeUser("BUYER") },
    );
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios[0]).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: /Adicional 1: Carrera 50, Medellín/ }));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
