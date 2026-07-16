import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, monthRange } from "@/lib/dates";

const ANT_THRESHOLD = 15; // gasto hormiga: < $15

export type WrappedData = {
  month: string; // mes del resumen (YYYY-MM)
  income: number;
  expense: number;
  balance: number;
  txCount: number;
  /** Gasto del mes anterior al del resumen, para comparar. */
  prevExpense: number;
  /** % de cambio del gasto vs el mes anterior (null si no hay base). */
  deltaPct: number | null;
  topCategories: { name: string; color: string; icon: string; total: number }[];
  biggest: { amount: number; description: string; category: string } | null;
  antCount: number;
  antTotal: number;
  budgetsKept: number;
  budgetsTotal: number;
  topMethod: { name: string; total: number } | null;
};

type TxRow = {
  type: "income" | "expense";
  amount: number;
  tx_date: string;
  description: string;
  category_id: string | null;
  categories: { name: string; color: string; icon: string } | null;
  payment_methods: { name: string } | null;
};

export async function getWrappedData(
  supabase: SupabaseClient,
  month: string
): Promise<WrappedData> {
  const prevMonth = addMonths(month, -1);
  const { start } = monthRange(prevMonth);
  const { end } = monthRange(month);

  const [{ data: txs }, { data: budgets }] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "type, amount, tx_date, description, category_id, categories(name, color, icon), payment_methods(name)"
      )
      .gte("tx_date", start)
      .lte("tx_date", end),
    supabase.from("budgets").select("category_id, monthly_limit"),
  ]);

  const rows = (txs ?? []) as unknown as TxRow[];

  let income = 0;
  let expense = 0;
  let prevExpense = 0;
  let txCount = 0;
  let antCount = 0;
  let antTotal = 0;
  let biggest: WrappedData["biggest"] = null;
  const catTotals = new Map<string, { name: string; color: string; icon: string; total: number }>();
  const spentByCategoryId = new Map<string, number>();
  const methodTotals = new Map<string, number>();

  for (const tx of rows) {
    const m = tx.tx_date.slice(0, 7);
    const amount = Number(tx.amount);

    if (m === prevMonth) {
      if (tx.type === "expense") prevExpense += amount;
      continue;
    }
    if (m !== month) continue;

    txCount++;
    if (tx.type === "income") {
      income += amount;
      continue;
    }
    expense += amount;

    if (amount < ANT_THRESHOLD) {
      antCount++;
      antTotal += amount;
    }
    if (!biggest || amount > biggest.amount) {
      biggest = {
        amount,
        description: tx.description,
        category: tx.categories?.name ?? "Sin categorizar",
      };
    }

    const catKey = tx.categories?.name ?? "Sin categorizar";
    const cat = catTotals.get(catKey) ?? {
      name: catKey,
      color: tx.categories?.color ?? "#94a3b8",
      icon: tx.categories?.icon ?? "circle",
      total: 0,
    };
    cat.total += amount;
    catTotals.set(catKey, cat);

    if (tx.category_id) {
      spentByCategoryId.set(
        tx.category_id,
        (spentByCategoryId.get(tx.category_id) ?? 0) + amount
      );
    }
    if (tx.payment_methods?.name) {
      methodTotals.set(
        tx.payment_methods.name,
        (methodTotals.get(tx.payment_methods.name) ?? 0) + amount
      );
    }
  }

  let budgetsKept = 0;
  const budgetsTotal = (budgets ?? []).length;
  for (const b of budgets ?? []) {
    const spent = spentByCategoryId.get(b.category_id) ?? 0;
    if (spent <= Number(b.monthly_limit)) budgetsKept++;
  }

  const topMethodEntry = [...methodTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    month,
    income,
    expense,
    balance: income - expense,
    txCount,
    prevExpense,
    deltaPct:
      prevExpense > 0
        ? Math.round(((expense - prevExpense) / prevExpense) * 100)
        : null,
    topCategories: [...catTotals.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 3),
    biggest,
    antCount,
    antTotal,
    budgetsKept,
    budgetsTotal,
    topMethod: topMethodEntry
      ? { name: topMethodEntry[0], total: topMethodEntry[1] }
      : null,
  };
}
