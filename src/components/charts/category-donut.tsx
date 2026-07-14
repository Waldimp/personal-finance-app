"use client";

import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryTotal } from "@/lib/queries/summary";
import { formatMoney } from "@/lib/money";
import { CategoryIcon } from "@/components/category-icon";

const MAX_SLICES = 6;

/**
 * Donut de gasto por categoría. Color = identidad de la categoría (fijo,
 * definido por el usuario). Leyenda-lista debajo con montos (hace de tabla).
 */
export function CategoryDonut({
  data,
  month,
  total,
}: {
  data: CategoryTotal[];
  month: string;
  total: number;
}) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Sin gastos este mes todavía. 🍃
      </p>
    );
  }

  // Top N + "Otros" para no ciclar colores.
  const top = data.slice(0, MAX_SLICES);
  const rest = data.slice(MAX_SLICES);
  const slices = [...top];
  if (rest.length > 0) {
    slices.push({
      id: null,
      name: "Otros",
      icon: "circle",
      color: "#94a3b8",
      total: rest.reduce((s, c) => s + c.total, 0),
    });
  }

  return (
    <div className="space-y-3">
      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="name"
              innerRadius="68%"
              outerRadius="95%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {slices.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatMoney(Number(value))}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground">Gastado</p>
          <p className="text-xl font-bold tabular-nums">{formatMoney(total)}</p>
        </div>
      </div>

      <div className="space-y-1">
        {top.map((c) => {
          const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
          const row = (
            <>
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-white"
                style={{ backgroundColor: c.color }}
              >
                <CategoryIcon name={c.icon} className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{c.name}</span>
              <span className="text-xs text-muted-foreground">{pct}%</span>
              <span className="w-20 text-right text-sm font-medium tabular-nums">
                {formatMoney(c.total)}
              </span>
            </>
          );
          return c.id ? (
            <Link
              key={c.id}
              href={`/transacciones?mes=${month}&categoria=${c.id}`}
              className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-accent"
            >
              {row}
            </Link>
          ) : (
            <div key={c.name} className="flex items-center gap-2.5 px-1 py-1.5">
              {row}
            </div>
          );
        })}
        {rest.length > 0 && (
          <p className="px-1 pt-1 text-xs text-muted-foreground">
            + {rest.length} categorías más ({formatMoney(rest.reduce((s, c) => s + c.total, 0))})
          </p>
        )}
      </div>
    </div>
  );
}
