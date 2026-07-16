"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMonth } from "@/lib/dates";
import { X } from "lucide-react";

/**
 * Banner "Tu resumen del mes está listo" — visible los primeros días del
 * mes hasta que el usuario lo vea o lo cierre (localStorage).
 */
export function WrappedBanner({ month }: { month: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(`wrapped-${month}`)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [month]);

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      localStorage.setItem(`wrapped-${month}`, "1");
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <Link
      href={`/wrapped?mes=${month}`}
      className="animate-pop-in relative block overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white transition-transform active:scale-[0.98]"
    >
      <p className="pr-8 font-semibold">
        🎁 Tu resumen de {formatMonth(month)} está listo
      </p>
      <p className="pr-8 text-sm text-white/80">
        Lo bueno, lo malo y los gastos hormiga 🐜 — tocá para verlo
      </p>
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="absolute right-3 top-3 rounded-full bg-white/20 p-1"
      >
        <X className="size-3.5" />
      </button>
    </Link>
  );
}
