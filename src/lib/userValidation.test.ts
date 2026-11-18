import { describe, expect, it } from "vitest";
import { validateNewUser, type NewUserForm } from "./userValidation";

const valid: NewUserForm = {
  fullName: "Ana Gómez",
  email: "ana@correo.com",
  documentNumber: "1020304050",
  password: "secreta123",
  confirm: "secreta123",
};

describe("validateNewUser", () => {
  it("acepta un formulario válido", () => {
    expect(validateNewUser(valid)).toEqual({});
  });

  it("exige nombre, correo válido y contraseña de 8 caracteres", () => {
    const errors = validateNewUser({ ...valid, fullName: "  ", email: "ana@", password: "corta", confirm: "corta" });
    expect(Object.keys(errors).sort()).toEqual(["email", "fullName", "password"]);
  });

  it("avisa si las contraseñas no coinciden", () => {
    expect(validateNewUser({ ...valid, confirm: "otra-cosa" })).toEqual({ confirm: "Las contraseñas no coinciden." });
  });

  // Mismas reglas que el backend: sin espacios ni puntos, 5 a 20 caracteres
  it.each([
    ["1.020.304.050", true],
    ["ab-123", true],
    ["123", false],
    ["documento con espacios y muy largo", false],
    ["12$45", false],
  ])("documento %s → válido: %s", (documentNumber, ok) => {
    expect("documentNumber" in validateNewUser({ ...valid, documentNumber })).toBe(!ok);
  });
});
