const formatter = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1234.5 → '$1,234.50' */
export function formatMoney(amount: number): string {
  return formatter.format(amount);
}

/** Redondea a 2 decimales evitando errores de flotantes. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
