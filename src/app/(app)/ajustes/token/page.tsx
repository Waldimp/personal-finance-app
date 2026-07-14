import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { TokenManager } from "./token-manager";

export type ApiTokenRow = {
  id: string;
  name: string;
  token_prefix: string;
  last_used_at: string | null;
  created_at: string;
};

export type MerchantRuleRow = {
  id: string;
  keyword: string;
  category_id: string;
  categories: { name: string; color: string } | null;
};

export type ShortcutLogRow = {
  id: string;
  status: "ok" | "duplicate" | "inbox" | "auth_error" | "bad_request" | "error";
  merchant: string;
  amount: number | null;
  card: string;
  matched_category: string | null;
  matched_method: string | null;
  error: string | null;
  created_at: string;
};

export default async function TokenPage() {
  const supabase = await createClient();
  const [{ data: tokens }, { data: rules }, { data: categories }, { data: logs }] =
    await Promise.all([
      supabase
        .from("api_tokens")
        .select("id, name, token_prefix, last_used_at, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("merchant_rules")
        .select("id, keyword, category_id, categories(name, color)")
        .order("keyword"),
      supabase
        .from("categories")
        .select("*")
        .eq("type", "expense")
        .eq("is_archived", false)
        .order("name"),
      supabase
        .from("shortcut_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return (
    <TokenManager
      tokens={(tokens ?? []) as ApiTokenRow[]}
      rules={(rules ?? []) as unknown as MerchantRuleRow[]}
      categories={(categories ?? []) as Category[]}
      logs={(logs ?? []) as ShortcutLogRow[]}
    />
  );
}
