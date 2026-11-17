// Une clases CSS ignorando las vacías: cn("a", cond && "b") → "a b" o "a"
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
