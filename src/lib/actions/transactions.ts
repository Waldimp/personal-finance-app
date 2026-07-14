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

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
