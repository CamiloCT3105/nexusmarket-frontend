import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { IdCard, Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/api/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { validateNewUser as validate, type NewUserErrors as Errors, type NewUserForm as Form } from "@/lib/userValidation";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({ fullName: "", email: "", documentNumber: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof Form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError(null);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        documentNumber: form.documentNumber,
        password: form.password,
      });
      void navigate("/inicio", { replace: true });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "No se pudo completar el registro.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-semibold">Crea tu cuenta</h2>
      <p className="mt-2 text-sm text-muted">Regístrate como comprador para empezar a comprar.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <Input
          label="Nombre completo"
          autoComplete="name"
          value={form.fullName}
          onChange={set("fullName")}
          error={errors.fullName}
          leading={<User className="size-4" />}
          placeholder="Ana Gómez"
        />
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          leading={<Mail className="size-4" />}
          placeholder="tu@correo.com"
        />
        <Input
          label="Documento de identidad"
          value={form.documentNumber}
          onChange={set("documentNumber")}
          error={errors.documentNumber}
          hint="Sin espacios ni puntos. Debe ser único en la plataforma."
          leading={<IdCard className="size-4" />}
          placeholder="1020304050"
          inputMode="text"
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          hint="Mínimo 8 caracteres."
          leading={<Lock className="size-4" />}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
          leading={<Lock className="size-4" />}
        />
        <Button type="submit" size="lg" loading={submitting} className="mt-2">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-medium text-brand-fg hover:underline">
          Inicia sesión
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-muted">Los vendedores no se registran aquí: los incorpora un administrador.</p>
    </div>
  );
}
