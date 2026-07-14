const TIME_ZONE = "America/El_Salvador";

/** Fecha de hoy en El Salvador como 'YYYY-MM-DD' (en-CA da ese formato). */
export function todayLocal(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(
    new Date()
  );
}

/** Mes actual en El Salvador como 'YYYY-MM'. */
export function currentMonth(): string {
  return todayLocal().slice(0, 7);
}

/** Suma (o resta) meses a un 'YYYY-MM'. */
export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/** Primer y último día de un mes 'YYYY-MM' como 'YYYY-MM-DD'. */
export function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Días del mes 'YYYY-MM'. */
export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Días restantes del mes (incluye hoy). Si el mes no es el actual, 0. */
export function daysLeftInMonth(month: string): number {
  if (month !== currentMonth()) return 0;
  const today = Number(todayLocal().slice(8, 10));
  return daysInMonth(month) - today + 1;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** '2026-07' → 'Julio 2026' */
export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** '2026-07-13' → 'Dom 13 jul' (para agrupar listas por día). */
export function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekday = new Intl.DateTimeFormat("es", {
    weekday: "short",
    timeZone: "UTC",
  }).format(dt);
  const monthName = new Intl.DateTimeFormat("es", {
    month: "short",
    timeZone: "UTC",
  }).format(dt);
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${cap} ${d} ${monthName}`;
}
