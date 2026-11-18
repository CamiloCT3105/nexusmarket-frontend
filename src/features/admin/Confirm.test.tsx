import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/client";
import { Confirm } from "./Confirm";

describe("Confirm", () => {
  it("confirma o cancela con sus botones", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <Confirm confirmLabel="Sí, bloquear" danger loading={false} onConfirm={onConfirm} onCancel={onCancel}>
        ¿Bloquear a Ana?
      </Confirm>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Sí, bloquear" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("muestra el error del backend y no permite cancelar mientras se procesa", () => {
    render(
      <Confirm confirmLabel="Sí" loading error={new ApiError("No autorizado.", 403)} onConfirm={vi.fn()} onCancel={vi.fn()}>
        ¿Seguro?
      </Confirm>,
    );
    expect(screen.getByText("No autorizado.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});
