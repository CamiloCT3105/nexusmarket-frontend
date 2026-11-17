import { Link } from "react-router";
import { ArrowRight, Clock } from "lucide-react";
import { useCurrentUser } from "@/auth/AuthContext";
import { ROLES } from "@/auth/roles";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

// Inicio de cada rol: qué puede hacer y qué módulos están disponibles o en camino
export function HomePage() {
  const user = useCurrentUser();
  const role = ROLES[user.role];
  const firstName = user.fullName.split(" ")[0];

  return (
    <div>
      <Badge tone="brand">{role.label}</Badge>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Hola, {firstName}</h1>
      <p className="mt-2 max-w-2xl text-muted">{role.description}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {role.modules.map((module) => {
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">{module.title}</h2>
                {module.to ? (
                  <ArrowRight className="size-5 text-brand-fg transition-transform group-hover:translate-x-1" />
                ) : (
                  <Badge>
                    <Clock className="size-3" /> Próximamente
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-muted">{module.description}</p>
            </>
          );
          return module.to ? (
            <Link key={module.title} to={module.to} className="group">
              <Card className="h-full p-5 transition-colors group-hover:border-brand/50">{content}</Card>
            </Link>
          ) : (
            <Card key={module.title} className="h-full p-5 opacity-70">
              {content}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
