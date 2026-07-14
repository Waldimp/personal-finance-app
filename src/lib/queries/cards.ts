import type { SupabaseClient } from "@supabase/supabase-js";
import { todayLocal } from "@/lib/dates";
import type { CardPayment, PaymentMethod } from "@/lib/types";

export type CardCycle = {
  method: PaymentMethod;
  /** Rango del ciclo actual (corte a corte). */
  cycleStart: string;
  cycleEnd: string;
  /** Cargos acumulados en el ciclo actual. */
  currentCharges: number;
  /** Cargos del ciclo anterior (lo que "cerró" en el último corte). */
  previousCharges: number;
  /** Abonos registrados desde el último corte. */
  paymentsSinceCut: number;
  /** Estimado a pagar del corte anterior. */
  estimatedDue: number;
  /** Fecha límite de pago estimada (si hay payment_due_day). */
  dueDate: string | null;
  recentPayments: CardPayment[];
};

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Suma días a una fecha YYYY-MM-DD. */
function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return ymd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** Fecha del día `day` en el mes de `ref` con offset de meses, clampeada. */
function dayInMonth(ref: string, monthOffset: number, day: number): string {
  const [y, m] = ref.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1 + monthOffset, 1));
  const lastDay = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)
  ).getUTCDate();
  return ymd(
    base.getUTCFullYear(),
    base.getUTCMonth() + 1,
    Math.min(day, lastDay)
  );
}

export async function getCardCycles(
  supabase: SupabaseClient
): Promise<CardCycle[]> {
  const today = todayLocal();
  const todayDay = Number(today.slice(8, 10));

  const [{ data: methods }, { data: payments }] = await Promise.all([
    supabase
      .from("payment_methods")
      .select("*")
      .eq("type", "credit")
      .eq("is_archived", false)
      .order("created_at"),
    supabase
      .from("card_payments")
      .select("*")
      .order("paid_date", { ascending: false }),
  ]);

  const cards = (methods ?? []) as PaymentMethod[];
  const allPayments = (payments ?? []) as CardPayment[];

  const results: CardCycle[] = [];

  for (const method of cards) {
    const cut = method.cut_day;
    if (!cut) {
      // Sin día de corte configurado: ciclo = mes calendario.
      results.push(await buildCycle(supabase, method, `${today.slice(0, 7)}-01`, dayInMonth(today, 1, 0), allPayments, null));
      continue;
    }

    // Último corte: día `cut` de este mes si ya pasó, si no, del mes anterior.
    const lastCut =
      todayDay > cut ? dayInMonth(today, 0, cut) : dayInMonth(today, -1, cut);
    const cycleStart = addDays(lastCut, 1);
    const cycleEnd =
      todayDay > cut ? dayInMonth(today, 1, cut) : dayInMonth(today, 0, cut);

    // Fecha límite de pago: el payment_due_day siguiente al último corte.
    let dueDate: string | null = null;
    if (method.payment_due_day) {
      const sameMonthDue = dayInMonth(lastCut, 0, method.payment_due_day);
      dueDate =
        sameMonthDue > lastCut
          ? sameMonthDue
          : dayInMonth(lastCut, 1, method.payment_due_day);
    }

    results.push(
      await buildCycle(supabase, method, cycleStart, cycleEnd, allPayments, dueDate)
    );
  }

  return results;
}

async function buildCycle(
  supabase: SupabaseClient,
  method: PaymentMethod,
  cycleStart: string,
  cycleEnd: string,
  allPayments: CardPayment[],
  dueDate: string | null
): Promise<CardCycle> {
  // Ciclo anterior: mismo largo, terminando el día antes del inicio actual.
  const prevEnd = addDays(cycleStart, -1);
  const [y1, m1] = cycleStart.split("-").map(Number);
  const prevStartDt = new Date(Date.UTC(y1, m1 - 2, Number(cycleStart.slice(8, 10))));
  const prevStart = ymd(
    prevStartDt.getUTCFullYear(),
    prevStartDt.getUTCMonth() + 1,
    prevStartDt.getUTCDate()
  );

  const { data: txs } = await supabase
    .from("transactions")
    .select("amount, tx_date")
    .eq("payment_method_id", method.id)
    .eq("type", "expense")
    .gte("tx_date", prevStart)
    .lte("tx_date", cycleEnd);

  let currentCharges = 0;
  let previousCharges = 0;
  for (const tx of txs ?? []) {
    const d = tx.tx_date as string;
    if (d >= cycleStart) currentCharges += Number(tx.amount);
    else if (d <= prevEnd) previousCharges += Number(tx.amount);
  }

  const methodPayments = allPayments.filter(
    (p) => p.payment_method_id === method.id
  );
  const paymentsSinceCut = methodPayments
    .filter((p) => p.paid_date >= cycleStart)
    .reduce((s, p) => s + Number(p.amount), 0);

  return {
    method,
    cycleStart,
    cycleEnd,
    currentCharges,
    previousCharges,
    paymentsSinceCut,
    estimatedDue: Math.max(0, previousCharges - paymentsSinceCut),
    dueDate,
    recentPayments: methodPayments.slice(0, 5),
  };
}
