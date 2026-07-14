"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/** Crea un token y devuelve el valor en claro UNA sola vez. */
export async function createApiToken(name: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const token = `mf_${randomBytes(24).toString("hex")}`;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { error } = await supabase.from("api_tokens").insert({
    user_id: user.id,
    name: name.trim() || "iPhone Shortcut",
    token_hash: tokenHash,
    token_prefix: token.slice(0, 8),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/ajustes/token");
  return token;
}

export async function revokeApiToken(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("api_tokens").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/ajustes/token");
}

const ruleSchema = z.object({
  keyword: z.string().trim().min(2).max(40),
  category_id: z.string().uuid(),
});

export async function createMerchantRule(input: unknown) {
  const data = ruleSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("merchant_rules").insert({
    user_id: user.id,
    keyword: data.keyword.toLowerCase(),
    category_id: data.category_id,
  });
  if (error) {
    if (error.code === "23505") throw new Error("Ya existe una regla con esa palabra.");
    throw new Error(error.message);
  }
  revalidatePath("/", "layout");
}

export async function deleteMerchantRule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("merchant_rules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

/** Categoriza una transacción del inbox y opcionalmente crea la regla. */
export async function categorizeTransaction(
  txId: string,
  categoryId: string,
  ruleKeyword?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("transactions")
    .update({ category_id: categoryId })
    .eq("id", txId);
  if (error) throw new Error(error.message);

  if (ruleKeyword && ruleKeyword.trim().length >= 2) {
    await supabase.from("merchant_rules").upsert(
      {
        user_id: user.id,
        keyword: ruleKeyword.trim().toLowerCase(),
        category_id: categoryId,
      },
      { onConflict: "user_id,keyword" }
    );
  }
  revalidatePath("/", "layout");
}
