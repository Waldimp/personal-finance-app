import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push-server";
import { monthRange, currentMonth } from "@/lib/dates";

export const maxDuration = 60;

/**
 * Cron diario (Vercel):
 * 1. Ping a Supabase para que el proyecto free no se pause.
 * 2. Evalúa presupuestos ≥90% y envía push a los usuarios suscritos.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 1. Keepalive con anon (no necesita service role).
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  await anon.from("profiles").select("id").limit(1);

  // 2. Alertas de presupuesto (requiere service role).
  let notified = 0;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { start, end } = monthRange(currentMonth());

    const [{ data: budgets }, { data: txs }] = await Promise.all([
      admin
        .from("budgets")
        .select("user_id, category_id, monthly_limit, categories(name)"),
      admin
        .from("transactions")
        .select("user_id, category_id, amount")
        .eq("type", "expense")
        .gte("tx_date", start)
        .lte("tx_date", end),
    ]);

    const spent = new Map<string, number>();
    for (const tx of txs ?? []) {
      if (!tx.category_id) continue;
      const key = `${tx.user_id}:${tx.category_id}`;
      spent.set(key, (spent.get(key) ?? 0) + Number(tx.amount));
    }

    const alertsByUser = new Map<string, string[]>();
    for (const b of budgets ?? []) {
      const used = spent.get(`${b.user_id}:${b.category_id}`) ?? 0;
      const pct = (used / Number(b.monthly_limit)) * 100;
      if (pct < 90) continue;
      const name =
        (b.categories as unknown as { name: string } | null)?.name ??
        "una categoría";
      const msg =
        pct >= 100
          ? `🚨 Excediste tu presupuesto de ${name} ($${used.toFixed(2)} de $${Number(b.monthly_limit).toFixed(2)})`
          : `⚠️ Vas al ${Math.round(pct)}% de tu presupuesto de ${name}`;
      const list = alertsByUser.get(b.user_id) ?? [];
      list.push(msg);
      alertsByUser.set(b.user_id, list);
    }

    for (const [userId, messages] of alertsByUser) {
      await sendPushToUser(admin, userId, {
        title: "Mis Finanzas",
        body: messages.slice(0, 3).join("\n"),
        url: "/presupuestos",
      });
      notified++;
    }
  }

  return NextResponse.json({
    ok: true,
    notified,
    at: new Date().toISOString(),
  });
}
