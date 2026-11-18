// Mismas reglas que el backend para crear un usuario, para avisar antes de enviar (el backend vuelve a validar)

export type NewUserForm = { fullName: string; email: string; documentNumber: string; password: string; confirm: string };
export type NewUserErrors = Partial<Record<keyof NewUserForm, string>>;

export function validateNewUser(form: NewUserForm): NewUserErrors {
  const errors: NewUserErrors = {};
  if (!form.fullName.trim()) errors.fullName = "Escribe el nombre completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Escribe un correo válido.";
  const document = form.documentNumber.replace(/[\s.]/g, "").toUpperCase();
  if (!/^[A-Z0-9-]{5,20}$/.test(document)) {
    errors.documentNumber = "Entre 5 y 20 caracteres: letras, números o guiones.";
  }
  if (form.password.length < 8) errors.password = "Mínimo 8 caracteres.";
  if (form.confirm !== form.password) errors.confirm = "Las contraseñas no coinciden.";
  return errors;
}
