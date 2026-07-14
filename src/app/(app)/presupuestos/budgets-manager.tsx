"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { BudgetWithSpent } from "@/lib/queries/budgets";
import type { Category } from "@/lib/types";
import { deleteBudget, upsertBudget } from "@/lib/actions/budgets";
import { formatMoney } from "@/lib/money";
import { CategoryIcon } from "@/components/category-icon";
import { BudgetBar } from "@/components/budget-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus } from "lucide-react";

export function BudgetsManager({
  budgets,
  categories,
}: {
  budgets: BudgetWithSpent[];
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetWithSpent | null>(null);
  const [categoryId, setCategoryId] = useState<string>("");
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const withoutBudget = categories.filter(
    (c) => !budgets.some((b) => b.category_id === c.id)
  );

  function openCreate() {
    setEditing(null);
    setCategoryId(withoutBudget[0]?.id ?? "");
    setLimit("");
    setOpen(true);
  }

  function openEdit(b: BudgetWithSpent) {
    setEditing(b);
    setCategoryId(b.category_id);
    setLimit(String(b.monthly_limit));
    setOpen(true);
  }

  async function handleSave() {
    if (!categoryId || !limit || Number(limit) <= 0) {
      toast.error("Elegí una categoría y un límite válido.");
      return;
    }
    setSaving(true);
    try {
      await upsertBudget({ category_id: categoryId, monthly_limit: Number(limit) });
      toast.success("Presupuesto guardado ✅");
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
        <h1 className="text-2xl font-bold">Presupuestos</h1>
        <Button size="sm" onClick={openCreate} disabled={withoutBudget.length === 0 && !budgets.length}>
          <Plus className="size-4" /> Nuevo
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Límite mensual por categoría. Cada mes se compara tu gasto contra el
        mismo límite.
      </p>

      {budgets.length === 0 && (
        <div className="py-14 text-center">
          <p className="text-3xl">🎯</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sin presupuestos todavía. Poné un límite a tus categorías de gasto
            más peligrosas (Cine y salidas 👀).
          </p>
        </div>
      )}

      <div className="space-y-3">
        {budgets.map((b) => (
          <button
            key={b.id}
            onClick={() => openEdit(b)}
            className="w-full rounded-xl border p-4 text-left transition-colors hover:bg-accent"
          >
            <div className="flex items-center gap-2.5 pb-2">
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: b.categories?.color ?? "#64748b" }}
              >
                <CategoryIcon name={b.categories?.icon ?? "circle"} className="size-4" />
              </div>
              <p className="flex-1 truncate font-medium">
                {b.categories?.name ?? "Categoría"}
              </p>
              <p className="text-sm tabular-nums text-muted-foreground">
                {formatMoney(b.spent)} / {formatMoney(Number(b.monthly_limit))}
              </p>
            </div>
            <BudgetBar pct={b.pct} />
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar presupuesto" : "Nuevo presupuesto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select
                value={categoryId}
                items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
                onValueChange={(v) => v && setCategoryId(v)}
                disabled={!!editing}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegir categoría" />
                </SelectTrigger>
                <SelectContent>
                  {(editing ? categories : withoutBudget).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Límite mensual (USD)</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="1"
                step="0.01"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="100.00"
              />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
            {editing && (
              <Button
                variant="outline"
                className="w-full text-destructive"
                onClick={async () => {
                  await deleteBudget(editing.id);
                  toast.success("Presupuesto eliminado");
                  setOpen(false);
                }}
              >
                Eliminar presupuesto
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
