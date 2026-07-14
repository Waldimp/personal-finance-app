"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, PaymentMethod, TransactionWithRefs } from "@/lib/types";
import { addMonths, currentMonth, formatDay, formatMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { CategoryIcon } from "@/components/category-icon";
import { TransactionForm } from "@/components/transaction-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  transactions: TransactionWithRefs[];
  categories: Category[];
  methods: PaymentMethod[];
  month: string;
  categoryFilter: string;
  methodFilter: string;
};

export function TransactionsList({
  transactions,
  categories,
  methods,
  month,
  categoryFilter,
  methodFilter,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<TransactionWithRefs | null>(null);

  function navigate(patch: Record<string, string>) {
    const params = new URLSearchParams({
      mes: month,
      ...(categoryFilter && { categoria: categoryFilter }),
      ...(methodFilter && { tarjeta: methodFilter }),
      ...patch,
    });
    for (const [k, v] of [...params.entries()]) {
      if (!v || v === "all") params.delete(k);
    }
    router.push(`/transacciones?${params.toString()}`);
  }

  const groups = useMemo(() => {
    const byDay = new Map<string, TransactionWithRefs[]>();
    for (const tx of transactions) {
      const list = byDay.get(tx.tx_date) ?? [];
      list.push(tx);
      byDay.set(tx.tx_date, list);
    }
    return [...byDay.entries()];
  }, [transactions]);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-4">
      {/* Selector de mes */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ mes: addMonths(month, -1) })}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-bold">{formatMonth(month)}</h1>
        <Button
          variant="ghost"
          size="icon"
          disabled={month >= currentMonth()}
          onClick={() => navigate({ mes: addMonths(month, 1) })}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {/* Totales del mes filtrado */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">Gastos</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-500">
            {formatMoney(totalExpense)}
          </p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">Ingresos</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-500">
            {formatMoney(totalIncome)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={categoryFilter || "all"}
          items={{
            all: "Todas las categorías",
            ...Object.fromEntries(
              categories.filter((c) => !c.is_archived).map((c) => [c.id, c.name])
            ),
          }}
          onValueChange={(v) => navigate({ categoria: v ?? "all" })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories
              .filter((c) => !c.is_archived)
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select
          value={methodFilter || "all"}
          items={{
            all: "Todos los métodos",
            ...Object.fromEntries(
              methods.filter((m) => !m.is_archived).map((m) => [m.id, m.name])
            ),
          }}
          onValueChange={(v) => navigate({ tarjeta: v ?? "all" })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los métodos</SelectItem>
            {methods
              .filter((m) => !m.is_archived)
              .map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista agrupada por día */}
      {groups.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-3xl">🍃</p>
          <p className="mt-2 text-sm text-muted-foreground">
            No hay movimientos este mes.
            <br />
            Tocá el botón + para registrar el primero.
          </p>
        </div>
      )}

      {groups.map(([day, txs]) => (
        <div key={day} className="space-y-1.5">
          <p className="pt-1 text-xs font-medium uppercase text-muted-foreground">
            {formatDay(day)}
          </p>
          {txs.map((tx) => (
            <button
              key={tx.id}
              onClick={() => setEditing(tx)}
              className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent"
            >
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
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
                  {tx.description && (
                    <span className="text-muted-foreground"> · {tx.description}</span>
                  )}
                </p>
                {tx.payment_methods && (
                  <p className="text-xs text-muted-foreground">
                    {tx.payment_methods.name}
                  </p>
                )}
              </div>
              <p
                className={`shrink-0 text-sm font-semibold tabular-nums ${
                  tx.type === "income"
                    ? "text-green-600 dark:text-green-500"
                    : ""
                }`}
              >
                {tx.type === "income" ? "+" : "−"}
                {formatMoney(Number(tx.amount))}
              </p>
            </button>
          ))}
        </div>
      ))}

      {/* Sheet de edición */}
      <Sheet open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader className="pb-0">
            <SheetTitle>Editar movimiento</SheetTitle>
          </SheetHeader>
          {editing && (
            <TransactionForm
              categories={categories}
              methods={methods}
              transaction={editing}
              onDone={() => setEditing(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
