"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deletePushSubscription,
  savePushSubscription,
} from "@/lib/actions/push";
import { Switch } from "@/components/ui/switch";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushSettings() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setEnabled(!!sub);
    });
  }, []);

  async function toggle(on: boolean) {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (on) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Permiso de notificaciones denegado.");
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        });
        await savePushSubscription(JSON.parse(JSON.stringify(sub)));
        setEnabled(true);
        toast.success("Notificaciones activadas 🔔");
      } else {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await deletePushSubscription(sub.endpoint);
          await sub.unsubscribe();
        }
        setEnabled(false);
        toast.success("Notificaciones desactivadas");
      }
    } catch {
      toast.error(
        "No se pudo activar. En iPhone: instalá la app en la pantalla de inicio primero (Compartir → Añadir a pantalla de inicio)."
      );
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-xs text-muted-foreground">
        En iPhone: instalá la app en tu pantalla de inicio para poder recibir
        notificaciones (iOS 16.4+).
      </p>
    );
  }

  return <Switch checked={enabled} onCheckedChange={toggle} disabled={busy} />;
}
