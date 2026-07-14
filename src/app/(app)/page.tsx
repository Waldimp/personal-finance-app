import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  addMonths,
  currentMonth,
  daysLeftInMonth,
  formatMonth,
} from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getMonthSummary, getMonthlySeries } from "@/lib/queries/summary";
import type { TransactionWithRefs } from "@/lib/types";
import { CategoryDonut } from "@/components/charts/category-donut";
import { MonthlyBars } from "@/components/charts/monthly-bars";
import { CategoryIcon } from "@/components/category-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(params.mes ?? "")
    ? params.mes!
    : currentMonth();
  const isCurrent = month === currentMonth();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, summary, series, { data: recent }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, monthly_income_estimate")
        .eq("id", user!.id)
        .single(),
      getMonthSummary(supabase, month),
      getMonthlySeries(supabase, currentMonth(), 6),
      supabase
        .from("transactions")
        .select(
          "*, categories(name, icon, color, type), payment_methods(name, color, type)"
        )
        .order("tx_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  // Si aún no se registró el ingreso del mes, usar el estimado del perfil.
  const usingEstimate =
    summary.income === 0 && (profile?.monthly_income_estimate ?? 0) > 0;
  const incomeBase = usingEstimate
    ? Number(profile!.monthly_income_estimate)
    : summary.income;

  const available = incomeBase - summary.expense;
  const daysLeft = daysLeftInMonth(month);
  const perDay = daysLeft > 0 && available > 0 ? available / daysLeft : 0;
  const firstName = profile?.display_name?.split(" ")[0];

  return (
    <div className="space-y-5">
      {/* Header del mes */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href={`/?mes=${addMonths(month, -1)}`} />}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-bold">{formatMonth(month)}</h1>
          {isCurrent && firstName && (
            <p className="text-xs text-muted-foreground">Hola, {firstName} 👋</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={month >= currentMonth() ? "pointer-events-none opacity-40" : ""}
          render={<Link href={`/?mes=${addMonths(month, 1)}`} />}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {/* Hero: Disponible */}
      <Card
        className={
          available < 0
            ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
            : ""
        }
      >
        <CardContent className="pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            {available < 0 ? "Excedido este mes" : "Disponible este mes"}
          </p>
          <p
            className={`mt-1 text-4xl font-bold tabular-nums ${
              available < 0 ? "text-red-600 dark:text-red-400" : ""
            }`}
          >
            {available < 0 ? "−" : ""}
            {formatMoney(Math.abs(available))}
          </p>
          {available < 0 ? (
            <p className="mt-1 text-sm text-red-600/80 dark:text-red-400/80">
              Gastaste {formatMoney(Math.abs(available))} más de lo que ingresó. 💪
              Vamos a recuperarlo.
            </p>
          ) : (
            isCurrent &&
            daysLeft > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                ≈ {formatMoney(perDay)}/día por {daysLeft} días restantes
              </p>
            )
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3 text-left">
            <div>
              <p className="text-xs text-muted-foreground">
                Ingresos{usingEstimate ? " (estimado)" : ""}
              </p>
              <p className="font-semibold tabular-nums text-green-600 dark:text-green-500">
                {formatMoney(incomeBase)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gastado</p>
              <p className="font-semibold tabular-nums text-red-600 dark:text-red-500">
                {formatMoney(summary.expense)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donut por categoría */}
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

      {/* Barras mes a mes */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Últimos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBars data={series} />
        </CardContent>
      </Card>

      {/* Transacciones recientes */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-0">
          <CardTitle className="text-base">Recientes</CardTitle>
          <Link
            href="/transacciones"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Ver todo
          </Link>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {((recent ?? []) as TransactionWithRefs[]).map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 py-1">
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: tx.categories?.color ?? "#94a3b8" }}
              >
                <CategoryIcon
                  name={tx.categories?.icon ?? "circle"}
                  className="size-4"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {tx.categories?.name ?? "Sin categorizar"}
                </p>
                <p className="text-xs text-muted-foreground">{tx.tx_date}</p>
              </div>
              <p
                className={`text-sm font-semibold tabular-nums ${
                  tx.type === "income" ? "text-green-600 dark:text-green-500" : ""
                }`}
              >
                {tx.type === "income" ? "+" : "−"}
                {formatMoney(Number(tx.amount))}
              </p>
            </div>
          ))}
          {(recent ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Registrá tu primer movimiento con el botón +
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
