"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Category, TransactionWithRefs } from "@/lib/types";
import { categorizeTransaction } from "@/lib/actions/api-tokens";
import { formatDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { CategoryIcon } from "@/components/category-icon";
import { Switch } from "@/components/ui/switch";
import { Inbox } from "lucide-react";

export function InboxList({
  transactions,
  categories,
}: {
  transactions: TransactionWithRefs[];
  categories: Category[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [createRule, setCreateRule] = useState(true);

  async function handleAssign(tx: TransactionWithRefs, categoryId: string) {
    setBusy(tx.id);
    try {
      await categorizeTransaction(
        tx.id,
        categoryId,
        createRule && tx.source === "shortcut" ? tx.description : undefined
      );
      const cat = categories.find((c) => c.id === categoryId);
      toast.success(
        `Clasificado como ${cat?.name}${
          createRule && tx.source === "shortcut"
            ? ` — regla creada para "${tx.description}" 🧠`
            : ""
        }`
      );
    } catch {
      toast.error("No se pudo clasificar.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Inbox className="size-6" /> Sin categorizar
      </h1>

      {transactions.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-3xl">✨</p>
          <p className="mt-2 text-sm text-muted-foreground">
            ¡Inbox limpio! Todos tus movimientos tienen categoría.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-sm font-medium">Aprender del comercio</p>
              <p className="text-xs text-muted-foreground">
                Crear regla automática al clasificar pagos de Apple Pay
              </p>
            </div>
            <Switch checked={createRule} onCheckedChange={setCreateRule} />
          </div>

          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className={`rounded-xl border p-4 transition-opacity ${
                  busy === tx.id ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-medium">
                    {tx.description || "(sin descripción)"}
                  </p>
                  <p className="font-semibold tabular-nums">
                    {formatMoney(Number(tx.amount))}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDay(tx.tx_date)}
                  {tx.payment_methods && ` · ${tx.payment_methods.name}`}
                  {tx.source === "shortcut" && " ·  Apple Pay"}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={busy !== null}
                      onClick={() => handleAssign(tx, c.id)}
                      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-accent active:scale-95"
                    >
                      <CategoryIcon name={c.icon} className="size-3" />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
