import type { MethodTotal } from "@/lib/queries/summary";
import { formatMoney } from "@/lib/money";

/** Gasto por método de pago: barras horizontales HTML (magnitud simple). */
export function MethodBars({ data }: { data: MethodTotal[] }) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Sin gastos con tarjeta este mes.
      </p>
    );
  }
  const max = Math.max(...data.map((m) => m.total));

  return (
    <div className="space-y-3">
      {data.map((m) => (
        <div key={m.name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: m.color }}
              />
              {m.name}
            </span>
            <span className="font-medium tabular-nums">{formatMoney(m.total)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${max > 0 ? (m.total / max) * 100 : 0}%`,
                backgroundColor: m.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
