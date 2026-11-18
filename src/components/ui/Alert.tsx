import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "error" | "success" | "info";

const tones: Record<Tone, { box: string; icon: ReactNode }> = {
  error: { box: "border-danger/30 bg-danger-soft text-danger", icon: <AlertTriangle className="size-4 shrink-0" /> },
  success: { box: "border-accent/30 bg-accent-soft text-accent-fg", icon: <CheckCircle2 className="size-4 shrink-0" /> },
  info: { box: "border-brand/30 bg-brand-soft text-brand-fg", icon: <Info className="size-4 shrink-0" /> },
};

export function Alert({ tone = "info", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm", tones[tone].box, className)}
    >
      <span className="mt-0.5">{tones[tone].icon}</span>
      <div>{children}</div>
    </div>
  );
}
