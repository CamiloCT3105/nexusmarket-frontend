import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/api/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Si llegó aquí desde una ruta protegida, vuelve a ella después de entrar
  const from = (location.state as { from?: string } | null)?.from ?? "/inicio";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      void navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-semibold">Bienvenido de nuevo</h2>
      <p className="mt-2 text-sm text-muted">Ingresa con tu correo y contraseña.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leading={<Mail className="size-4" />}
          placeholder="tu@correo.com"
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leading={<Lock className="size-4" />}
          placeholder="••••••••"
        />
        <Button type="submit" size="lg" loading={submitting} disabled={!email || !password} className="mt-2">
          Iniciar sesión
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Aún no tienes cuenta?{" "}
        <Link to="/registro" className="font-medium text-brand-fg hover:underline">
          Regístrate como comprador
        </Link>
      </p>
    </div>
  );
}
