"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const paymentMethodSchema = z.object({
  name: z.string().trim().min(1).max(40),
  type: z.enum(["credit", "debit", "cash"]),
  last4: z
    .string()
    .regex(/^\d{4}$/)
    .nullable()
    .or(z.literal("").transform(() => null)),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  has_wallet: z.boolean(),
  cut_day: z.coerce.number().int().min(1).max(28).nullable(),
  payment_due_day: z.coerce.number().int().min(1).max(31).nullable(),
  credit_limit: z.coerce.number().positive().nullable(),
});

export async function createPaymentMethod(input: unknown) {
  const data = paymentMethodSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("payment_methods")
    .insert({ ...data, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function updatePaymentMethod(id: string, input: unknown) {
  const data = paymentMethodSchema.partial().parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_methods")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function archivePaymentMethod(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_methods")
    .update({ is_archived: archived })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function deletePaymentMethod(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
