"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WrappedData } from "@/lib/queries/wrapped";
import { addMonths, formatMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { CategoryIcon } from "@/components/category-icon";
import { X } from "lucide-react";

const SLIDE_MS = 7000;

type Slide = { id: string; bg: string; render: () => React.ReactNode };

export function WrappedStories({ data }: { data: WrappedData }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const monthName = formatMonth(data.month);

  // Marcar como visto (el banner del inicio deja de insistir).
  useEffect(() => {
    try {
      localStorage.setItem(`wrapped-${data.month}`, "1");
    } catch {}
  }, [data.month]);

  const improved =
    (data.deltaPct !== null && data.deltaPct < 0) || data.balance > 0;

  const slides = useMemo<Slide[]>(() => {
    const list: Slide[] = [];

    list.push({
      id: "intro",
      bg: "from-indigo-950 via-background to-background",
      render: () => (
        <>
          <p className="animate-pop-in text-6xl">🎁</p>
          <h1 className="animate-fade-up text-3xl font-bold" style={{ animationDelay: "150ms" }}>
            Tu {monthName}
          </h1>
          <p className="animate-fade-up text-muted-foreground" style={{ animationDelay: "300ms" }}>
            en plata, sin filtros 💸
          </p>
          <p className="animate-fade-up pt-4 text-sm text-muted-foreground" style={{ animationDelay: "500ms" }}>
            Registraste <strong className="text-foreground">{data.txCount}</strong> movimientos
          </p>
        </>
      ),
    });

    list.push({
      id: "totales",
      bg: "from-emerald-950/60 via-background to-background",
      render: () => (
        <>
          <p className="animate-fade-up text-sm uppercase tracking-wide text-muted-foreground">
            El marcador del mes
          </p>
          <div className="animate-fade-up space-y-3 pt-2" style={{ animationDelay: "150ms" }}>
            <div>
              <p className="text-sm text-muted-foreground">Entró</p>
              <p className="text-4xl font-bold tabular-nums text-green-500">
                {formatMoney(data.income)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Salió</p>
              <p className="text-4xl font-bold tabular-nums text-red-500">
                {formatMoney(data.expense)}
              </p>
            </div>
          </div>
          <p
            className={`animate-pop-in pt-4 text-xl font-semibold ${
              data.balance >= 0 ? "text-green-500" : "text-red-500"
            }`}
            style={{ animationDelay: "500ms" }}
          >
            {data.balance >= 0
              ? `Cerraste +${formatMoney(data.balance)} 🙌`
              : `Cerraste −${formatMoney(Math.abs(data.balance))} 😬`}
          </p>
        </>
      ),
    });

    if (data.topCategories.length > 0) {
      const top = data.topCategories[0];
      list.push({
        id: "top-cat",
        bg: "from-purple-950/60 via-background to-background",
        render: () => (
          <>
            <p className="animate-fade-up text-sm uppercase tracking-wide text-muted-foreground">
              Tu categoría estrella fue
            </p>
            <div
              className="animate-pop-in flex size-20 items-center justify-center rounded-3xl text-white"
              style={{ backgroundColor: top.color, animationDelay: "150ms" }}
            >
              <CategoryIcon name={top.icon} className="size-10" />
            </div>
            <h2 className="animate-fade-up text-2xl font-bold" style={{ animationDelay: "300ms" }}>
              {top.name}
            </h2>
            <p className="animate-fade-up text-3xl font-bold tabular-nums" style={{ animationDelay: "400ms" }}>
              {formatMoney(top.total)}
            </p>
            {data.topCategories.length > 1 && (
              <div className="animate-fade-up space-y-1 pt-4" style={{ animationDelay: "600ms" }}>
                {data.topCategories.slice(1).map((c, i) => (
                  <p key={c.name} className="text-sm text-muted-foreground">
                    {i + 2}. {c.name} · {formatMoney(c.total)}
                  </p>
                ))}
              </div>
            )}
          </>
        ),
      });
    }

    if (data.antCount > 0) {
      list.push({
        id: "hormigas",
        bg: "from-amber-950/60 via-background to-background",
        render: () => (
          <>
            <p className="animate-fade-up text-sm uppercase tracking-wide text-muted-foreground">
              El desfile de gastos hormiga
            </p>
            <div className="relative h-10 w-full overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute bottom-0 text-2xl"
                  style={{
                    animation: `ant-walk 3.5s linear ${i * 0.5}s infinite`,
                    transform: "scaleX(-1)",
                  }}
                >
                  🐜
                </span>
              ))}
            </div>
            <p className="animate-pop-in text-5xl font-bold tabular-nums" style={{ animationDelay: "200ms" }}>
              {data.antCount}
            </p>
            <p className="animate-fade-up text-muted-foreground" style={{ animationDelay: "350ms" }}>
              gastos menores de $15 que juntos sumaron
            </p>
            <p className="animate-fade-up text-3xl font-bold tabular-nums text-amber-500" style={{ animationDelay: "500ms" }}>
              {formatMoney(data.antTotal)}
            </p>
            <p className="animate-fade-up pt-2 text-xs text-muted-foreground" style={{ animationDelay: "700ms" }}>
              chiquitos, pero cómo suman 🐜
            </p>
          </>
        ),
      });
    }

    if (data.biggest) {
      list.push({
        id: "biggest",
        bg: "from-red-950/60 via-background to-background",
        render: () => (
          <>
            <p className="animate-fade-up text-sm uppercase tracking-wide text-muted-foreground">
              Tu gasto más pesado
            </p>
            <p className="animate-pop-in text-5xl" style={{ animationDelay: "150ms" }}>
              🏋️
            </p>
            <p className="animate-fade-up text-4xl font-bold tabular-nums" style={{ animationDelay: "300ms" }}>
              {formatMoney(data.biggest!.amount)}
            </p>
            <p className="animate-fade-up text-muted-foreground" style={{ animationDelay: "450ms" }}>
              {data.biggest!.description || data.biggest!.category}
            </p>
          </>
        ),
      });
    }

    if (data.budgetsTotal > 0) {
      const all = data.budgetsKept === data.budgetsTotal;
      list.push({
        id: "budgets",
        bg: "from-cyan-950/60 via-background to-background",
        render: () => (
          <>
            <p className="animate-fade-up text-sm uppercase tracking-wide text-muted-foreground">
              Presupuestos
            </p>
            <p className="animate-pop-in text-5xl" style={{ animationDelay: "150ms" }}>
              {all ? "🏆" : "🎯"}
            </p>
            <p className="animate-fade-up text-3xl font-bold" style={{ animationDelay: "300ms" }}>
              {data.budgetsKept} de {data.budgetsTotal}
            </p>
            <p className="animate-fade-up text-muted-foreground" style={{ animationDelay: "450ms" }}>
              {all
                ? "respetaste TODOS tus límites. Crack. 👏"
                : "límites respetados. El resto… lo intentamos 😅"}
            </p>
          </>
        ),
      });
    } else if (data.topMethod) {
      list.push({
        id: "method",
        bg: "from-cyan-950/60 via-background to-background",
        render: () => (
          <>
            <p className="animate-fade-up text-sm uppercase tracking-wide text-muted-foreground">
              Tu arma de pago favorita
            </p>
            <p className="animate-pop-in text-5xl" style={{ animationDelay: "150ms" }}>
              💳
            </p>
            <p className="animate-fade-up text-2xl font-bold" style={{ animationDelay: "300ms" }}>
              {data.topMethod!.name}
            </p>
            <p className="animate-fade-up text-muted-foreground" style={{ animationDelay: "450ms" }}>
              {formatMoney(data.topMethod!.total)} pasaron por ahí
            </p>
          </>
        ),
      });
    }

    list.push({
      id: "outro",
      bg: improved
        ? "from-green-950/70 via-background to-background"
        : "from-indigo-950 via-background to-background",
      render: () => (
        <>
          {improved && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute top-0"
                  style={{
                    left: `${(i * 41) % 100}%`,
                    fontSize: 16 + (i % 4) * 6,
                    animation: `fall-down ${1.8 + (i % 4) * 0.4}s ease-in ${(i % 6) * 0.25}s infinite`,
                  }}
                >
                  {["💵", "🪙", "✨", "🎉"][i % 4]}
                </span>
              ))}
            </div>
          )}
          <p className="animate-pop-in text-5xl">{improved ? "🎉" : "💪"}</p>
          <h2 className="animate-fade-up text-2xl font-bold" style={{ animationDelay: "200ms" }}>
            {data.deltaPct !== null
              ? data.deltaPct < 0
                ? `Gastaste ${Math.abs(data.deltaPct)}% menos que el mes pasado`
                : data.deltaPct === 0
                  ? "Gastaste igual que el mes pasado"
                  : `Gastaste ${data.deltaPct}% más que el mes pasado`
              : data.balance >= 0
                ? "Mes en verde. Así se empieza."
                : "Este mes fue de aprendizaje."}
          </h2>
          <p className="animate-fade-up text-muted-foreground" style={{ animationDelay: "400ms" }}>
            {improved
              ? "Vas por buen camino. ¡A repetirlo este mes! 🚀"
              : "Nuevo mes, nueva oportunidad. Vos podés. 🌱"}
          </p>
          <button
            onClick={() => router.push("/")}
            className="animate-fade-up mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground active:scale-95"
            style={{ animationDelay: "600ms" }}
          >
            Empezar {formatMonth(addMonths(data.month, 1))} con todo
          </button>
        </>
      ),
    });

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, improved, monthName]);

  // Auto-avance
  useEffect(() => {
    if (index >= slides.length - 1) return;
    const t = setTimeout(() => setIndex((i) => i + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, slides.length]);

  const slide = slides[index];

  // Tap para navegar (izquierda = atrás, resto = adelante), sin bloquear botones.
  function handleTap(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    if (x < e.currentTarget.clientWidth / 3) {
      setIndex((i) => Math.max(0, i - 1));
    } else {
      setIndex((i) => Math.min(slides.length - 1, i + 1));
    }
  }

  return (
    <div
      onPointerUp={handleTap}
      className="fixed inset-0 z-50 mx-auto flex w-full max-w-md touch-none select-none flex-col bg-background"
    >
      {/* Fondo */}
      <div className={`absolute inset-0 bg-gradient-to-b ${slide.bg} transition-colors duration-500`} />

      {/* Progreso */}
      <div
        className="relative z-10 flex gap-1.5 px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        {slides.map((s, i) => (
          <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground"
              style={{
                width: i < index ? "100%" : i > index ? "0%" : undefined,
                animation:
                  i === index && index < slides.length - 1
                    ? `grow-x ${SLIDE_MS}ms linear forwards`
                    : undefined,
                ...(i === index && index === slides.length - 1
                  ? { width: "100%" }
                  : {}),
              }}
            />
          </div>
        ))}
      </div>

      {/* Cerrar */}
      <button
        onClick={() => router.push("/")}
        aria-label="Cerrar"
        className="absolute right-4 z-30 rounded-full bg-muted/60 p-2 backdrop-blur"
        style={{ top: "calc(env(safe-area-inset-top) + 28px)" }}
      >
        <X className="size-4" />
      </button>

      {/* Contenido */}
      <div
        key={slide.id}
        className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center"
      >
        {slide.render()}
      </div>

    </div>
  );
}
