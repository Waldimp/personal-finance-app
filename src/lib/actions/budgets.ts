"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const budgetSchema = z.object({
  category_id: z.string().uuid(),
  monthly_limit: z.coerce.number().positive().max(1_000_000),
});

export async function upsertBudget(input: unknown) {
  const data = budgetSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("budgets")
    .upsert(
      { ...data, user_id: user.id },
      { onConflict: "user_id,category_id" }
    );
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
