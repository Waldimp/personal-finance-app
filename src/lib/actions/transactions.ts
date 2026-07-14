"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive().max(1_000_000),
  tx_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().trim().max(120).default(""),
  category_id: z.string().uuid().nullable(),
  payment_method_id: z.string().uuid().nullable(),
});

export async function createTransaction(input: unknown) {
  const data = transactionSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("transactions")
    .insert({ ...data, user_id: user.id, source: "manual" });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function updateTransaction(id: string, input: unknown) {
  const data = transactionSchema.partial().parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

/** Registra lo que el usuario tiene HOY como ingreso "Saldo inicial". */
export async function registerInitialBalance(amount: number) {
  const parsed = z.coerce.number().positive().max(1_000_000).parse(amount);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", "Otros ingresos")
    .eq("type", "income")
    .maybeSingle();

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type: "income",
    amount: parsed,
    description: "Saldo inicial",
    category_id: category?.id ?? null,
    payment_method_id: null,
    source: "manual",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
