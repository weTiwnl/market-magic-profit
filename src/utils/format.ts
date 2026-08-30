const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const pct = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Rounding happens here only — never inside the calculation engine. */
export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return brl.format(value);
}

export function formatMoneySigned(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value < 0 ? "− " : "";
  return `${sign}${brl.format(Math.abs(value))}`;
}

export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return `${pct.format(Number(value.toFixed(digits)))}%`;
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

/** Parses a pt-BR typed value ("1.234,56") into a float. */
export function parseNumberInput(raw: string): number {
  if (!raw) return 0;
  const normalized = raw
    .replace(/\s/g, "")
    .replace(/[R$]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".")
    .replace(/[^0-9.\-]/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
