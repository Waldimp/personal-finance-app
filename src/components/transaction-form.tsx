"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import type { Category, PaymentMethod, TransactionWithRefs } from "@/lib/types";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/lib/actions/transactions";
import { todayLocal } from "@/lib/dates";
import { celebrate } from "@/components/celebration";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Delete } from "lucide-react";

type Props = {
  categories: Category[];
  methods: PaymentMethod[];
};

/** Sheet de captura rápida. Se abre con ?nuevo=1 (botón "+" del tab bar). */
function QuickAdd({ categories, methods }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = searchParams.get("nuevo") === "1";

  function close() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("nuevo");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && close()}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-0">
          <SheetTitle>Nuevo movimiento</SheetTitle>
        </SheetHeader>
        {open && (
          <TransactionForm
            categories={categories}
            methods={methods}
            onDone={close}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

export function QuickAddSheet(props: Props) {
  return (
    <Suspense>
      <QuickAdd {...props} />
    </Suspense>
  );
}

export function TransactionForm({
  categories,
  methods,
  transaction,
  onDone,
}: Props & {
  transaction?: TransactionWithRefs;
  onDone: () => void;
}) {
  const isEdit = !!transaction;
  const [type, setType] = useState<"expense" | "income">(
    transaction?.type ?? "expense"
  );
  const [amountStr, setAmountStr] = useState(
    transaction ? String(transaction.amount) : ""
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    transaction?.category_id ?? null
  );
  const [methodId, setMethodId] = useState<string | null>(
    transaction?.payment_method_id ?? null
  );
  const [date, setDate] = useState(transaction?.tx_date ?? todayLocal());
  const [description, setDescription] = useState(
    transaction?.description ?? ""
  );
  const [saving, setSaving] = useState(false);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.type === type && !c.is_archived),
    [categories, type]
  );
  const activeMethods = useMemo(
    () => methods.filter((m) => !m.is_archived),
    [methods]
  );

  // Al cambiar el tipo, si la categoría no corresponde, resetearla.
  useEffect(() => {
    if (categoryId && !activeCategories.some((c) => c.id === categoryId)) {
      setCategoryId(null);
    }
  }, [type, categoryId, activeCategories]);

  function pressKey(key: string) {
    setAmountStr((prev) => {
      if (key === "back") return prev.slice(0, -1);
      if (key === ".") {
        if (prev.includes(".")) return prev;
        return prev === "" ? "0." : prev + ".";
      }
      const next = prev + key;
      // máx 2 decimales, máx 7 dígitos enteros
      const [int, dec] = next.split(".");
      if (dec !== undefined && dec.length > 2) return prev;
      if (int.length > 7) return prev;
      return next;
    });
  }

  const amount = parseFloat(amountStr || "0");

  async function handleSave() {
    if (!amount || amount <= 0) {
      toast.error("Ingresá un monto.");
      return;
    }
    setSaving(true);
    const payload = {
      type,
      amount,
      tx_date: date,
      description,
      category_id: categoryId,
      payment_method_id: methodId,
    };
    try {
      if (isEdit) {
        await updateTransaction(transaction.id, payload);
        toast.success("Movimiento actualizado ✅");
      } else {
        await createTransaction(payload);
        if (type === "income") {
          celebrate("income");
        } else if (amount < 15) {
          celebrate("ants"); // gasto hormiga 🐜
        } else {
          celebrate("expense");
        }
        toast.success(
          type === "expense" ? "Gasto registrado ✅" : "Ingreso registrado ✅"
        );
      }
      onDone();
    } catch {
      toast.error("No se pudo guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;
    setSaving(true);
    try {
      await deleteTransaction(transaction.id);
      toast.success("Movimiento eliminado");
      onDone();
    } catch {
      toast.error("No se pudo eliminar.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 px-4 pb-6">
      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`rounded-lg py-2 text-sm font-medium transition-colors ${
            type === "expense" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`rounded-lg py-2 text-sm font-medium transition-colors ${
            type === "income" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Ingreso
        </button>
      </div>

      {/* Monto */}
      <div className="text-center">
        <p
          className={`text-5xl font-bold tabular-nums ${
            type === "expense" ? "text-foreground" : "text-green-600 dark:text-green-500"
          }`}
        >
          ${amountStr || "0"}
        </p>
      </div>

      {/* Teclado numérico */}
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map(
          (key) => (
            <button
              key={key}
              type="button"
              onClick={() => pressKey(key)}
              className="flex h-12 items-center justify-center rounded-xl bg-muted text-xl font-semibold transition-colors active:bg-accent"
            >
              {key === "back" ? <Delete className="size-5" /> : key}
            </button>
          )
        )}
      </div>

      {/* Categorías */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Categoría</p>
        <div className="flex flex-wrap gap-1.5">
          {activeCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                categoryId === c.id
                  ? "border-transparent text-white"
                  : "border-border text-foreground"
              }`}
              style={categoryId === c.id ? { backgroundColor: c.color } : undefined}
            >
              <CategoryIcon name={c.icon} className="size-3.5" />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Método de pago */}
      {type === "expense" && (
        <div className="space-y-2">
          <p className="text-sm font-medium">¿Con qué pagaste?</p>
          <div className="flex flex-wrap gap-1.5">
            {activeMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethodId(methodId === m.id ? null : m.id)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  methodId === m.id
                    ? "border-transparent text-white"
                    : "border-border"
                }`}
                style={methodId === m.id ? { backgroundColor: m.color } : undefined}
              >
                {m.name}
                {m.last4 ? ` ····${m.last4}` : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fecha y nota */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Fecha</p>
          <Input
            type="date"
            value={date}
            max={todayLocal()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">
            Nota <span className="font-normal text-muted-foreground">(opcional)</span>
          </p>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="¿En qué fue? Ej: cine con mi novia 🍿"
            maxLength={120}
            rows={2}
            className="resize-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Button className="h-12 w-full text-base" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar"}
        </Button>
        {isEdit && (
          <Button
            variant="outline"
            className="w-full text-destructive"
            onClick={handleDelete}
            disabled={saving}
          >
            Eliminar movimiento
          </Button>
        )}
      </div>
    </div>
  );
}
