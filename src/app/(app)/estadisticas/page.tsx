import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addMonths, currentMonth, formatMonth } from "@/lib/dates";
import { getMonthSummary, getMonthlySeries } from "@/lib/queries/summary";
import { CategoryDonut } from "@/components/charts/category-donut";
import { MonthlyBars } from "@/components/charts/monthly-bars";
import { MethodBars } from "@/components/charts/method-bars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(params.mes ?? "")
    ? params.mes!
    : currentMonth();

  const supabase = await createClient();
  const [summary, series] = await Promise.all([
    getMonthSummary(supabase, month),
    getMonthlySeries(supabase, month, 6),
  ]);

  const balance = summary.income - summary.expense;

  return (
    <div className="stagger space-y-5">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href={`/estadisticas?mes=${addMonths(month, -1)}`} />}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-bold">{formatMonth(month)}</h1>
        <Button
          variant="ghost"
          size="icon"
          className={month >= currentMonth() ? "pointer-events-none opacity-40" : ""}
          render={<Link href={`/estadisticas?mes=${addMonths(month, 1)}`} />}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">Ingresos</p>
          <p className="text-sm font-bold tabular-nums text-green-600 dark:text-green-500">
            {formatMoney(summary.income)}
          </p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">Gastos</p>
          <p className="text-sm font-bold tabular-nums text-red-600 dark:text-red-500">
            {formatMoney(summary.expense)}
          </p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p
            className={`text-sm font-bold tabular-nums ${
              balance < 0
                ? "text-red-600 dark:text-red-500"
                : "text-green-600 dark:text-green-500"
            }`}
          >
            {balance < 0 ? "−" : ""}
            {formatMoney(Math.abs(balance))}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Ingresos vs gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBars data={series} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Gasto por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryDonut
            data={summary.byCategory}
            month={month}
            total={summary.expense}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Gasto por método de pago</CardTitle>
        </CardHeader>
        <CardContent>
          <MethodBars data={summary.byMethod} />
        </CardContent>
      </Card>
    </div>
  );
}
