"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  display_name: z.string().trim().min(1).max(60),
  monthly_income_estimate: z.coerce.number().min(0).max(1_000_000),
  pay_frequency: z.enum(["monthly", "biweekly"]),
  pay_day_1: z.coerce.number().int().min(1).max(31).nullable(),
  pay_day_2: z.coerce.number().int().min(1).max(31).nullable(),
});

export async function updateProfile(input: unknown) {
  const data = profileSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function completeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
