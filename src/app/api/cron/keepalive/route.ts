import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Ping diario (Vercel Cron) para que el proyecto free de Supabase
 * no se pause por inactividad.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase.from("profiles").select("id").limit(1);

  return NextResponse.json({ ok: !error, at: new Date().toISOString() });
}
