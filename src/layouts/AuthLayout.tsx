import { Outlet } from "react-router";
import { PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const FEATURES = [
  { icon: ShieldCheck, title: "Compra segura", text: "Inventario reservado al confirmar: nunca se vende lo que no hay." },
  { icon: Truck, title: "Seguimiento completo", text: "Del pago a la entrega, con historial de cada envío." },
  { icon: PackageCheck, title: "Posventa clara", text: "Devoluciones y reembolsos con el precio que pagaste." },
];

// Pantallas de acceso: formulario a la derecha y presentación de la marca a la izquierda
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-border bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-32 size-[32rem] rounded-full bg-brand/25 blur-3xl"
        />
        <div aria-hidden="true" className="absolute -right-24 bottom-0 size-80 rounded-full bg-accent/15 blur-3xl" />

        <Logo className="relative" />

        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">
            El marketplace que conecta <span className="text-brand-fg">compradores</span> y{" "}
            <span className="text-accent-fg">vendedores</span>.
          </h1>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-fg">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted">© {new Date().getFullYear()} NexusMarket</p>
      </aside>

      <section className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Logo className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-16 sm:px-6">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </div>
      </section>
    </div>
  );
}
