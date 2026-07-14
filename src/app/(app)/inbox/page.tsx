import { createClient } from "@/lib/supabase/server";
import type { Category, TransactionWithRefs } from "@/lib/types";
import { InboxList } from "./inbox-list";

export default async function InboxPage() {
  const supabase = await createClient();
  const [{ data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, categories(name, icon, color, type), payment_methods(name, color, type)")
      .is("category_id", null)
      .order("tx_date", { ascending: false })
      .limit(50),
    supabase
      .from("categories")
      .select("*")
      .eq("type", "expense")
      .eq("is_archived", false)
      .order("name"),
  ]);

  return (
    <InboxList
      transactions={(transactions ?? []) as TransactionWithRefs[]}
      categories={(categories ?? []) as Category[]}
    />
  );
}
