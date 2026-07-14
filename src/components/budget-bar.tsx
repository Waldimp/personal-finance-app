/**
 * Barra de progreso de presupuesto con semáforo:
 * verde <75%, ámbar 75–100%, rojo >100%.
 */
export function BudgetBar({ pct }: { pct: number }) {
  const color =
    pct >= 100
      ? "bg-red-500"
      : pct >= 75
        ? "bg-amber-500"
        : "bg-green-500";
  return (
    <div className="space-y-1">
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p
        className={`text-right text-xs tabular-nums ${
          pct >= 100
            ? "font-semibold text-red-600 dark:text-red-500"
            : pct >= 75
              ? "text-amber-600 dark:text-amber-500"
              : "text-muted-foreground"
        }`}
      >
        {Math.round(pct)}%
      </p>
    </div>
  );
}
