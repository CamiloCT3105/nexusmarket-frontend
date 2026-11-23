// Mismas reglas que el backend (RN-68): URL https, sin usuario ni contraseña, máximo 2048 caracteres.
// Vacía significa "sin foto". Devuelve el mensaje de error, o undefined si es válida.
export const MAX_IMAGE_URL_LENGTH = 2048;

export function imageUrlError(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  if (trimmed.length > MAX_IMAGE_URL_LENGTH) return `La URL admite como máximo ${MAX_IMAGE_URL_LENGTH} caracteres.`;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return "Pega la dirección completa de la imagen, por ejemplo https://…/foto.jpg.";
  }
  if (url.protocol !== "https:") return "La URL debe empezar por https://.";
  if (url.username !== "" || url.password !== "") return "La URL no puede incluir usuario ni contraseña.";
  return undefined;
}
