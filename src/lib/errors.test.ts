import { describe, expect, it } from "vitest";
import { ApiError } from "@/api/client";
import { errorMessage, notFoundAsNull } from "./errors";
import { shortId } from "./format";

describe("errorMessage", () => {
  it("usa el mensaje del backend cuando es un ApiError", () => {
    expect(errorMessage(new ApiError("Stock insuficiente.", 409))).toBe("Stock insuficiente.");
  });

  it("usa el texto alterno para cualquier otro error", () => {
    expect(errorMessage(new Error("detalle interno"), "No se pudo guardar.")).toBe("No se pudo guardar.");
  });
});

describe("notFoundAsNull", () => {
  it("convierte un 404 en null (recurso que aún no existe)", async () => {
    await expect(notFoundAsNull(Promise.reject(new ApiError("No existe", 404)))).resolves.toBeNull();
  });

  it("deja pasar el resultado y los demás errores", async () => {
    await expect(notFoundAsNull(Promise.resolve("factura"))).resolves.toBe("factura");
    await expect(notFoundAsNull(Promise.reject(new ApiError("Prohibido", 403)))).rejects.toThrow("Prohibido");
  });
});

describe("shortId", () => {
  it("muestra los primeros 8 caracteres en mayúscula", () => {
    expect(shortId("0fdf60d4-1798-4a68-a5db-2b33c964d715")).toBe("0FDF60D4");
  });
});
