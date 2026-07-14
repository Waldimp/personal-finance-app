import { createClient } from "@/lib/supabase/server";
import type { Category, PaymentMethod, RecurringTransaction } from "@/lib/types";
import { RecurringManager } from "./recurring-manager";

export default async function RecurrentesPage() {
  const supabase = await createClient();
  const [{ data: recurrings }, { data: categories }, { data: methods }] =
    await Promise.all([
      supabase.from("recurring_transactions").select("*").order("day_of_month"),
      supabase
        .from("categories")
        .select("*")
        .eq("is_archived", false)
        .order("name"),
      supabase
        .from("payment_methods")
        .select("*")
        .eq("is_archived", false)
        .order("created_at"),
    ]);

  return (
    <RecurringManager
      recurrings={(recurrings ?? []) as RecurringTransaction[]}
      categories={(categories ?? []) as Category[]}
      methods={(methods ?? []) as PaymentMethod[]}
    />
  );
}
