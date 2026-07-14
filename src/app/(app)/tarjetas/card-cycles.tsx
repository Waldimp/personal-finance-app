"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { CardCycle } from "@/lib/queries/cards";
import {
  deleteCardPayment,
  registerCardPayment,
} from "@/lib/actions/card-payments";
import { formatDay, todayLocal } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet } from "lucide-react";

export function CardCycles({ cycles }: { cycles: CardCycle[] }) {
  const [paying, setPaying] = useState<CardCycle | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayLocal());
  const [saving, setSaving] = useState(false);

  function openPay(cycle: CardCycle) {
    setPaying(cycle);
    setAmount(cycle.estimatedDue > 0 ? String(cycle.estimatedDue) : "");
    setDate(todayLocal());
  }

  async function handlePay() {
    if (!paying || !amount || Number(amount) <= 0) {
      toast.error("Ingresá el monto del abono.");
      return;
    }
    setSaving(true);
    try {
      await registerCardPayment({
        payment_method_id: paying.method.id,
        amount: Number(amount),
        paid_date: date,
        note: "",
      });
      toast.success("Abono registrado ✅");
      setPaying(null);
    } catch {
      toast.error("No se pudo registrar el abono.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {cycles.map((cycle) => {
        const m = cycle.method;
        return (
          <div key={m.id} className="overflow-hidden rounded-2xl border">
            {/* Cabecera estilo tarjeta */}
            <div
              className="flex items-center justify-between p-4 text-white"
              style={{ backgroundColor: m.color }}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="size-5" />
                <div>
                  <p className="font-semibold">{m.name}</p>
                  {m.last4 && <p className="text-xs opacity-80">•••• {m.last4}</p>}
                </div>
              </div>
              {m.has_wallet && (
                <Badge className="gap-1 border-0 bg-white/20 text-white">
                  <Wallet className="size-3" /> Apple Pay
                </Badge>
              )}
            </div>

            <div className="space-y-3 p-4">
              {m.cut_day ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm text-muted-foreground">
                      Corte actual (cierra {formatDay(cycle.cycleEnd)})
                    </p>
                    <p className="text-lg font-bold tabular-nums">
                      {formatMoney(cycle.currentCharges)}
                    </p>
                  </div>
                  {m.credit_limit && (
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (cycle.currentCharges / Number(m.credit_limit)) * 100
                          )}%`,
                          backgroundColor: m.color,
                        }}
                      />
                    </div>
                  )}

                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm">Por pagar del corte anterior</p>
                      <p
                        className={`font-bold tabular-nums ${
                          cycle.estimatedDue > 0
                            ? "text-red-600 dark:text-red-500"
                            : "text-green-600 dark:text-green-500"
                        }`}
                      >
                        {formatMoney(cycle.estimatedDue)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Cerró en {formatMoney(cycle.previousCharges)}
                      {cycle.paymentsSinceCut > 0 &&
                        ` · abonaste ${formatMoney(cycle.paymentsSinceCut)}`}
                      {cycle.dueDate && ` · pagar antes del ${formatDay(cycle.dueDate)}`}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-muted-foreground">
                    Gastado este mes (sin día de corte configurado)
                  </p>
                  <p className="text-lg font-bold tabular-nums">
                    {formatMoney(cycle.currentCharges)}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openPay(cycle)}
                >
                  Registrar abono
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  render={<Link href={`/transacciones?tarjeta=${m.id}`} />}
                >
                  Ver movimientos
                </Button>
              </div>

              {cycle.recentPayments.length > 0 && (
                <div className="space-y-1 border-t pt-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Últimos abonos
                  </p>
                  {cycle.recentPayments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {formatDay(p.paid_date)}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-medium tabular-nums">
                          {formatMoney(Number(p.amount))}
                        </span>
                        <button
                          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                          onClick={async () => {
                            await deleteCardPayment(p.id);
                            toast.success("Abono eliminado");
                          }}
                        >
                          quitar
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground">
        💡 Los abonos son pagos al banco para saldar tu tarjeta: no cuentan como
        gasto (el gasto ya se registró cuando compraste), solo bajan lo que
        debés del corte.
      </p>

      <Dialog open={!!paying} onOpenChange={(v) => !v && setPaying(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abono a {paying?.method.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Monto (USD)</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="150.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={date}
                max={todayLocal()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handlePay} disabled={saving}>
              {saving ? "Registrando…" : "Registrar abono"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
