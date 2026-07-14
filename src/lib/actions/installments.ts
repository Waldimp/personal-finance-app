"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { addMonths, todayLocal } from "@/lib/dates";
import { round2 } from "@/lib/money";

const planSchema = z.object({
  description: z.string().trim().min(1).max(80),
  total_amount: z.coerce.number().positive().max(1_000_000),
  months: z.coerce.number().int().min(1).max(72),
  first_month: z.string().regex(/^\d{4}-\d{2}$/),
  /** Cuotas ya pagadas antes de usar la app (modo "ya la vengo pagando"). */
  paid_installments: z.coerce.number().int().min(0).default(0),
  payment_method_id: z.string().uuid().nullable(),
  category_id: z.string().uuid().nullable(),
});

export async function createInstallmentPlan(input: unknown) {
  const data = planSchema.parse(input);
  if (data.paid_installments >= data.months) {
    throw new Error("Las cuotas pagadas deben ser menos que el total de cuotas.");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // Cuota mensual: la última absorbe el residuo de redondeo.
  const monthly = round2(Math.floor((data.total_amount / data.months) * 100) / 100);
  const lastAmount = round2(data.total_amount - monthly * (data.months - 1));

  const { data: plan, error } = await supabase
    .from("installment_plans")
    .insert({
      user_id: user.id,
      description: data.description,
      total_amount: data.total_amount,
      months: data.months,
      monthly_amount: monthly,
      first_month: data.first_month,
      payment_method_id: data.payment_method_id,
      category_id: data.category_id,
    })
    .select("id")
    .single();
  if (error || !plan) throw new Error(error?.message ?? "Error creando plan");

  const payments = Array.from({ length: data.months }, (_, i) => ({
    user_id: user.id,
    plan_id: plan.id,
    due_month: addMonths(data.first_month, i),
    number: i + 1,
    amount: i === data.months - 1 ? lastAmount : monthly,
    // Pagos históricos (previos a la app): paid sin transacción vinculada.
    status: i < data.paid_installments ? "paid" : "pending",
  }));

  const { error: payError } = await supabase
    .from("installment_payments")
    .insert(payments);
  if (payError) {
    await supabase.from("installment_plans").delete().eq("id", plan.id);
    throw new Error(payError.message);
  }
  revalidatePath("/", "layout");
}

/** Confirma el pago de una cuota: crea la transacción y marca paid. */
export async function payInstallment(paymentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: payment } = await supabase
    .from("installment_payments")
    .select("*, installment_plans(description, payment_method_id, category_id)")
    .eq("id", paymentId)
    .single();
  if (!payment) throw new Error("Cuota no encontrada");
  if (payment.status === "paid") throw new Error("Esta cuota ya está pagada.");

  const plan = payment.installment_plans as unknown as {
    description: string;
    payment_method_id: string | null;
    category_id: string | null;
  };

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "expense",
      amount: payment.amount,
      tx_date: todayLocal(),
      description: `${plan.description} (cuota ${payment.number})`,
      category_id: plan.category_id,
      payment_method_id: plan.payment_method_id,
      source: "installment",
      installment_payment_id: payment.id,
    })
    .select("id")
    .single();
  if (txError || !tx) throw new Error(txError?.message ?? "Error creando transacción");

  const { error } = await supabase
    .from("installment_payments")
    .update({ status: "paid", transaction_id: tx.id })
    .eq("id", paymentId);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function deleteInstallmentPlan(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("installment_plans")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
