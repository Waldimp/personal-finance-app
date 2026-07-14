"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Category, PaymentMethod, RecurringTransaction } from "@/lib/types";
import {
  createRecurring,
  deleteRecurring,
  toggleRecurring,
  updateRecurring,
} from "@/lib/actions/recurring";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Repeat } from "lucide-react";

type FormState = {
  type: "income" | "expense";
  description: string;
  amount: string;
  day_of_month: string;
  category_id: string;
  payment_method_id: string;
};

export function RecurringManager({
  recurrings,
  categories,
  methods,
}: {
  recurrings: RecurringTransaction[];
  categories: Category[];
  methods: PaymentMethod[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [form, setForm] = useState<FormState>({
    type: "expense",
    description: "",
    amount: "",
    day_of_month: "1",
    category_id: "",
    payment_method_id: "",
  });
  const [saving, setSaving] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === form.type);

  function openCreate() {
    setEditing(null);
    setForm({
      type: "expense",
      description: "",
      amount: "",
      day_of_month: "1",
      category_id: "",
      payment_method_id: "",
    });
    setOpen(true);
  }

  function openEdit(r: RecurringTransaction) {
    setEditing(r);
    setForm({
      type: r.type,
      description: r.description,
      amount: String(r.amount),
      day_of_month: String(r.day_of_month),
      category_id: r.category_id ?? "",
      payment_method_id: r.payment_method_id ?? "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.description.trim() || !form.amount || Number(form.amount) <= 0) {
      toast.error("Completá descripción y monto.");
      return;
    }
    setSaving(true);
    const payload = {
      type: form.type,
      description: form.description.trim(),
      amount: Number(form.amount),
      day_of_month: Number(form.day_of_month || 1),
      category_id: form.category_id || null,
      payment_method_id: form.payment_method_id || null,
    };
    try {
      if (editing) {
        await updateRecurring(editing.id, payload);
        toast.success("Recurrente actualizado ✅");
      } else {
        await createRecurring(payload);
        toast.success("Recurrente creado ✅");
      }
      setOpen(false);
    } catch {
      toast.error("No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recurrentes</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" /> Nuevo
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Movimientos fijos de cada mes: tu salario, suscripciones, servicios.
        Cada mes los confirmás con un tap desde el inicio.
      </p>

      {recurrings.length === 0 && (
        <div className="py-14 text-center">
          <Repeat className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Empezá agregando tu salario como ingreso recurrente. 💵
          </p>
        </div>
      )}

      <div className="space-y-2">
        {recurrings.map((r) => (
          <div
            key={r.id}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              r.is_active ? "" : "opacity-50"
            }`}
          >
            <button onClick={() => openEdit(r)} className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium">{r.description}</p>
              <p className="text-xs text-muted-foreground">
                Día {r.day_of_month} ·{" "}
                {r.type === "income" ? "Ingreso" : "Gasto"}
              </p>
            </button>
            <p
              className={`text-sm font-semibold tabular-nums ${
                r.type === "income"
                  ? "text-green-600 dark:text-green-500"
                  : ""
              }`}
            >
              {r.type === "income" ? "+" : "−"}
              {formatMoney(Number(r.amount))}
            </p>
            <Switch
              checked={r.is_active}
              onCheckedChange={async (v) => {
                await toggleRecurring(r.id, v);
              }}
            />
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar recurrente" : "Nuevo recurrente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "expense", category_id: "" })}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  form.type === "expense"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "income", category_id: "" })}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  form.type === "income"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Ingreso
              </button>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={form.type === "income" ? "Salario" : "Internet"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monto</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Día del mes</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="28"
                  value={form.day_of_month}
                  onChange={(e) => setForm({ ...form, day_of_month: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select
                value={form.category_id}
                items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
                onValueChange={(v) => v && setForm({ ...form, category_id: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegir categoría" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.type === "expense" && (
              <div className="space-y-1.5">
                <Label>Método de pago</Label>
                <Select
                  value={form.payment_method_id}
                  items={Object.fromEntries(methods.map((m) => [m.id, m.name]))}
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
            )}
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
            {editing && (
              <Button
                variant="outline"
                className="w-full text-destructive"
                onClick={async () => {
                  await deleteRecurring(editing.id);
                  toast.success("Recurrente eliminado");
                  setOpen(false);
                }}
              >
                Eliminar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
