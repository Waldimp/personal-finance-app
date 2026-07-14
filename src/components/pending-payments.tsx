"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { MonthCommitments } from "@/lib/queries/commitments";
import { payDebtMonth } from "@/lib/actions/debts";
import { payInstallment } from "@/lib/actions/installments";
import { confirmRecurring } from "@/lib/actions/recurring";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, Car, CreditCard, Repeat } from "lucide-react";

export function PendingPayments({
  commitments,
}: {
  commitments: MonthCommitments;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const items: {
    key: string;
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    amount: number;
    isIncome?: boolean;
    action: () => Promise<void>;
  }[] = [
    ...commitments.pendingRecurringIncome.map((r) => ({
      key: `rec-${r.id}`,
      icon: <Repeat className="size-4" />,
      label: r.description,
      sublabel: `Ingreso · día ${r.day_of_month}`,
      amount: Number(r.amount),
      isIncome: true,
      action: () => confirmRecurring(r.id),
    })),
    ...commitments.pendingDebts.map((d) => ({
      key: `debt-${d.id}`,
      icon: <Car className="size-4" />,
      label: d.name,
      sublabel: `Deuda · día ${d.payment_day}`,
      amount: Math.min(Number(d.monthly_payment), Number(d.remaining_balance)),
      action: () => payDebtMonth(d.id),
    })),
    ...commitments.pendingInstallments.map((p) => ({
      key: `inst-${p.id}`,
      icon: <CreditCard className="size-4" />,
      label: p.installment_plans?.description ?? "Cuota",
      sublabel: `Cuota ${p.number}${
        p.installment_plans ? ` de ${p.installment_plans.months}` : ""
      }`,
      amount: Number(p.amount),
      action: () => payInstallment(p.id),
    })),
    ...commitments.pendingRecurringExpense.map((r) => ({
      key: `recx-${r.id}`,
      icon: <Repeat className="size-4" />,
      label: r.description,
      sublabel: `Fijo · día ${r.day_of_month}`,
      amount: Number(r.amount),
      action: () => confirmRecurring(r.id),
    })),
  ];

  if (items.length === 0) return null;

  async function handle(key: string, label: string, action: () => Promise<void>) {
    setBusy(key);
    try {
      await action();
      toast.success(`${label} registrado ✅`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="size-4" /> Pendientes de este mes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-3">
            <span className="text-muted-foreground">{item.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.sublabel}</p>
            </div>
            <p
              className={`text-sm font-semibold tabular-nums ${
                item.isIncome ? "text-green-600 dark:text-green-500" : ""
              }`}
            >
              {item.isIncome ? "+" : ""}
              {formatMoney(item.amount)}
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => handle(item.key, item.label, item.action)}
            >
              {busy === item.key ? "…" : "Registrar"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
