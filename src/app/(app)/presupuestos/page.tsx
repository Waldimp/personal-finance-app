import { createClient } from "@/lib/supabase/server";
import { currentMonth } from "@/lib/dates";
import { getBudgetsWithSpent } from "@/lib/queries/budgets";
import type { Category } from "@/lib/types";
import { BudgetsManager } from "./budgets-manager";

export default async function PresupuestosPage() {
  const supabase = await createClient();
  const [budgets, { data: categories }] = await Promise.all([
    getBudgetsWithSpent(supabase, currentMonth()),
    supabase
      .from("categories")
      .select("*")
      .eq("type", "expense")
      .eq("is_archived", false)
      .order("name"),
  ]);

  return (
    <BudgetsManager
      budgets={budgets}
      categories={(categories ?? []) as Category[]}
    />
  );
}
