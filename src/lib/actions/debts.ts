"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, todayLocal } from "@/lib/dates";
import { round2 } from "@/lib/money";

const debtSchema = z.object({
  name: z.string().trim().min(1).max(60),
  original_amount: z.coerce.number().positive().max(10_000_000),
  remaining_balance: z.coerce.number().min(0).max(10_000_000),
  monthly_payment: z.coerce.number().positive().max(1_000_000),
  payment_day: z.coerce.number().int().min(1).max(28),
  category_id: z.string().uuid().nullable(),
  payment_method_id: z.string().uuid().nullable(),
});

export async function createDebt(input: unknown) {
  const data = debtSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("debts")
    .insert({ ...data, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function updateDebt(id: string, input: unknown) {
  const data = debtSchema.partial().parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("debts").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function deleteDebt(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("debts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

/** Confirma el pago del mes: crea transacción y decrementa el saldo. */
export async function payDebtMonth(debtId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: debt } = await supabase
    .from("debts")
    .select("*")
    .eq("id", debtId)
    .single();
  if (!debt) throw new Error("Deuda no encontrada");
  if (debt.is_paid_off) throw new Error("Esta deuda ya está saldada.");

  const month = currentMonth();
  if (debt.last_paid_month === month) {
    throw new Error("El pago de este mes ya está registrado.");
  }

  const amount = Math.min(Number(debt.monthly_payment), Number(debt.remaining_balance));

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    type: "expense",
    amount,
    tx_date: todayLocal(),
    description: debt.name,
    category_id: debt.category_id,
    payment_method_id: debt.payment_method_id,
    source: "debt",
  });
  if (txError) throw new Error(txError.message);

  const newBalance = round2(Number(debt.remaining_balance) - amount);
  const { error } = await supabase
    .from("debts")
    .update({
      remaining_balance: newBalance,
      last_paid_month: month,
      is_paid_off: newBalance <= 0,
    })
    .eq("id", debtId);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
