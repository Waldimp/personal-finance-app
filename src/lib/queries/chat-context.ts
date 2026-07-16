import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, currentMonth, monthRange, todayLocal } from "@/lib/dates";
import { getMonthCommitments } from "@/lib/queries/commitments";
import { getBudgetsWithSpent } from "@/lib/queries/budgets";

/**
 * Arma el contexto financiero del usuario como texto compacto para el LLM.
 * Solo agregados y transacciones recientes — sin correos, IDs ni tokens.
 */
export async function buildChatContext(
  supabase: SupabaseClient
): Promise<string> {
  const month = currentMonth();
  const start3 = monthRange(addMonths(month, -3)).start;
  const { end } = monthRange(month);

  const [
    { data: profile },
    { data: txs },
    budgets,
    commitments,
    { data: debts },
    { data: plans },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("monthly_income_estimate, pay_frequency, pay_day_1, pay_day_2")
      .single(),
    supabase
      .from("transactions")
      .select(
        "type, amount, tx_date, description, categories(name), payment_methods(name)"
      )
      .gte("tx_date", start3)
      .lte("tx_date", end)
      .order("tx_date", { ascending: false }),
    getBudgetsWithSpent(supabase, month),
    getMonthCommitments(supabase, month),
    supabase.from("debts").select("*").eq("is_paid_off", false),
    supabase
      .from("installment_plans")
      .select("description, monthly_amount, months, installment_payments(status)"),
  ]);

  type TxRow = {
    type: string;
    amount: number;
    tx_date: string;
    description: string;
    categories: { name: string } | null;
    payment_methods: { name: string } | null;
  };
  const rows = (txs ?? []) as unknown as TxRow[];

  // Totales por mes y categoría (últimos 4 meses).
  const byMonth = new Map<string, { income: number; expense: number; cats: Map<string, number> }>();
  for (const tx of rows) {
    const m = tx.tx_date.slice(0, 7);
    const entry =
      byMonth.get(m) ?? { income: 0, expense: 0, cats: new Map<string, number>() };
    const amount = Number(tx.amount);
    if (tx.type === "income") entry.income += amount;
    else {
      entry.expense += amount;
      const cat = tx.categories?.name ?? "Sin categorizar";
      entry.cats.set(cat, (entry.cats.get(cat) ?? 0) + amount);
    }
    byMonth.set(m, entry);
  }

  const monthLines = [...byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([m, e]) => {
      const cats = [...e.cats.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, total]) => `${name}: $${total.toFixed(2)}`)
        .join(", ");
      return `- ${m}: ingresos $${e.income.toFixed(2)}, gastos $${e.expense.toFixed(2)}${cats ? ` (${cats})` : ""}`;
    })
    .join("\n");

  const budgetLines = budgets
    .map(
      (b) =>
        `- ${b.categories?.name}: gastado $${b.spent.toFixed(2)} de $${Number(b.monthly_limit).toFixed(2)} (${Math.round(b.pct)}%)`
    )
    .join("\n");

  const debtLines = ((debts ?? []) as {
    name: string;
    remaining_balance: number;
    original_amount: number;
    monthly_payment: number;
    payment_day: number;
  }[])
    .map(
      (d) =>
        `- ${d.name}: restan $${Number(d.remaining_balance).toFixed(2)} de $${Number(d.original_amount).toFixed(2)}, cuota $${Number(d.monthly_payment).toFixed(2)} el día ${d.payment_day}`
    )
    .join("\n");

  const planLines = ((plans ?? []) as {
    description: string;
    monthly_amount: number;
    months: number;
    installment_payments: { status: string }[];
  }[])
    .filter((p) => p.installment_payments.some((x) => x.status === "pending"))
    .map((p) => {
      const paid = p.installment_payments.filter((x) => x.status === "paid").length;
      return `- ${p.description}: ${paid} de ${p.months} cuotas pagadas, $${Number(p.monthly_amount).toFixed(2)}/mes`;
    })
    .join("\n");

  const recentLines = rows
    .slice(0, 30)
    .map(
      (tx) =>
        `- ${tx.tx_date} | ${tx.type === "income" ? "+" : "-"}$${Number(tx.amount).toFixed(2)} | ${tx.categories?.name ?? "Sin categorizar"}${tx.description ? ` | ${tx.description}` : ""}${tx.payment_methods ? ` | ${tx.payment_methods.name}` : ""}`
    )
    .join("\n");

  return `DATOS FINANCIEROS DEL USUARIO (moneda USD, hoy es ${todayLocal()}):

Perfil: ingreso estimado $${Number(profile?.monthly_income_estimate ?? 0).toFixed(2)}/mes, pago ${profile?.pay_frequency === "biweekly" ? `quincenal (días ${profile?.pay_day_1} y ${profile?.pay_day_2})` : `mensual (día ${profile?.pay_day_1 ?? "?"})`}.

Resumen por mes (últimos 4):
${monthLines || "(sin movimientos)"}

Presupuestos del mes actual:
${budgetLines || "(sin presupuestos)"}

Este mes: comprometido pendiente $${commitments.committedExpense.toFixed(2)}, ingresos recurrentes por recibir $${commitments.pendingIncome.toFixed(2)}.

Deudas activas:
${debtLines || "(ninguna)"}

Cuotas tasa cero activas:
${planLines || "(ninguna)"}

Últimos 30 movimientos:
${recentLines || "(ninguno)"}`;
}
