import { describe, expect, it } from "vitest";
import { imageUrlError } from "./imageUrl";

describe("imageUrlError", () => {
  it("acepta una URL https y el campo vacío (sin foto)", () => {
    expect(imageUrlError("https://images.example.com/lampara.jpg?w=800")).toBeUndefined();
    expect(imageUrlError("   ")).toBeUndefined();
  });

  it("rechaza lo que el backend también rechaza", () => {
    expect(imageUrlError("http://images.example.com/a.jpg")).toMatch(/https/);
    expect(imageUrlError("javascript:alert(1)")).toMatch(/https/);
    expect(imageUrlError("foto de la lámpara")).toMatch(/dirección completa/);
    expect(imageUrlError("https://u:p@images.example.com/a.jpg")).toMatch(/usuario/);
    expect(imageUrlError(`https://images.example.com/${"a".repeat(2100)}`)).toMatch(/2048/);
  });
});
