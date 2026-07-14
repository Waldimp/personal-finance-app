"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const categorySchema = z.object({
  name: z.string().trim().min(1).max(40),
  type: z.enum(["income", "expense"]),
  icon: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  needs_bucket: z.enum(["need", "want", "saving"]).nullable(),
});

export async function createCategory(input: unknown) {
  const data = categorySchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("categories")
    .insert({ ...data, user_id: user.id });
  if (error) {
    if (error.code === "23505") throw new Error("Ya existe una categoría con ese nombre.");
    throw new Error(error.message);
  }
  revalidatePath("/", "layout");
}

export async function updateCategory(id: string, input: unknown) {
  const data = categorySchema.partial().parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function archiveCategory(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_archived: archived })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
