"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Category } from "@/lib/types";
import {
  archiveCategory,
  createCategory,
  updateCategory,
} from "@/lib/actions/categories";
import { CategoryIcon } from "@/components/category-icon";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

const COLORS = [
  "#22c55e", "#10b981", "#f97316", "#f59e0b", "#ef4444", "#dc2626", "#84cc16",
  "#eab308", "#a855f7", "#ec4899", "#06b6d4", "#3b82f6", "#f43f5e", "#14b8a6",
  "#64748b",
];

const ICONS = [
  "banknote", "coins", "fuel", "car", "landmark", "credit-card", "shopping-cart",
  "utensils", "popcorn", "heart-pulse", "shirt", "house", "gift", "piggy-bank",
  "gamepad-2", "plane", "graduation-cap", "smartphone", "dumbbell", "paw-print",
  "music", "circle",
];

type FormState = {
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  needs_bucket: "need" | "want" | "saving" | "none";
};

const emptyForm: FormState = {
  name: "",
  type: "expense",
  icon: "circle",
  color: COLORS[0],
  needs_bucket: "want",
};

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [tab, setTab] = useState<"expense" | "income">("expense");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const visible = categories.filter((c) => c.type === tab && !c.is_archived);
  const archived = categories.filter((c) => c.type === tab && c.is_archived);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, type: tab });
    setOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setForm({
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
      needs_bucket: c.needs_bucket ?? "none",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Ponele un nombre a la categoría.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      icon: form.icon,
      color: form.color,
      needs_bucket:
        form.type === "income" || form.needs_bucket === "none"
          ? null
          : form.needs_bucket,
    };
    try {
      if (editing) {
        await updateCategory(editing.id, payload);
        toast.success("Categoría actualizada ✅");
      } else {
        await createCategory(payload);
        toast.success("Categoría creada ✅");
      }
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" /> Nueva
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar categoría" : "Nueva categoría"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Mascotas"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as FormState["type"] })
                  }
                  disabled={!!editing}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Gasto</SelectItem>
                    <SelectItem value="income">Ingreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.type === "expense" && (
                <div className="space-y-1.5">
                  <Label>¿Qué tipo de gasto es?</Label>
                  <Select
                    value={form.needs_bucket}
                    onValueChange={(v) =>
                      setForm({ ...form, needs_bucket: v as FormState["needs_bucket"] })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="need">Necesidad</SelectItem>
                      <SelectItem value="want">Gusto</SelectItem>
                      <SelectItem value="saving">Ahorro</SelectItem>
                      <SelectItem value="none">Sin clasificar</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Sirve para el análisis 50/30/20 de tus gastos.
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Icono</Label>
                <div className="grid grid-cols-8 gap-1.5">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`flex size-9 items-center justify-center rounded-lg border ${
                        form.icon === icon
                          ? "border-primary bg-primary/10"
                          : "border-border"
                      }`}
                    >
                      <CategoryIcon name={icon} className="size-4" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
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
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear"}
              </Button>
              {editing && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    await archiveCategory(editing.id, !editing.is_archived);
                    toast.success(
                      editing.is_archived ? "Categoría restaurada" : "Categoría archivada"
                    );
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

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="w-full">
          <TabsTrigger value="expense" className="flex-1">
            Gastos
          </TabsTrigger>
          <TabsTrigger value="income" className="flex-1">
            Ingresos
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-2">
        {visible.map((c) => (
          <button
            key={c.id}
            onClick={() => openEdit(c)}
            className="flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors hover:bg-accent"
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: c.color }}
            >
              <CategoryIcon name={c.icon} className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{c.name}</p>
              {c.needs_bucket && (
                <p className="text-xs text-muted-foreground">
                  {c.needs_bucket === "need"
                    ? "Necesidad"
                    : c.needs_bucket === "want"
                      ? "Gusto"
                      : "Ahorro"}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {archived.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Archivadas</h2>
          <div className="grid grid-cols-2 gap-2">
            {archived.map((c) => (
              <button
                key={c.id}
                onClick={() => openEdit(c)}
                className="flex items-center gap-2.5 rounded-xl border border-dashed p-3 text-left opacity-60"
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: c.color }}
                >
                  <CategoryIcon name={c.icon} className="size-4" />
                </div>
                <p className="truncate text-sm">{c.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
