"use client";

import { useEffect, useState } from "react";

export type CelebrationType = "ants" | "expense" | "income";

/** Dispara una celebración desde cualquier componente cliente. */
export function celebrate(type: CelebrationType) {
  window.dispatchEvent(new CustomEvent("mf-celebrate", { detail: type }));
}

type Particle = {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
};

/**
 * Host global de celebraciones (montado en el layout de la app):
 * - ants: desfile de hormiguitas para gastos hormiga (< $15) 🐜
 * - income: lluvia de billetes 💵
 * - expense: check con pop ✅
 */
export function CelebrationHost() {
  const [active, setActive] = useState<CelebrationType | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    function onCelebrate(e: Event) {
      const type = (e as CustomEvent<CelebrationType>).detail;
      setActive(type);

      if (type === "ants") {
        setParticles(
          Array.from({ length: 7 }, (_, i) => ({
            id: i,
            emoji: "🐜",
            left: 0,
            delay: i * 0.22,
            duration: 2.4,
            size: 20 + (i % 3) * 4,
          }))
        );
      } else if (type === "income") {
        const emojis = ["💵", "🪙", "💰", "✨"];
        setParticles(
          Array.from({ length: 18 }, (_, i) => ({
            id: i,
            emoji: emojis[i % emojis.length],
            left: Math.round((i * 53) % 100),
            delay: (i % 6) * 0.18,
            duration: 1.8 + (i % 4) * 0.35,
            size: 18 + (i % 4) * 6,
          }))
        );
      } else {
        setParticles([]);
      }

      const timeout = setTimeout(
        () => setActive(null),
        type === "expense" ? 1200 : 3200
      );
      return () => clearTimeout(timeout);
    }

    window.addEventListener("mf-celebrate", onCelebrate);
    return () => window.removeEventListener("mf-celebrate", onCelebrate);
  }, []);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      aria-hidden
    >
      {active === "ants" && (
        <>
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute"
              style={{
                bottom: `${96 + (p.id % 2) * 10}px`,
                left: 0,
                fontSize: p.size,
                animation: `ant-walk ${p.duration}s linear ${p.delay}s both`,
                transform: "scaleX(-1)",
              }}
            >
              🐜
            </span>
          ))}
          <div className="absolute inset-x-0 bottom-40 flex justify-center">
            <div className="animate-pop-in rounded-2xl bg-foreground/90 px-4 py-2 text-center text-sm font-medium text-background shadow-lg">
              Gasto hormiga registrado 🐜
              <span className="block text-xs opacity-70">
                pequeños, pero suman…
              </span>
            </div>
          </div>
        </>
      )}

      {active === "income" && (
        <>
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute top-0"
              style={{
                left: `${p.left}%`,
                fontSize: p.size,
                animation: `fall-down ${p.duration}s ease-in ${p.delay}s both`,
              }}
            >
              {p.emoji}
            </span>
          ))}
          <div className="absolute inset-x-0 top-1/3 flex justify-center">
            <div className="animate-pop-in rounded-2xl bg-green-600/95 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-lg">
              ¡Ingreso registrado! 💰
            </div>
          </div>
        </>
      )}

      {active === "expense" && (
        <div className="absolute inset-x-0 top-1/3 flex justify-center">
          <div className="animate-pop-in flex size-20 items-center justify-center rounded-full bg-foreground/90 text-4xl shadow-xl">
            ✅
          </div>
        </div>
      )}
    </div>
  );
}
