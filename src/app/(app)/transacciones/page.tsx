import { createClient } from "@/lib/supabase/server";
import { currentMonth, monthRange } from "@/lib/dates";
import type { Category, PaymentMethod, TransactionWithRefs } from "@/lib/types";
import { TransactionsList } from "./transactions-list";

export default async function TransaccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; categoria?: string; tarjeta?: string }>;
}) {
  const params = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(params.mes ?? "")
    ? params.mes!
    : currentMonth();
  const { start, end } = monthRange(month);

  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select(
      "*, categories(name, icon, color, type), payment_methods(name, color, type)"
    )
    .gte("tx_date", start)
    .lte("tx_date", end)
    .order("tx_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.categoria) query = query.eq("category_id", params.categoria);
  if (params.tarjeta) query = query.eq("payment_method_id", params.tarjeta);

  const [{ data: transactions }, { data: categories }, { data: methods }] =
    await Promise.all([
      query,
      supabase.from("categories").select("*").order("name"),
      supabase.from("payment_methods").select("*").order("created_at"),
    ]);

  return (
    <TransactionsList
      transactions={(transactions ?? []) as TransactionWithRefs[]}
      categories={(categories ?? []) as Category[]}
      methods={(methods ?? []) as PaymentMethod[]}
      month={month}
      categoryFilter={params.categoria ?? ""}
      methodFilter={params.tarjeta ?? ""}
    />
  );
}
