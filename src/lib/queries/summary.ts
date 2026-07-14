import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, monthRange } from "@/lib/dates";

export type CategoryTotal = {
  id: string | null;
  name: string;
  icon: string;
  color: string;
  total: number;
};

export type MethodTotal = {
  id: string | null;
  name: string;
  color: string;
  total: number;
};

export type MonthSummary = {
  income: number;
  expense: number;
  byCategory: CategoryTotal[];
  byMethod: MethodTotal[];
};

type TxRow = {
  type: "income" | "expense";
  amount: number;
  category_id: string | null;
  payment_method_id: string | null;
  categories: { name: string; icon: string; color: string } | null;
  payment_methods: { name: string; color: string } | null;
};

export async function getMonthSummary(
  supabase: SupabaseClient,
  month: string
): Promise<MonthSummary> {
  const { start, end } = monthRange(month);
  const { data } = await supabase
    .from("transactions")
    .select(
      "type, amount, category_id, payment_method_id, categories(name, icon, color), payment_methods(name, color)"
    )
    .gte("tx_date", start)
    .lte("tx_date", end);

  const rows = (data ?? []) as unknown as TxRow[];

  let income = 0;
  let expense = 0;
  const catMap = new Map<string, CategoryTotal>();
  const methodMap = new Map<string, MethodTotal>();

  for (const row of rows) {
    const amount = Number(row.amount);
    if (row.type === "income") {
      income += amount;
      continue;
    }
    expense += amount;

    const catKey = row.category_id ?? "none";
    const cat = catMap.get(catKey) ?? {
      id: row.category_id,
      name: row.categories?.name ?? "Sin categorizar",
      icon: row.categories?.icon ?? "circle",
      color: row.categories?.color ?? "#94a3b8",
      total: 0,
    };
    cat.total += amount;
    catMap.set(catKey, cat);

    const methodKey = row.payment_method_id ?? "none";
    const method = methodMap.get(methodKey) ?? {
      id: row.payment_method_id,
      name: row.payment_methods?.name ?? "Sin método",
      color: row.payment_methods?.color ?? "#94a3b8",
      total: 0,
    };
    method.total += amount;
    methodMap.set(methodKey, method);
  }

  return {
    income,
    expense,
    byCategory: [...catMap.values()].sort((a, b) => b.total - a.total),
    byMethod: [...methodMap.values()].sort((a, b) => b.total - a.total),
  };
}

export type MonthPoint = { month: string; income: number; expense: number };

/** Serie de ingresos/gastos de los últimos N meses (incluye el mes dado). */
export async function getMonthlySeries(
  supabase: SupabaseClient,
  endMonth: string,
  months = 6
): Promise<MonthPoint[]> {
  const startMonth = addMonths(endMonth, -(months - 1));
  const { start } = monthRange(startMonth);
  const { end } = monthRange(endMonth);

  const { data } = await supabase
    .from("transactions")
    .select("type, amount, tx_date")
    .gte("tx_date", start)
    .lte("tx_date", end);

  const points = new Map<string, MonthPoint>();
  for (let i = 0; i < months; i++) {
    const m = addMonths(startMonth, i);
    points.set(m, { month: m, income: 0, expense: 0 });
  }

  for (const row of data ?? []) {
    const m = (row.tx_date as string).slice(0, 7);
    const point = points.get(m);
    if (!point) continue;
    if (row.type === "income") point.income += Number(row.amount);
    else point.expense += Number(row.amount);
  }

  return [...points.values()];
}
