import { formatMoney } from "@/lib/money";
import type { Insight, InsightContext } from "./types";

type Rule = (ctx: InsightContext) => Insight | Insight[] | null;

const SEVERITY_ORDER = { alert: 0, warn: 1, cheer: 2, info: 3 } as const;

/** 1. Pico de gasto por categoría vs promedio de 3 meses. */
const categorySpike: Rule = (ctx) => {
  const spikes = ctx.categories
    .filter(
      (c) =>
        c.avg3 >= 10 &&
        c.current > c.avg3 * 1.25 &&
        c.current - c.avg3 >= 20
    )
    .sort((a, b) => b.current - b.avg3 - (a.current - a.avg3));
  const top = spikes[0];
  if (!top) return null;
  const pct = Math.round(((top.current - top.avg3) / top.avg3) * 100);
  return {
    id: `spike-${top.id}`,
    severity: "warn",
    emoji: "📈",
    title: `Gastaste ${pct}% más en ${top.name} que tu promedio`,
    detail: `${formatMoney(top.current)} este mes vs ${formatMoney(top.avg3)} habitual.`,
  };
};

/** 2. Proyección de presupuesto: a este ritmo lo excedés antes de fin de mes. */
const budgetProjection: Rule = (ctx) => {
  if (ctx.daysElapsed < 5) return null;
  const results: Insight[] = [];
  for (const b of ctx.budgets) {
    if (b.pct >= 100) continue; // ya lo cubre budgetNear
    const dailyPace = b.spent / ctx.daysElapsed;
    const projected = dailyPace * ctx.daysInMonth;
    if (projected > b.limit && b.spent > 0) {
      const dayExceeded = Math.ceil(b.limit / dailyPace);
      results.push({
        id: `budget-proj-${b.categoryName}`,
        severity: "warn",
        emoji: "⏳",
        title: `A este ritmo excederás ${b.categoryName} el día ${Math.min(dayExceeded, ctx.daysInMonth)}`,
        detail: `Proyección: ${formatMoney(projected)} de un límite de ${formatMoney(b.limit)}.`,
      });
    }
  }
  return results.slice(0, 1);
};

/** 3. Presupuesto al 90% / excedido. */
const budgetNear: Rule = (ctx) => {
  const over = ctx.budgets.filter((b) => b.pct >= 90);
  return over.slice(0, 2).map((b) => ({
    id: `budget-near-${b.categoryName}`,
    severity: b.pct >= 100 ? ("alert" as const) : ("warn" as const),
    emoji: b.pct >= 100 ? "🚨" : "⚠️",
    title:
      b.pct >= 100
        ? `Excediste tu presupuesto de ${b.categoryName}`
        : `Vas al ${Math.round(b.pct)}% de ${b.categoryName}`,
    detail: `${formatMoney(b.spent)} de ${formatMoney(b.limit)}.`,
  }));
};

/** 4. Proyección global de fin de mes. */
const monthEndProjection: Rule = (ctx) => {
  if (ctx.daysElapsed < 7 || ctx.incomeBase <= 0) return null;
  const projected =
    (ctx.totalSpent / ctx.daysElapsed) * ctx.daysInMonth + ctx.committedPending;
  const balance = ctx.incomeBase - projected;
  if (balance < -10) {
    return {
      id: "month-end",
      severity: "alert",
      emoji: "🔮",
      title: `Proyección: cerrarás el mes con −${formatMoney(Math.abs(balance))}`,
      detail: `Ritmo actual + compromisos pendientes superan tus ingresos. Frená los gustos unos días.`,
    };
  }
  if (balance > 50 && ctx.daysElapsed >= 15) {
    return {
      id: "month-end-good",
      severity: "cheer",
      emoji: "🌟",
      title: `Proyección positiva: cerrarías con +${formatMoney(balance)}`,
      detail: "Si mantenés este ritmo, este mes queda en verde.",
    };
  }
  return null;
};

/** 5. Análisis 50/30/20. */
const rule503020: Rule = (ctx) => {
  if (ctx.incomeBase <= 0 || ctx.totalSpent < ctx.incomeBase * 0.3) return null;
  let need = 0,
    want = 0,
    saving = 0;
  for (const c of ctx.categories) {
    if (c.needs_bucket === "need") need += c.current;
    else if (c.needs_bucket === "want") want += c.current;
    else if (c.needs_bucket === "saving") saving += c.current;
  }
  const wantPct = Math.round((want / ctx.incomeBase) * 100);
  const needPct = Math.round((need / ctx.incomeBase) * 100);
  const savingPct = Math.round((saving / ctx.incomeBase) * 100);
  if (wantPct > 30) {
    return {
      id: "503020",
      severity: "warn",
      emoji: "⚖️",
      title: `Tus gustos van en ${wantPct}% del ingreso (la regla sugiere 30%)`,
      detail: `Este mes: ${needPct}% necesidades / ${wantPct}% gustos / ${savingPct}% ahorro. Ideal: 50/30/20.`,
    };
  }
  return null;
};

/** 6. Carga de compromisos del próximo mes. */
const commitmentLoad: Rule = (ctx) => {
  if (ctx.incomeBase <= 0 || ctx.committedNextMonth <= 0) return null;
  const pct = Math.round((ctx.committedNextMonth / ctx.incomeBase) * 100);
  if (pct <= 40) return null;
  return {
    id: "commit-load",
    severity: pct > 60 ? "alert" : "warn",
    emoji: "🔗",
    title: `El ${pct}% de tu ingreso del próximo mes ya está comprometido`,
    detail: `${formatMoney(ctx.committedNextMonth)} entre deudas, cuotas y fijos. Ojo con nuevas cuotas.`,
  };
};

/** 7. Cuota por terminar: plata que se libera. */
const planEnding: Rule = (ctx) => {
  const plan = ctx.plansEnding[0];
  if (!plan) return null;
  return {
    id: `plan-end-${plan.description}`,
    severity: "cheer",
    emoji: "🎉",
    title: `Tu cuota de "${plan.description}" está por terminar`,
    detail: `Se liberan ${formatMoney(plan.monthly)}/mes. ¡Considerá mandarlos a ahorro!`,
  };
};

/** 8. Gasto individual atípico. */
const bigExpense: Rule = (ctx) => {
  if (!ctx.maxSingleExpense || ctx.incomeBase <= 0) return null;
  if (ctx.maxSingleExpense.amount < ctx.incomeBase * 0.15) return null;
  return {
    id: "big-expense",
    severity: "info",
    emoji: "👀",
    title: `Tu mayor gasto del mes: ${formatMoney(ctx.maxSingleExpense.amount)}`,
    detail: ctx.maxSingleExpense.description || "Revisá si era necesario.",
  };
};

/** 9. Corte de tarjeta próximo. */
const cutSoon: Rule = (ctx) => {
  const card = ctx.cardCuts.find((c) => c.daysToCut >= 0 && c.daysToCut <= 3);
  if (!card) return null;
  return {
    id: `cut-${card.name}`,
    severity: "info",
    emoji: "📅",
    title: `El corte de ${card.name} es en ${card.daysToCut === 0 ? "hoy" : `${card.daysToCut} día${card.daysToCut > 1 ? "s" : ""}`}`,
    detail: `Llevás ${formatMoney(card.currentCharges)} en este ciclo. Lo que compres después cae al siguiente corte.`,
  };
};

/** 10. Ánimo: mejora vs mes anterior. */
const cheerImprovement: Rule = (ctx) => {
  if (ctx.daysElapsed < 10) return null;
  const improved = ctx.categories
    .filter(
      (c) =>
        c.needs_bucket === "want" &&
        c.previous >= 20 &&
        c.current < c.previous * 0.85
    )
    .sort((a, b) => b.previous - b.current - (a.previous - a.current));
  const top = improved[0];
  if (!top) return null;
  const pct = Math.round(((top.previous - top.current) / top.previous) * 100);
  return {
    id: `cheer-${top.id}`,
    severity: "cheer",
    emoji: "💪",
    title: `¡Vas ${pct}% abajo en ${top.name} vs el mes pasado!`,
    detail: `${formatMoney(top.current)} contra ${formatMoney(top.previous)}. Así se hace.`,
  };
};

/** 11. Ánimo: todos los presupuestos bajo control avanzado el mes. */
const budgetsOnTrack: Rule = (ctx) => {
  if (ctx.budgets.length === 0 || ctx.daysElapsed < 20) return null;
  if (ctx.budgets.every((b) => b.pct < 90)) {
    return {
      id: "on-track",
      severity: "cheer",
      emoji: "🏆",
      title: "Todos tus presupuestos bajo control este mes",
      detail: "Ninguno pasa del 90% y ya casi termina el mes. ¡Crack! 👏",
    };
  }
  return null;
};

const RULES: Rule[] = [
  budgetNear,
  monthEndProjection,
  commitmentLoad,
  categorySpike,
  budgetProjection,
  rule503020,
  planEnding,
  cheerImprovement,
  budgetsOnTrack,
  cutSoon,
  bigExpense,
];

export function computeInsights(ctx: InsightContext, max = 3): Insight[] {
  const all: Insight[] = [];
  for (const rule of RULES) {
    const result = rule(ctx);
    if (!result) continue;
    all.push(...(Array.isArray(result) ? result : [result]));
  }
  // Siempre incluir al menos un ánimo si existe, para no ser solo regaños.
  const sorted = all.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
  const top = sorted.slice(0, max);
  const cheer = sorted.find((i) => i.severity === "cheer");
  if (cheer && !top.includes(cheer)) {
    top[top.length - 1] = cheer;
  }
  return top;
}
