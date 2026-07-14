"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, todayLocal } from "@/lib/dates";

const recurringSchema = z.object({
  type: z.enum(["income", "expense"]),
  description: z.string().trim().min(1).max(80),
  amount: z.coerce.number().positive().max(1_000_000),
  day_of_month: z.coerce.number().int().min(1).max(28),
  category_id: z.string().uuid().nullable(),
  payment_method_id: z.string().uuid().nullable(),
});

export async function createRecurring(input: unknown) {
  const data = recurringSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("recurring_transactions")
    .insert({ ...data, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function updateRecurring(id: string, input: unknown) {
  const data = recurringSchema.partial().parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_transactions")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function toggleRecurring(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_transactions")
    .update({ is_active: active })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function deleteRecurring(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

/**
 * Confirma el movimiento recurrente de este mes (1 tap).
 * `amountOverride` permite registrar el monto real recibido (ej. salario
 * líquido tras descuentos de ley) sin cambiar la plantilla recurrente.
 */
export async function confirmRecurring(id: string, amountOverride?: number) {
  const override =
    amountOverride !== undefined
      ? z.coerce.number().positive().max(1_000_000).parse(amountOverride)
      : undefined;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: rec } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("id", id)
    .single();
  if (!rec) throw new Error("Recurrente no encontrado");

  const month = currentMonth();
  if (rec.last_generated_month === month) {
    throw new Error("Este movimiento ya se registró este mes.");
  }

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    type: rec.type,
    amount: override ?? rec.amount,
    tx_date: todayLocal(),
    description: rec.description,
    category_id: rec.category_id,
    payment_method_id: rec.payment_method_id,
    source: "recurring",
  });
  if (txError) throw new Error(txError.message);

  const { error } = await supabase
    .from("recurring_transactions")
    .update({ last_generated_month: month })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
