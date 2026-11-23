import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductArt } from "./ProductArt";

const base = { id: "p1", type: "PHYSICAL", name: "Lámpara" } as const;

describe("ProductArt", () => {
  it("muestra la foto del producto con su texto alternativo", () => {
    render(<ProductArt {...base} imageUrl="https://images.example.com/lampara.jpg" alt="Lámpara" />);
    const img = screen.getByRole("img", { name: "Lámpara" });
    expect(img).toHaveAttribute("src", "https://images.example.com/lampara.jpg");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("sin foto muestra la ilustración (oculta para lectores de pantalla)", () => {
    const { container } = render(<ProductArt {...base} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("si el enlace falla, cambia a la ilustración en lugar de una imagen rota", () => {
    const { container } = render(<ProductArt {...base} imageUrl="https://images.example.com/rota.jpg" alt="Lámpara" />);
    fireEvent.error(screen.getByRole("img", { name: "Lámpara" }));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("vuelve a intentar cuando cambia la URL", () => {
    const { rerender } = render(<ProductArt {...base} imageUrl="https://images.example.com/rota.jpg" alt="Lámpara" />);
    fireEvent.error(screen.getByRole("img", { name: "Lámpara" }));
    rerender(<ProductArt {...base} imageUrl="https://images.example.com/nueva.jpg" alt="Lámpara" />);
    expect(screen.getByRole("img", { name: "Lámpara" })).toHaveAttribute("src", "https://images.example.com/nueva.jpg");
  });
});
