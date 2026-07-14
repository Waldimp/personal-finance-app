"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const cardPaymentSchema = z.object({
  payment_method_id: z.string().uuid(),
  amount: z.coerce.number().positive().max(1_000_000),
  paid_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(120).default(""),
});

export async function registerCardPayment(input: unknown) {
  const data = cardPaymentSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("card_payments")
    .insert({ ...data, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function deleteCardPayment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("card_payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
