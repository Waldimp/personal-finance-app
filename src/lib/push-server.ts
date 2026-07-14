import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

let configured = false;

function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

export type PushPayload = { title: string; body: string; url?: string };

/** Envía push a todas las suscripciones de un usuario (usar admin client). */
export async function sendPushToUser(
  admin: SupabaseClient,
  userId: string,
  payload: PushPayload
) {
  configure();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
    } catch (err: unknown) {
      // 404/410: suscripción muerta → limpiarla.
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }
}
