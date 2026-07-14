"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { PaymentMethod } from "@/lib/types";
import {
  archivePaymentMethod,
  createPaymentMethod,
  updatePaymentMethod,
} from "@/lib/actions/payment-methods";
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
import { Badge } from "@/components/ui/badge";
import { Banknote, CreditCard, Plus, Wallet } from "lucide-react";

const CARD_COLORS = [
  "#6366f1", "#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#a855f7", "#f43f5e", "#64748b",
];

type FormState = {
  name: string;
  type: "credit" | "debit" | "cash";
  last4: string;
  color: string;
  has_wallet: boolean;
  cut_day: string;
  payment_due_day: string;
  credit_limit: string;
};

const emptyForm: FormState = {
  name: "",
  type: "credit",
  last4: "",
  color: CARD_COLORS[0],
  has_wallet: false,
  cut_day: "",
  payment_due_day: "",
  credit_limit: "",
};

export function CardsManager({ methods }: { methods: PaymentMethod[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const active = methods.filter((m) => !m.is_archived);
  const archived = methods.filter((m) => m.is_archived);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(m: PaymentMethod) {
    setEditing(m);
    setForm({
      name: m.name,
      type: m.type,
      last4: m.last4 ?? "",
      color: m.color,
      has_wallet: m.has_wallet,
      cut_day: m.cut_day?.toString() ?? "",
      payment_due_day: m.payment_due_day?.toString() ?? "",
      credit_limit: m.credit_limit?.toString() ?? "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Ponele un nombre a la tarjeta.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      last4: form.type === "cash" ? null : form.last4 || null,
      color: form.color,
      has_wallet: form.type === "credit" ? form.has_wallet : false,
      cut_day: form.type === "credit" && form.cut_day ? Number(form.cut_day) : null,
      payment_due_day:
        form.type === "credit" && form.payment_due_day
          ? Number(form.payment_due_day)
          : null,
      credit_limit:
        form.type === "credit" && form.credit_limit
          ? Number(form.credit_limit)
          : null,
    };
    try {
      if (editing) {
        await updatePaymentMethod(editing.id, payload);
        toast.success("Tarjeta actualizada ✅");
      } else {
        await createPaymentMethod(payload);
        toast.success("Tarjeta agregada ✅");
      }
      setOpen(false);
    } catch {
      toast.error("No se pudo guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(m: PaymentMethod) {
    try {
      await archivePaymentMethod(m.id, !m.is_archived);
      toast.success(m.is_archived ? "Método restaurado" : "Método archivado");
    } catch {
      toast.error("No se pudo actualizar.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarjetas</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" /> Agregar
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar método de pago" : "Nuevo método de pago"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  items={{
                    credit: "Tarjeta de crédito",
                    debit: "Tarjeta de débito",
                    cash: "Efectivo",
                  }}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as FormState["type"] })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Tarjeta de crédito</SelectItem>
                    <SelectItem value="debit">Tarjeta de débito</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Visa BAC"
                />
              </div>
              {form.type !== "cash" && (
                <div className="space-y-1.5">
                  <Label>Últimos 4 dígitos (opcional)</Label>
                  <Input
                    inputMode="numeric"
                    maxLength={4}
                    value={form.last4}
                    onChange={(e) =>
                      setForm({ ...form, last4: e.target.value.replace(/\D/g, "") })
                    }
                    placeholder="1234"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`size-7 rounded-full border-2 ${
                        form.color === c ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              {form.type === "credit" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Día de corte</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="28"
                        value={form.cut_day}
                        onChange={(e) => setForm({ ...form, cut_day: e.target.value })}
                        placeholder="15"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Día límite de pago</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="31"
                        value={form.payment_due_day}
                        onChange={(e) =>
                          setForm({ ...form, payment_due_day: e.target.value })
                        }
                        placeholder="30"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Límite de crédito (opcional)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={form.credit_limit}
                      onChange={(e) =>
                        setForm({ ...form, credit_limit: e.target.value })
                      }
                      placeholder="1500.00"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="size-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Está en Apple Pay</p>
                    </div>
                    <Switch
                      checked={form.has_wallet}
                      onCheckedChange={(v) => setForm({ ...form, has_wallet: v })}
                    />
                  </div>
                </>
              )}
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : editing ? "Guardar cambios" : "Agregar"}
              </Button>
              {editing && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    handleArchive(editing);
                    setOpen(false);
                  }}
                >
                  {editing.is_archived ? "Restaurar" : "Archivar"}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {active.map((m) => (
          <button
            key={m.id}
            onClick={() => openEdit(m)}
            className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-accent"
          >
            <div
              className="flex size-10 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: m.color }}
            >
              {m.type === "cash" ? (
                <Banknote className="size-5" />
              ) : (
                <CreditCard className="size-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {m.name}
                {m.last4 && (
                  <span className="ml-1.5 text-sm text-muted-foreground">
                    •••• {m.last4}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {m.type === "credit"
                  ? `Crédito${m.cut_day ? ` · corte día ${m.cut_day}` : ""}`
                  : m.type === "debit"
                    ? "Débito"
                    : "Efectivo"}
              </p>
            </div>
            {m.has_wallet && (
              <Badge variant="secondary" className="gap-1">
                <Wallet className="size-3" /> Apple Pay
              </Badge>
            )}
          </button>
        ))}
        {active.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tenés métodos de pago. Agregá tu primera tarjeta. 💳
          </p>
        )}
      </div>

      {archived.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Archivados</h2>
          {archived.map((m) => (
            <button
              key={m.id}
              onClick={() => openEdit(m)}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed p-3 text-left opacity-60"
            >
              <div
                className="flex size-8 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: m.color }}
              >
                <CreditCard className="size-4" />
              </div>
              <p className="text-sm">{m.name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
