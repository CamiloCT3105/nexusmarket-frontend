import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, IdCard, Lock, Mail, User } from "lucide-react";
import { usersApi } from "@/api/admin";
import type { UserRole } from "@/api/types";
import { roleLabel } from "@/auth/roles";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { ALL_ROLES, ROLE_IMPLICATION } from "@/features/admin/labels";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { validateNewUser, type NewUserErrors, type NewUserForm } from "@/lib/userValidation";

export function CreateUserPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewUserForm>({ fullName: "", email: "", documentNumber: "", password: "", confirm: "" });
  const [role, setRole] = useState<UserRole>("SELLER");
  const [errors, setErrors] = useState<NewUserErrors>({});

  const create = useMutation({
    mutationFn: () =>
      usersApi.create({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        documentNumber: form.documentNumber,
        password: form.password,
        role,
      }),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.setQueryData(["user", user.id], user);
      navigate(`/usuarios/${user.id}`, { state: { created: true } });
    },
  });

  const set = (field: keyof NewUserForm) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateNewUser(form);
    setErrors(found);
    if (Object.keys(found).length === 0) create.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/usuarios" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Usuarios
      </Link>
      <div>
        <h1 className="text-3xl font-semibold">Nuevo usuario</h1>
        <p className="mt-1 text-muted">Los compradores se registran solos; aquí se crean las cuentas de los demás roles.</p>
      </div>

      <form onSubmit={submit} noValidate className="space-y-6">
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">Datos de la persona</h2>
          <Input label="Nombre completo" value={form.fullName} onChange={set("fullName")} error={errors.fullName} leading={<User className="size-4" />} autoComplete="off" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Correo electrónico" type="email" value={form.email} onChange={set("email")} error={errors.email} leading={<Mail className="size-4" />} autoComplete="off" />
            <Input
              label="Documento de identidad"
              value={form.documentNumber}
              onChange={set("documentNumber")}
              error={errors.documentNumber}
              hint="Sin espacios ni puntos. Único en la plataforma."
              leading={<IdCard className="size-4" />}
              autoComplete="off"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Contraseña inicial"
              type="password"
              value={form.password}
              onChange={set("password")}
              error={errors.password}
              hint="Mínimo 8 caracteres. Entrégala a la persona por un canal seguro."
              leading={<Lock className="size-4" />}
              autoComplete="new-password"
            />
            <Input label="Confirmar contraseña" type="password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} leading={<Lock className="size-4" />} autoComplete="new-password" />
          </div>
        </Card>

        <Card className="p-5">
          <fieldset>
            <legend className="mb-3 font-semibold">Rol</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_ROLES.map((value) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
                    role === value ? "border-brand bg-brand-soft/50" : "border-border hover:bg-surface-2/60"
                  )}
                >
                  <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="mt-1 accent-[var(--color-brand)]" />
                  <span>
                    <span className="block text-sm font-medium">{roleLabel(value)}</span>
                    <span className="block text-xs text-muted">{ROLE_IMPLICATION[value]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Card>

        {create.error && <Alert tone="error">{errorMessage(create.error, "No se pudo crear el usuario.")}</Alert>}
        <div className="flex justify-end gap-2">
          <Link to="/usuarios">
            <Button variant="ghost">Cancelar</Button>
          </Link>
          <Button type="submit" loading={create.isPending}>
            Crear usuario
          </Button>
        </div>
      </form>
    </div>
  );
}
