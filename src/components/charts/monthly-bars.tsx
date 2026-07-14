"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthPoint } from "@/lib/queries/summary";
import { formatMoney } from "@/lib/money";

const INCOME_COLOR = "#16a34a";
const EXPENSE_COLOR = "#dc2626";

const MONTH_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function shortMonth(month: string) {
  return MONTH_SHORT[Number(month.slice(5, 7)) - 1];
}

/** Barras lado a lado: ingresos vs gastos por mes. Un solo eje. */
export function MonthlyBars({ data }: { data: MonthPoint[] }) {
  const chartData = data.map((d) => ({ ...d, label: shortMonth(d.month) }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip
            formatter={(value, name) => [
              formatMoney(Number(value)),
              name === "income" ? "Ingresos" : "Gastos",
            ]}
            labelFormatter={(label) => `${label}`}
            cursor={{ fill: "var(--accent)", opacity: 0.5 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              fontSize: 13,
            }}
          />
          <Legend
            formatter={(value: string) =>
              value === "income" ? "Ingresos" : "Gastos"
            }
            wrapperStyle={{ fontSize: 12 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar dataKey="income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Bar dataKey="expense" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
