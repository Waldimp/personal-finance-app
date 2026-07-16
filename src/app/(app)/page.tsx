import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  addMonths,
  currentMonth,
  daysLeftInMonth,
  formatMonth,
  monthRange,
  todayLocal,
} from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getMonthSummary, getMonthlySeries } from "@/lib/queries/summary";
import { getMonthCommitments } from "@/lib/queries/commitments";
import { getBudgetsWithSpent } from "@/lib/queries/budgets";
import type { TransactionWithRefs } from "@/lib/types";
import { buildInsightContext } from "@/lib/queries/insights-context";
import { computeInsights } from "@/lib/insights/rules";
import { InsightsPanel } from "@/components/insights-panel";
import { CategoryDonut } from "@/components/charts/category-donut";
import { MonthlyBars } from "@/components/charts/monthly-bars";
import { CategoryIcon } from "@/components/category-icon";
import { PendingPayments } from "@/components/pending-payments";
import { BudgetBar } from "@/components/budget-bar";
import { CountUp } from "@/components/count-up";
import { WrappedBanner } from "@/components/wrapped-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Sparkles,
  Target,
} from "lucide-react";

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

  const [
    { data: profile },
    summary,
    series,
    commitments,
    budgets,
    { data: recent },
    { count: inboxCount },
    { count: prevMonthCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, monthly_income_estimate")
      .eq("id", user!.id)
      .single(),
    getMonthSummary(supabase, month),
    getMonthlySeries(supabase, currentMonth(), 6),
    getMonthCommitments(supabase, month),
    getBudgetsWithSpent(supabase, month),
    supabase
      .from("transactions")
      .select(
        "*, categories(name, icon, color, type), payment_methods(name, color, type)"
      )
      .order("tx_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .is("category_id", null),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .gte("tx_date", monthRange(addMonths(currentMonth(), -1)).start)
      .lte("tx_date", monthRange(addMonths(currentMonth(), -1)).end),
  ]);

  // Wrapped: banner los primeros 7 días del mes si el mes pasado tuvo movimientos.
  const showWrapped =
    isCurrent &&
    Number(todayLocal().slice(8, 10)) <= 7 &&
    (prevMonthCount ?? 0) > 0;
  const wrappedMonth = addMonths(currentMonth(), -1);

  const committedExpense = isCurrent ? commitments.committedExpense : 0;
  const pendingIncome = isCurrent ? commitments.pendingIncome : 0;

  // Disponible = SOLO plata registrada de verdad − gastado − comprometido.
  // Nada de estimados: si el sueldo aún no cae, no existe.
  const available = summary.income - summary.expense - committedExpense;

  // Para proyecciones y consejos sí usamos el ingreso esperado del mes.
  const incomeForInsights =
    summary.income + pendingIncome ||
    Number(profile?.monthly_income_estimate ?? 0);

  // Consejos y ánimos (solo para el mes actual).
  const insights = isCurrent
    ? computeInsights(await buildInsightContext(supabase, incomeForInsights))
    : [];
  const daysLeft = daysLeftInMonth(month);
  const perDay = daysLeft > 0 && available > 0 ? available / daysLeft : 0;
  const firstName = profile?.display_name?.split(" ")[0];
  const topBudgets = budgets.slice(0, 3);
  const alertBudgets = budgets.filter((b) => b.pct >= 90);

  return (
    <div className="stagger space-y-5">
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

      {/* Wrapped del mes pasado */}
      {showWrapped && <WrappedBanner month={wrappedMonth} />}

      {/* Hero: Disponible */}
      <Card
        className={`animate-fade-up ${
          available < 0
            ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
            : ""
        }`}
      >
        <CardContent className="pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            {available < 0 ? "Excedido este mes" : "Disponible este mes"}
          </p>
          <CountUp
            value={Math.abs(available)}
            prefix={available < 0 ? "−" : ""}
            className={`mt-1 block text-4xl font-bold tabular-nums ${
              available < 0 ? "text-red-600 dark:text-red-400" : ""
            }`}
          />
          {available < 0 ? (
            <p className="mt-1 text-sm text-red-600/80 dark:text-red-400/80">
              Entre lo gastado y lo comprometido vas {formatMoney(Math.abs(available))}{" "}
              arriba de lo que ha entrado. 💪 Vamos a recuperarlo.
            </p>
          ) : (
            isCurrent &&
            daysLeft > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                ≈ {formatMoney(perDay)}/día por {daysLeft} días restantes
              </p>
            )
          )}
          {isCurrent && pendingIncome > 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              💵 Por recibir este mes: {formatMoney(pendingIncome)} — se suma
              cuando lo registrés
            </p>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-left">
            <div>
              <p className="text-xs text-muted-foreground">Ingresos</p>
              <p className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-500">
                {formatMoney(summary.income)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gastado</p>
              <p className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-500">
                {formatMoney(summary.expense)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Comprometido</p>
              <p className="text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-500">
                {formatMoney(committedExpense)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-4 gap-2">
        <QuickLink href="/presupuestos" icon={<Target className="size-5" />} label="Presupuestos" />
        <QuickLink href="/deudas" icon={<Car className="size-5" />} label="Deudas" />
        <QuickLink href="/tarjetas" icon={<CreditCard className="size-5" />} label="Tarjetas" />
        <QuickLink href="/asistente" icon={<Sparkles className="size-5" />} label="Fina IA" />
      </div>

      {/* Inbox pendiente */}
      {(inboxCount ?? 0) > 0 && (
        <Link
          href="/inbox"
          className="block rounded-xl border border-blue-300 bg-blue-50 p-3 text-sm text-blue-700 transition-transform active:scale-[0.99] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400"
        >
          📥 Tenés <strong>{inboxCount}</strong> movimiento
          {inboxCount === 1 ? "" : "s"} sin categorizar — tocá para clasificar
        </Link>
      )}

      {/* Alertas de presupuesto */}
      {isCurrent && alertBudgets.length > 0 && (
        <div className="space-y-2">
          {alertBudgets.map((b) => (
            <Link
              key={b.id}
              href="/presupuestos"
              className={`block rounded-xl border p-3 text-sm ${
                b.pct >= 100
                  ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
                  : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400"
              }`}
            >
              {b.pct >= 100 ? "🚨" : "⚠️"} Vas al {Math.round(b.pct)}% de tu
              presupuesto de <strong>{b.categories?.name}</strong> (
              {formatMoney(b.spent)} de {formatMoney(Number(b.monthly_limit))})
            </Link>
          ))}
        </div>
      )}

      {/* Pagos pendientes del mes */}
      {isCurrent && <PendingPayments commitments={commitments} />}

      {/* Consejos y ánimos */}
      <InsightsPanel insights={insights} />

      {/* Top presupuestos */}
      {topBudgets.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-0">
            <CardTitle className="text-base">Presupuestos</CardTitle>
            <Link
              href="/presupuestos"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {topBudgets.map((b) => (
              <div key={b.id}>
                <div className="flex items-center justify-between pb-1 text-sm">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: b.categories?.color ?? "#64748b" }}
                    />
                    {b.categories?.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatMoney(b.spent)} / {formatMoney(Number(b.monthly_limit))}
                  </span>
                </div>
                <BudgetBar pct={b.pct} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors hover:bg-accent"
    >
      <span className="text-primary">{icon}</span>
      <span className="text-xs font-medium leading-tight">{label}</span>
    </Link>
  );
}
