import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addMonths,
  currentMonth,
  daysInMonth,
  monthRange,
  todayLocal,
} from "@/lib/dates";
import { getBudgetsWithSpent } from "@/lib/queries/budgets";
import { getCardCycles } from "@/lib/queries/cards";
import {
  getCommitmentProjection,
  getMonthCommitments,
} from "@/lib/queries/commitments";
import type { InsightContext, CategorySnapshot } from "@/lib/insights/types";
import type { Category } from "@/lib/types";

/**
 * Construye el contexto de insights del mes actual.
 * `incomeBase` viene del dashboard (ingresos esperados o estimado del perfil).
 */
export async function buildInsightContext(
  supabase: SupabaseClient,
  incomeBase: number
): Promise<InsightContext> {
  const month = currentMonth();
  const today = todayLocal();
  const daysElapsed = Number(today.slice(8, 10));
  const nextMonth = addMonths(month, 1);

  const fourMonthsAgo = addMonths(month, -3);
  const { start } = monthRange(fourMonthsAgo);
  const { end } = monthRange(month);

  const [
    { data: txs },
    { data: categories },
    budgets,
    commitments,
    projection,
    { data: plans },
    cycles,
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount, tx_date, category_id, description")
      .eq("type", "expense")
      .gte("tx_date", start)
      .lte("tx_date", end),
    supabase.from("categories").select("*").eq("type", "expense"),
    getBudgetsWithSpent(supabase, month),
    getMonthCommitments(supabase, month),
    getCommitmentProjection(supabase, nextMonth, 1),
    supabase
      .from("installment_plans")
      .select("description, monthly_amount, installment_payments(due_month, status)"),
    getCardCycles(supabase),
  ]);

  // Agregados por categoría y mes.
  const prevMonth = addMonths(month, -1);
  const catTotals = new Map<string, { current: number; previous: number; older: number[] }>();
  let totalSpent = 0;
  let totalSpentPrev = 0;
  let maxSingleExpense: InsightContext["maxSingleExpense"] = null;

  for (const tx of txs ?? []) {
    const m = (tx.tx_date as string).slice(0, 7);
    const amount = Number(tx.amount);
    const key = tx.category_id ?? "none";
    const entry =
      catTotals.get(key) ?? { current: 0, previous: 0, older: [] };
    if (m === month) {
      entry.current += amount;
      totalSpent += amount;
      if (!maxSingleExpense || amount > maxSingleExpense.amount) {
        maxSingleExpense = { amount, description: tx.description ?? "" };
      }
    } else if (m === prevMonth) {
      entry.previous += amount;
      totalSpentPrev += amount;
      entry.older.push(amount);
    } else {
      entry.older.push(amount);
    }
    catTotals.set(key, entry);
  }

  const catSnapshots: CategorySnapshot[] = ((categories ?? []) as Category[]).map(
    (c) => {
      const t = catTotals.get(c.id) ?? { current: 0, previous: 0, older: [] };
      const olderSum = t.older.reduce((s, v) => s + v, 0);
      return {
        id: c.id,
        name: c.name,
        needs_bucket: c.needs_bucket,
        current: t.current,
        previous: t.previous,
        avg3: olderSum / 3, // 3 meses previos al actual
      };
    }
  );

  // Planes cuya última cuota pendiente es este mes o el próximo.
  const plansEnding: InsightContext["plansEnding"] = [];
  for (const plan of plans ?? []) {
    const payments = (plan.installment_payments ?? []) as {
      due_month: string;
      status: string;
    }[];
    const pending = payments.filter((p) => p.status === "pending");
    if (pending.length === 0) continue;
    const lastMonth = pending.reduce(
      (max, p) => (p.due_month > max ? p.due_month : max),
      pending[0].due_month
    );
    if (lastMonth === month || lastMonth === nextMonth) {
      plansEnding.push({
        description: plan.description as string,
        monthly: Number(plan.monthly_amount),
        lastMonth,
      });
    }
  }

  // Días hasta el corte de cada tarjeta.
  const cardCuts = cycles
    .filter((c) => c.method.cut_day)
    .map((c) => {
      const [y, m, d] = today.split("-").map(Number);
      const [ey, em, ed] = c.cycleEnd.split("-").map(Number);
      const diffDays = Math.round(
        (Date.UTC(ey, em - 1, ed) - Date.UTC(y, m - 1, d)) / 86_400_000
      );
      return {
        name: c.method.name,
        daysToCut: diffDays,
        currentCharges: c.currentCharges,
      };
    });

  return {
    month,
    daysInMonth: daysInMonth(month),
    daysElapsed,
    incomeBase,
    totalSpent,
    totalSpentPrev,
    committedPending: commitments.committedExpense,
    committedNextMonth: projection[0]?.committed ?? 0,
    categories: catSnapshots,
    budgets: budgets.map((b) => ({
      categoryName: b.categories?.name ?? "Categoría",
      limit: Number(b.monthly_limit),
      spent: b.spent,
      pct: b.pct,
    })),
    plansEnding,
    cardCuts,
    maxSingleExpense,
  };
}
