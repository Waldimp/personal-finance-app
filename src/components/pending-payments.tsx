"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { MonthCommitments } from "@/lib/queries/commitments";
import { payDebtMonth } from "@/lib/actions/debts";
import { payInstallment } from "@/lib/actions/installments";
import { confirmRecurring } from "@/lib/actions/recurring";
import { celebrate } from "@/components/celebration";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarCheck, Car, CreditCard, Repeat } from "lucide-react";

type IncomeEdit = { id: string; label: string; amount: string };

export function PendingPayments({
  commitments,
}: {
  commitments: MonthCommitments;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [incomeEdit, setIncomeEdit] = useState<IncomeEdit | null>(null);
  const [savingIncome, setSavingIncome] = useState(false);

  const expenseItems: {
    key: string;
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    amount: number;
    action: () => Promise<void>;
  }[] = [
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

  const incomeItems = commitments.pendingRecurringIncome;

  if (expenseItems.length === 0 && incomeItems.length === 0) return null;

  async function handleExpense(
    key: string,
    label: string,
    action: () => Promise<void>
  ) {
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

  async function handleIncomeConfirm() {
    if (!incomeEdit) return;
    const amount = Number(incomeEdit.amount);
    if (!amount || amount <= 0) {
      toast.error("Ingresá el monto que recibiste.");
      return;
    }
    setSavingIncome(true);
    try {
      await confirmRecurring(incomeEdit.id, amount);
      celebrate("income");
      toast.success(`${incomeEdit.label}: ${formatMoney(amount)} registrado 💵`);
      setIncomeEdit(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar.");
    } finally {
      setSavingIncome(false);
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
        {incomeItems.map((r) => (
          <div key={`rec-${r.id}`} className="flex items-center gap-3">
            <span className="text-muted-foreground">
              <Repeat className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.description}</p>
              <p className="text-xs text-muted-foreground">
                Ingreso · día {r.day_of_month}
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-500">
              +{formatMoney(Number(r.amount))}
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() =>
                setIncomeEdit({
                  id: r.id,
                  label: r.description,
                  amount: String(r.amount),
                })
              }
            >
              Ya cayó
            </Button>
          </div>
        ))}

        {expenseItems.map((item) => (
          <div key={item.key} className="flex items-center gap-3">
            <span className="text-muted-foreground">{item.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.sublabel}</p>
            </div>
            <p className="text-sm font-semibold tabular-nums">
              {formatMoney(item.amount)}
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => handleExpense(item.key, item.label, item.action)}
            >
              {busy === item.key ? "…" : "Registrar"}
            </Button>
          </div>
        ))}
      </CardContent>

      {/* Diálogo: monto líquido real del ingreso */}
      <Dialog open={!!incomeEdit} onOpenChange={(v) => !v && setIncomeEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>💵 {incomeEdit?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>¿Cuánto recibiste líquido? (USD)</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={incomeEdit?.amount ?? ""}
                onChange={(e) =>
                  setIncomeEdit((prev) =>
                    prev ? { ...prev, amount: e.target.value } : prev
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Ajustalo al monto real después de descuentos de ley. No cambia
                tu plantilla recurrente.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={handleIncomeConfirm}
              disabled={savingIncome}
            >
              {savingIncome ? "Registrando…" : "Registrar ingreso"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
