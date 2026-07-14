import type { SupabaseClient } from "@supabase/supabase-js";
import { monthRange } from "@/lib/dates";
import type { Budget, Category } from "@/lib/types";

export type BudgetWithSpent = Budget & {
  categories: Pick<Category, "name" | "icon" | "color"> | null;
  spent: number;
  pct: number;
};

export async function getBudgetsWithSpent(
  supabase: SupabaseClient,
  month: string
): Promise<BudgetWithSpent[]> {
  const { start, end } = monthRange(month);
  const [{ data: budgets }, { data: txs }] = await Promise.all([
    supabase.from("budgets").select("*, categories(name, icon, color)"),
    supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("type", "expense")
      .gte("tx_date", start)
      .lte("tx_date", end),
  ]);

  const spentByCategory = new Map<string, number>();
  for (const tx of txs ?? []) {
    if (!tx.category_id) continue;
    spentByCategory.set(
      tx.category_id,
      (spentByCategory.get(tx.category_id) ?? 0) + Number(tx.amount)
    );
  }

  return ((budgets ?? []) as (Budget & {
    categories: Pick<Category, "name" | "icon" | "color"> | null;
  })[])
    .map((b) => {
      const spent = spentByCategory.get(b.category_id) ?? 0;
      return {
        ...b,
        spent,
        pct: Number(b.monthly_limit) > 0 ? (spent / Number(b.monthly_limit)) * 100 : 0,
      };
    })
    .sort((a, b) => b.pct - a.pct);
}
