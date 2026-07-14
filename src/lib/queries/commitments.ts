import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths } from "@/lib/dates";
import type { Debt, InstallmentPayment, RecurringTransaction } from "@/lib/types";

export type PendingInstallment = InstallmentPayment & {
  installment_plans: {
    description: string;
    months: number;
    payment_method_id: string | null;
  } | null;
};

export type MonthCommitments = {
  pendingDebts: Debt[];
  pendingInstallments: PendingInstallment[];
  pendingRecurringExpense: RecurringTransaction[];
  pendingRecurringIncome: RecurringTransaction[];
  /** Gasto comprometido aún no pagado este mes. */
  committedExpense: number;
  /** Ingresos recurrentes aún no registrados este mes. */
  pendingIncome: number;
};

export async function getMonthCommitments(
  supabase: SupabaseClient,
  month: string
): Promise<MonthCommitments> {
  const [{ data: debts }, { data: installments }, { data: recurrings }] =
    await Promise.all([
      supabase.from("debts").select("*").eq("is_paid_off", false),
      supabase
        .from("installment_payments")
        .select("*, installment_plans(description, months, payment_method_id)")
        .eq("due_month", month)
        .eq("status", "pending"),
      supabase.from("recurring_transactions").select("*").eq("is_active", true),
    ]);

  const pendingDebts = ((debts ?? []) as Debt[]).filter(
    (d) => d.last_paid_month !== month
  );
  const pendingInstallments = (installments ?? []) as PendingInstallment[];
  const pendingRecurring = ((recurrings ?? []) as RecurringTransaction[]).filter(
    (r) => r.last_generated_month !== month
  );
  const pendingRecurringExpense = pendingRecurring.filter(
    (r) => r.type === "expense"
  );
  const pendingRecurringIncome = pendingRecurring.filter(
    (r) => r.type === "income"
  );

  const committedExpense =
    pendingDebts.reduce(
      (s, d) => s + Math.min(Number(d.monthly_payment), Number(d.remaining_balance)),
      0
    ) +
    pendingInstallments.reduce((s, p) => s + Number(p.amount), 0) +
    pendingRecurringExpense.reduce((s, r) => s + Number(r.amount), 0);

  const pendingIncome = pendingRecurringIncome.reduce(
    (s, r) => s + Number(r.amount),
    0
  );

  return {
    pendingDebts,
    pendingInstallments,
    pendingRecurringExpense,
    pendingRecurringIncome,
    committedExpense,
    pendingIncome,
  };
}

export type ProjectionPoint = { month: string; committed: number };

/** Compromisos de los próximos N meses (cuotas + deudas + recurrentes de gasto). */
export async function getCommitmentProjection(
  supabase: SupabaseClient,
  fromMonth: string,
  months = 6
): Promise<ProjectionPoint[]> {
  const lastMonth = addMonths(fromMonth, months - 1);

  const [{ data: installments }, { data: debts }, { data: recurrings }] =
    await Promise.all([
      supabase
        .from("installment_payments")
        .select("due_month, amount")
        .eq("status", "pending")
        .gte("due_month", fromMonth)
        .lte("due_month", lastMonth),
      supabase.from("debts").select("*").eq("is_paid_off", false),
      supabase
        .from("recurring_transactions")
        .select("amount, type")
        .eq("is_active", true)
        .eq("type", "expense"),
    ]);

  const recurringMonthly = (recurrings ?? []).reduce(
    (s, r) => s + Number(r.amount),
    0
  );

  return Array.from({ length: months }, (_, i) => {
    const m = addMonths(fromMonth, i);
    const cuotas = (installments ?? [])
      .filter((p) => p.due_month === m)
      .reduce((s, p) => s + Number(p.amount), 0);
    // La deuda aporta su cuota mientras el saldo alcance para i+1 pagos más.
    const deudas = ((debts ?? []) as Debt[]).reduce((s, d) => {
      const paymentsLeft = Math.ceil(
        Number(d.remaining_balance) / Number(d.monthly_payment)
      );
      return i < paymentsLeft
        ? s + Math.min(Number(d.monthly_payment), Number(d.remaining_balance))
        : s;
    }, 0);
    return { month: m, committed: cuotas + deudas + recurringMonthly };
  });
}
