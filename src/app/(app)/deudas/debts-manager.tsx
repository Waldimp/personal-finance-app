"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Category, Debt, PaymentMethod } from "@/lib/types";
import type { PlanWithPayments } from "./page";
import type { ProjectionPoint } from "@/lib/queries/commitments";
import {
  createDebt,
  deleteDebt,
  payDebtMonth,
  updateDebt,
} from "@/lib/actions/debts";
import {
  createInstallmentPlan,
  deleteInstallmentPlan,
  payInstallment,
} from "@/lib/actions/installments";
import { addMonths, currentMonth, formatMonth } from "@/lib/dates";
import { formatMoney, round2 } from "@/lib/money";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Car, CreditCard, Plus, Check } from "lucide-react";

const MONTH_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

type Props = {
  debts: Debt[];
  plans: PlanWithPayments[];
  categories: Category[];
  methods: PaymentMethod[];
  projection: ProjectionPoint[];
};

export function DebtsManager({ debts, plans, categories, methods, projection }: Props) {
  const month = currentMonth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Deudas y cuotas</h1>

      {/* Proyección de compromisos */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4" /> Compromisos próximos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectionBars data={projection} />
        </CardContent>
      </Card>

      <DebtsSection debts={debts} categories={categories} methods={methods} month={month} />
      <InstallmentsSection
        plans={plans}
        categories={categories}
        methods={methods}
        month={month}
      />
    </div>
  );
}

function ProjectionBars({ data }: { data: ProjectionPoint[] }) {
  const max = Math.max(...data.map((d) => d.committed), 1);
  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
          <p className="text-[10px] tabular-nums text-muted-foreground">
            {d.committed > 0 ? `$${Math.round(d.committed)}` : ""}
          </p>
          <div
            className="w-full max-w-9 rounded-t-[4px] bg-primary/80"
            style={{
              height: `${Math.max(4, (d.committed / max) * 80)}px`,
            }}
          />
          <p className="text-[10px] text-muted-foreground">
            {MONTH_SHORT[Number(d.month.slice(5, 7)) - 1]}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ============ DEUDAS ============ */

function DebtsSection({
  debts,
  categories,
  methods,
  month,
}: {
  debts: Debt[];
  categories: Category[];
  methods: PaymentMethod[];
  month: string;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [form, setForm] = useState({
    name: "",
    original_amount: "",
    remaining_balance: "",
    monthly_payment: "",
    payment_day: "1",
    category_id: "",
    payment_method_id: "",
  });
  const [saving, setSaving] = useState(false);

  const active = debts.filter((d) => !d.is_paid_off);
  const paidOff = debts.filter((d) => d.is_paid_off);

  function openCreate() {
    setEditing(null);
    const loanCat = categories.find((c) => c.name === "Préstamo carro");
    setForm({
      name: "",
      original_amount: "",
      remaining_balance: "",
      monthly_payment: "",
      payment_day: "1",
      category_id: loanCat?.id ?? "",
      payment_method_id: "",
    });
    setOpen(true);
  }

  function openEdit(d: Debt) {
    setEditing(d);
    setForm({
      name: d.name,
      original_amount: String(d.original_amount),
      remaining_balance: String(d.remaining_balance),
      monthly_payment: String(d.monthly_payment),
      payment_day: String(d.payment_day),
      category_id: d.category_id ?? "",
      payment_method_id: d.payment_method_id ?? "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.original_amount || !form.monthly_payment) {
      toast.error("Completá nombre, monto original y cuota mensual.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      original_amount: Number(form.original_amount),
      remaining_balance: Number(form.remaining_balance || form.original_amount),
      monthly_payment: Number(form.monthly_payment),
      payment_day: Number(form.payment_day || 1),
      category_id: form.category_id || null,
      payment_method_id: form.payment_method_id || null,
    };
    try {
      if (editing) {
        await updateDebt(editing.id, payload);
        toast.success("Deuda actualizada ✅");
      } else {
        await createDebt(payload);
        toast.success("Deuda agregada ✅");
      }
      setOpen(false);
    } catch {
      toast.error("No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePay(d: Debt) {
    try {
      await payDebtMonth(d.id);
      toast.success(`Pago de ${d.name} registrado ✅`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar.");
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Car className="size-5" /> Deudas
        </h2>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="size-4" /> Agregar
        </Button>
      </div>

      {active.length === 0 && paidOff.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Sin deudas registradas. Agregá tu préstamo del carro para trackear la
          amortización. 🚗
        </p>
      )}

      {active.map((d) => {
        const paidPct =
          Number(d.original_amount) > 0
            ? ((Number(d.original_amount) - Number(d.remaining_balance)) /
                Number(d.original_amount)) *
              100
            : 0;
        const paidThisMonth = d.last_paid_month === month;
        return (
          <div key={d.id} className="rounded-xl border p-4">
            <button onClick={() => openEdit(d)} className="w-full text-left">
              <div className="flex items-baseline justify-between">
                <p className="font-medium">{d.name}</p>
                <p className="text-sm text-muted-foreground">
                  día {d.payment_day}
                </p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Restan{" "}
                <span className="font-semibold text-foreground">
                  {formatMoney(Number(d.remaining_balance))}
                </span>{" "}
                de {formatMoney(Number(d.original_amount))}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${Math.min(100, paidPct)}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {Math.round(paidPct)}% pagado
              </p>
            </button>
            {paidThisMonth ? (
              <Badge variant="secondary" className="mt-2 gap-1">
                <Check className="size-3" /> Pago de este mes registrado
              </Badge>
            ) : (
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={() => handlePay(d)}
              >
                Registrar pago del mes · {formatMoney(Number(d.monthly_payment))}
              </Button>
            )}
          </div>
        );
      })}

      {paidOff.map((d) => (
        <div
          key={d.id}
          className="flex items-center justify-between rounded-xl border border-dashed p-3 opacity-70"
        >
          <p className="text-sm">
            {d.name} · <span className="text-green-600">¡Saldada! 🎉</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={async () => {
              await deleteDebt(d.id);
              toast.success("Deuda eliminada");
            }}
          >
            Quitar
          </Button>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar deuda" : "Nueva deuda"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Préstamo carro - Banco X"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monto original</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={form.original_amount}
                  onChange={(e) =>
                    setForm({ ...form, original_amount: e.target.value })
                  }
                  placeholder="12000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Saldo actual</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={form.remaining_balance}
                  onChange={(e) =>
                    setForm({ ...form, remaining_balance: e.target.value })
                  }
                  placeholder="8500"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cuota mensual</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={form.monthly_payment}
                  onChange={(e) =>
                    setForm({ ...form, monthly_payment: e.target.value })
                  }
                  placeholder="250"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Día de pago</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="28"
                  value={form.payment_day}
                  onChange={(e) =>
                    setForm({ ...form, payment_day: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoría del gasto</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => v && setForm({ ...form, category_id: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegir categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Método de pago habitual</Label>
              <Select
                value={form.payment_method_id}
                onValueChange={(v) =>
                  v && setForm({ ...form, payment_method_id: v })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegir método" />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
            {editing && (
              <Button
                variant="outline"
                className="w-full text-destructive"
                onClick={async () => {
                  await deleteDebt(editing.id);
                  toast.success("Deuda eliminada");
                  setOpen(false);
                }}
              >
                Eliminar deuda
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* ============ CUOTAS TASA CERO ============ */

function InstallmentsSection({
  plans,
  categories,
  methods,
  month,
}: {
  plans: PlanWithPayments[];
  categories: Category[];
  methods: PaymentMethod[];
  month: string;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"new" | "started">("new");
  const [form, setForm] = useState({
    description: "",
    total_amount: "",
    months: "",
    first_month: addMonths(month, 1),
    paid_installments: "0",
    next_month: month,
    payment_method_id: "",
    category_id: "",
  });
  const [saving, setSaving] = useState(false);

  const activePlans = plans.filter((p) =>
    p.installment_payments.some((pay) => pay.status === "pending")
  );
  const donePlans = plans.filter(
    (p) =>
      p.installment_payments.length > 0 &&
      p.installment_payments.every((pay) => pay.status === "paid")
  );

  function openCreate() {
    setMode("new");
    const cuotasCat = categories.find((c) => c.name === "Cuotas de tarjeta");
    setForm({
      description: "",
      total_amount: "",
      months: "",
      first_month: addMonths(month, 1),
      paid_installments: "0",
      next_month: month,
      payment_method_id: methods.find((m) => m.type === "credit")?.id ?? "",
      category_id: cuotasCat?.id ?? "",
    });
    setOpen(true);
  }

  const derived = useMemo(() => {
    const total = Number(form.total_amount) || 0;
    const n = Number(form.months) || 0;
    const paid = mode === "started" ? Number(form.paid_installments) || 0 : 0;
    const monthly = n > 0 ? round2(Math.floor((total / n) * 100) / 100) : 0;
    const firstMonth =
      mode === "started"
        ? addMonths(form.next_month, -paid)
        : form.first_month;
    const remaining = round2(total - monthly * paid);
    return { total, n, paid, monthly, firstMonth, remaining };
  }, [form, mode]);

  async function handleSave() {
    if (!form.description.trim() || derived.total <= 0 || derived.n < 1) {
      toast.error("Completá descripción, monto total y número de cuotas.");
      return;
    }
    if (mode === "started" && derived.paid >= derived.n) {
      toast.error("Las cuotas pagadas deben ser menos que el total.");
      return;
    }
    setSaving(true);
    try {
      await createInstallmentPlan({
        description: form.description.trim(),
        total_amount: derived.total,
        months: derived.n,
        first_month: derived.firstMonth,
        paid_installments: derived.paid,
        payment_method_id: form.payment_method_id || null,
        category_id: form.category_id || null,
      });
      toast.success("Plan de cuotas creado ✅");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear el plan.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePayInstallment(paymentId: string, desc: string) {
    try {
      await payInstallment(paymentId);
      toast.success(`Cuota de ${desc} registrada ✅`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar.");
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CreditCard className="size-5" /> Cuotas tasa cero
        </h2>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="size-4" /> Agregar
        </Button>
      </div>

      {activePlans.length === 0 && donePlans.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Sin cuotas activas. Registrá tus compras a tasa cero — incluso las que
          ya venís pagando desde hace meses. 💳
        </p>
      )}

      {activePlans.map((plan) => {
        const payments = [...plan.installment_payments].sort(
          (a, b) => a.number - b.number
        );
        const paidCount = payments.filter((p) => p.status === "paid").length;
        const remaining = payments
          .filter((p) => p.status === "pending")
          .reduce((s, p) => s + Number(p.amount), 0);
        const dueNow = payments.find(
          (p) => p.status === "pending" && p.due_month <= month
        );
        const pct = (paidCount / plan.months) * 100;
        return (
          <div key={plan.id} className="rounded-xl border p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-medium">{plan.description}</p>
              <p className="text-sm tabular-nums text-muted-foreground">
                {formatMoney(Number(plan.monthly_amount))}/mes
              </p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {paidCount} de {plan.months} pagadas · restan{" "}
              <span className="font-semibold text-foreground">
                {formatMoney(remaining)}
              </span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
            {dueNow ? (
              <Button
                size="sm"
                className="mt-3 w-full"
                onClick={() => handlePayInstallment(dueNow.id, plan.description)}
              >
                Registrar cuota {dueNow.number} ({formatMonth(dueNow.due_month)}) ·{" "}
                {formatMoney(Number(dueNow.amount))}
              </Button>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Próxima cuota:{" "}
                {formatMonth(
                  payments.find((p) => p.status === "pending")?.due_month ?? month
                )}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 w-full text-muted-foreground"
              onClick={async () => {
                if (!confirm(`¿Eliminar el plan "${plan.description}" y sus cuotas?`)) return;
                await deleteInstallmentPlan(plan.id);
                toast.success("Plan eliminado");
              }}
            >
              Eliminar plan
            </Button>
          </div>
        );
      })}

      {donePlans.map((plan) => (
        <div
          key={plan.id}
          className="flex items-center justify-between rounded-xl border border-dashed p-3 opacity-70"
        >
          <p className="text-sm">
            {plan.description} ·{" "}
            <span className="text-green-600">¡Completada! 🎉</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={async () => {
              await deleteInstallmentPlan(plan.id);
              toast.success("Plan eliminado");
            }}
          >
            Quitar
          </Button>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva cuota tasa cero</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode("new")}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  mode === "new" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                Compra nueva
              </button>
              <button
                type="button"
                onClick={() => setMode("started")}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  mode === "started" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                Ya la vengo pagando
              </button>
            </div>

            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Llantas nuevas"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monto total</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={form.total_amount}
                  onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
                  placeholder="300"
                />
              </div>
              <div className="space-y-1.5">
                <Label>N° de cuotas</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="72"
                  value={form.months}
                  onChange={(e) => setForm({ ...form, months: e.target.value })}
                  placeholder="12"
                />
              </div>
            </div>

            {mode === "new" ? (
              <div className="space-y-1.5">
                <Label>Mes de la primera cuota</Label>
                <Input
                  type="month"
                  value={form.first_month}
                  onChange={(e) => setForm({ ...form, first_month: e.target.value })}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cuotas ya pagadas</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form.paid_installments}
                    onChange={(e) =>
                      setForm({ ...form, paid_installments: e.target.value })
                    }
                    placeholder="7"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Mes de tu próxima cuota</Label>
                  <Input
                    type="month"
                    value={form.next_month}
                    onChange={(e) => setForm({ ...form, next_month: e.target.value })}
                  />
                </div>
              </div>
            )}

            {derived.total > 0 && derived.n > 0 && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p>
                  Cuota mensual: <strong>{formatMoney(derived.monthly)}</strong>
                </p>
                {mode === "started" && derived.paid > 0 && derived.paid < derived.n && (
                  <p className="text-muted-foreground">
                    Te quedan {derived.n - derived.paid} cuotas ·{" "}
                    {formatMoney(derived.remaining)} por pagar
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Tarjeta</Label>
              <Select
                value={form.payment_method_id}
                onValueChange={(v) => v && setForm({ ...form, payment_method_id: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegir tarjeta" />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => v && setForm({ ...form, category_id: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegir categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Creando…" : "Crear plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
