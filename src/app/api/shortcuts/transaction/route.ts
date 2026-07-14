import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayLocal } from "@/lib/dates";

/** Quita acentos y pasa a minúsculas para comparar. */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Parsea montos como "12.50", "12,50", "$12.50 USD". */
function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number") return raw > 0 ? raw : null;
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/[^0-9.,-]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * POST /api/shortcuts/transaction
 * Body: { "amount": 12.50, "merchant": "TEXACO", "card": "Visa BAC" }
 * Auth: Authorization: Bearer mf_xxx (token de Ajustes → Apple Pay automático)
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ error: "missing token" }, { status: 401 });
  }

  const admin = createAdminClient();
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { data: apiToken } = await admin
    .from("api_tokens")
    .select("id, user_id")
    .eq("token_hash", tokenHash)
    .single();
  if (!apiToken) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const amount = parseAmount(body.amount);
  if (!amount) {
    return NextResponse.json({ error: "invalid amount" }, { status: 400 });
  }
  const merchant = typeof body.merchant === "string" ? body.merchant.trim() : "";
  const cardName = typeof body.card === "string" ? body.card.trim() : "";
  const userId = apiToken.user_id as string;

  await admin
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiToken.id);

  // Idempotencia: Atajos a veces dispara doble.
  const twoMinAgo = new Date(Date.now() - 2 * 60_000).toISOString();
  const { data: dup } = await admin
    .from("transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("source", "shortcut")
    .eq("amount", amount)
    .eq("description", merchant)
    .gte("created_at", twoMinAgo)
    .limit(1);
  if (dup && dup.length > 0) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Tarjeta: match por nombre; fallback a la tarjeta con Apple Pay.
  const { data: methods } = await admin
    .from("payment_methods")
    .select("id, name, has_wallet, type")
    .eq("user_id", userId)
    .eq("is_archived", false);

  let paymentMethodId: string | null = null;
  if (cardName && methods) {
    const target = normalize(cardName);
    const match = methods.find(
      (m) =>
        normalize(m.name).includes(target) || target.includes(normalize(m.name))
    );
    paymentMethodId = match?.id ?? null;
  }
  if (!paymentMethodId && methods) {
    paymentMethodId =
      methods.find((m) => m.has_wallet)?.id ??
      methods.find((m) => m.type === "credit")?.id ??
      null;
  }

  // Categoría: primera regla cuyo keyword aparezca en el comercio.
  let categoryId: string | null = null;
  let categoryName: string | null = null;
  if (merchant) {
    const { data: rules } = await admin
      .from("merchant_rules")
      .select("keyword, category_id, categories(name)")
      .eq("user_id", userId);
    const normMerchant = normalize(merchant);
    const rule = (rules ?? []).find((r) =>
      normMerchant.includes(normalize(r.keyword))
    );
    if (rule) {
      categoryId = rule.category_id;
      categoryName =
        (rule.categories as unknown as { name: string } | null)?.name ?? null;
    }
  }

  const { error } = await admin.from("transactions").insert({
    user_id: userId,
    type: "expense",
    amount,
    tx_date: todayLocal(),
    description: merchant,
    category_id: categoryId,
    payment_method_id: paymentMethodId,
    source: "shortcut",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, category: categoryName, inbox: !categoryId },
    { status: 201 }
  );
}
