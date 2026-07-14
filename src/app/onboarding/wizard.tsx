"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProfile, completeOnboarding } from "@/lib/actions/profile";
import { registerInitialBalance } from "@/lib/actions/transactions";
import { createPaymentMethod } from "@/lib/actions/payment-methods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Plus, Trash2, Wallet } from "lucide-react";

const CARD_COLORS = [
  "#6366f1", "#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#a855f7", "#f43f5e", "#64748b",
];

type DraftCard = {
  name: string;
  last4: string;
  has_wallet: boolean;
  cut_day: string;
  payment_due_day: string;
  color: string;
};

const emptyCard = (i: number): DraftCard => ({
  name: "",
  last4: "",
  has_wallet: false,
  cut_day: "",
  payment_due_day: "",
  color: CARD_COLORS[i % CARD_COLORS.length],
});

export function OnboardingWizard({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Paso 1
  const [name, setName] = useState(initialName);
  const [income, setIncome] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  // Paso 2
  const [frequency, setFrequency] = useState<"monthly" | "biweekly">("monthly");
  const [payDay1, setPayDay1] = useState("");
  const [payDay2, setPayDay2] = useState("");
  // Paso 3
  const [cards, setCards] = useState<DraftCard[]>([emptyCard(0)]);

  function updateCard(i: number, patch: Partial<DraftCard>) {
    setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  async function finish(skip = false) {
    setSaving(true);
    try {
      if (!skip) {
        await updateProfile({
          display_name: name || "Yo",
          monthly_income_estimate: Number(income) || 0,
          pay_frequency: frequency,
          pay_day_1: payDay1 ? Number(payDay1) : null,
          pay_day_2: frequency === "biweekly" && payDay2 ? Number(payDay2) : null,
        });
        if (Number(currentBalance) > 0) {
          await registerInitialBalance(Number(currentBalance));
        }
        for (const card of cards.filter((c) => c.name.trim())) {
          await createPaymentMethod({
            name: card.name.trim(),
            type: "credit",
            last4: card.last4 || null,
            color: card.color,
            has_wallet: card.has_wallet,
            cut_day: card.cut_day ? Number(card.cut_day) : null,
            payment_due_day: card.payment_due_day ? Number(card.payment_due_day) : null,
            credit_limit: null,
          });
        }
      }
      await completeOnboarding();
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Algo salió mal. Intentá de nuevo.");
      setSaving(false);
    }
  }

  const steps = ["Sobre vos", "Tu pago", "Tus tarjetas"];

  return (
    <main className="mx-auto flex min-h-safe w-full max-w-md flex-col px-6 pb-5 pt-2">
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Paso {step + 1} de {steps.length} · {steps[step]}
        </p>
      </div>

      {step === 0 && (
        <div className="flex flex-1 flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold">¡Hola! 👋</h1>
            <p className="mt-1 text-muted-foreground">
              Contanos un poco de vos para personalizar la app.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-name">¿Cómo te llamás?</Label>
            <Input
              id="ob-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-income">¿Cuánto ingresás al mes? (USD)</Label>
            <Input
              id="ob-income"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="1000.00"
            />
            <p className="text-xs text-muted-foreground">
              Tu sueldo aproximado. Lo usamos para proyecciones y consejos —
              el disponible solo cuenta plata que registrés de verdad.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-balance">
              ¿Cuánto tenés disponible HOY? (cuenta + efectivo)
            </Label>
            <Input
              id="ob-balance"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={currentBalance}
              onChange={(e) => setCurrentBalance(e.target.value)}
              placeholder="250.00"
            />
            <p className="text-xs text-muted-foreground">
              Se registra como &quot;Saldo inicial&quot; para que tu disponible
              arranque con tu realidad, no con supuestos.
            </p>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold">¿Cómo recibís tu pago? 💵</h1>
            <p className="mt-1 text-muted-foreground">
              Así sabremos cuándo entra tu dinero.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFrequency("monthly")}
              className={`rounded-xl border p-4 text-left transition-colors ${
                frequency === "monthly" ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <p className="font-semibold">Mensual</p>
              <p className="text-xs text-muted-foreground">Un pago al mes</p>
            </button>
            <button
              type="button"
              onClick={() => setFrequency("biweekly")}
              className={`rounded-xl border p-4 text-left transition-colors ${
                frequency === "biweekly" ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <p className="font-semibold">Quincenal</p>
              <p className="text-xs text-muted-foreground">Dos pagos al mes</p>
            </button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-day1">
              {frequency === "monthly" ? "¿Qué día te pagan?" : "¿Qué día es la primera quincena?"}
            </Label>
            <Input
              id="ob-day1"
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              value={payDay1}
              onChange={(e) => setPayDay1(e.target.value)}
              placeholder={frequency === "monthly" ? "30" : "15"}
            />
          </div>
          {frequency === "biweekly" && (
            <div className="space-y-2">
              <Label htmlFor="ob-day2">¿Y la segunda?</Label>
              <Input
                id="ob-day2"
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                value={payDay2}
                onChange={(e) => setPayDay2(e.target.value)}
                placeholder="30"
              />
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col gap-5">
          <div>
            <h1 className="text-2xl font-bold">Tus tarjetas 💳</h1>
            <p className="mt-1 text-muted-foreground">
              Agregá tus tarjetas de crédito. Ya creamos &quot;Efectivo&quot; por vos.
            </p>
          </div>

          {cards.map((card, i) => (
            <Card key={i}>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="size-4" style={{ color: card.color }} />
                    Tarjeta {i + 1}
                  </div>
                  {cards.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCards((p) => p.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Nombre</Label>
                    <Input
                      value={card.name}
                      onChange={(e) => updateCard(i, { name: e.target.value })}
                      placeholder="Visa BAC"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Últimos 4 dígitos</Label>
                    <Input
                      inputMode="numeric"
                      maxLength={4}
                      value={card.last4}
                      onChange={(e) =>
                        updateCard(i, { last4: e.target.value.replace(/\D/g, "") })
                      }
                      placeholder="1234"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {CARD_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateCard(i, { color: c })}
                          className={`size-6 rounded-full border-2 ${
                            card.color === c ? "border-foreground" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Día de corte</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="28"
                      value={card.cut_day}
                      onChange={(e) => updateCard(i, { cut_day: e.target.value })}
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
                      value={card.payment_due_day}
                      onChange={(e) => updateCard(i, { payment_due_day: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Está en Apple Pay</p>
                        <p className="text-xs text-muted-foreground">
                          Podrás registrar sus pagos automáticamente
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={card.has_wallet}
                      onCheckedChange={(v) => updateCard(i, { has_wallet: v })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            onClick={() => setCards((p) => [...p, emptyCard(p.length)])}
          >
            <Plus className="size-4" /> Agregar otra tarjeta
          </Button>
        </div>
      )}

      <div className="mt-6 space-y-2">
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)} disabled={saving}>
              Atrás
            </Button>
          )}
          {step < 2 ? (
            <Button className="flex-1" onClick={() => setStep(step + 1)}>
              Continuar
            </Button>
          ) : (
            <Button className="flex-1" onClick={() => finish()} disabled={saving}>
              {saving ? "Guardando…" : "¡Listo, empezar! 🚀"}
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => finish(true)}
          disabled={saving}
        >
          Omitir por ahora
        </Button>
      </div>
    </main>
  );
}
