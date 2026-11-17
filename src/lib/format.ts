// Formatos de presentación en español (Colombia)

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return money.format(value);
}

const dateTime = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" });

export function formatDateTime(value: string | Date): string {
  return dateTime.format(typeof value === "string" ? new Date(value) : value);
}

// Id corto y legible para mostrar (los UUID completos no aportan en pantalla)
export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
