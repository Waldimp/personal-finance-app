"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Category } from "@/lib/types";
import type { ApiTokenRow, MerchantRuleRow } from "./page";
import {
  createApiToken,
  createMerchantRule,
  deleteMerchantRule,
  revokeApiToken,
} from "@/lib/actions/api-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, KeyRound, Plus, Smartphone, Trash2 } from "lucide-react";

export function TokenManager({
  tokens,
  rules,
  categories,
}: {
  tokens: ApiTokenRow[];
  rules: MerchantRuleRow[];
  categories: Category[];
}) {
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [ruleCategory, setRuleCategory] = useState("");

  async function handleCreate() {
    setCreating(true);
    try {
      const token = await createApiToken("iPhone Shortcut");
      setFreshToken(token);
    } catch {
      toast.error("No se pudo crear el token.");
    } finally {
      setCreating(false);
    }
  }

  async function copyToken() {
    if (!freshToken) return;
    await navigator.clipboard.writeText(freshToken);
    toast.success("Token copiado 📋");
  }

  async function handleAddRule() {
    if (!keyword.trim() || !ruleCategory) {
      toast.error("Completá la palabra clave y la categoría.");
      return;
    }
    try {
      await createMerchantRule({ keyword, category_id: ruleCategory });
      toast.success("Regla creada ✅");
      setKeyword("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear.");
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Smartphone className="size-6" /> Apple Pay automático
      </h1>
      <p className="text-sm text-muted-foreground">
        Cada vez que pagués con Apple Pay, tu iPhone puede mandar el gasto aquí
        automáticamente usando un Atajo. Generá tu token y seguí la guía.
      </p>

      {/* Token */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4" /> Tu token
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {freshToken && (
            <div className="space-y-2 rounded-xl border border-green-300 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/40">
              <p className="text-xs font-medium text-green-700 dark:text-green-400">
                ⚠️ Copialo AHORA — no se vuelve a mostrar:
              </p>
              <code className="block break-all rounded bg-background p-2 text-xs">
                {freshToken}
              </code>
              <Button size="sm" className="w-full" onClick={copyToken}>
                <Copy className="size-4" /> Copiar token
              </Button>
            </div>
          )}
          {tokens.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl border p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.token_prefix}… ·{" "}
                  {t.last_used_at
                    ? `usado ${new Date(t.last_used_at).toLocaleDateString("es")}`
                    : "nunca usado"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await revokeApiToken(t.id);
                  toast.success("Token revocado");
                }}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCreate}
            disabled={creating}
          >
            <Plus className="size-4" />
            {creating ? "Generando…" : "Generar nuevo token"}
          </Button>
        </CardContent>
      </Card>

      {/* Guía del Atajo */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">📱 Configurar el Atajo (una vez)</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Abrí la app <strong className="text-foreground">Atajos</strong> en tu
              iPhone → pestaña <strong className="text-foreground">Automatización</strong> →{" "}
              <strong className="text-foreground">Nueva automatización</strong>.
            </li>
            <li>
              Elegí el disparador{" "}
              <strong className="text-foreground">Transacción</strong> (aparece con el
              logo de Wallet). Seleccioná tu tarjeta, marcá{" "}
              <strong className="text-foreground">Ejecutar inmediatamente</strong>.
            </li>
            <li>
              Agregá la acción{" "}
              <strong className="text-foreground">Obtener contenido de URL</strong> con:
              <div className="mt-1 rounded-lg bg-muted p-2 font-mono text-xs text-foreground">
                URL: https://TU-APP.vercel.app/api/shortcuts/transaction
                <br />
                Método: POST · Tipo: JSON
                <br />
                Encabezado → Authorization: Bearer TU_TOKEN
              </div>
            </li>
            <li>
              En el cuerpo JSON agregá 3 campos usando las variables mágicas del
              disparador:
              <div className="mt-1 rounded-lg bg-muted p-2 font-mono text-xs text-foreground">
                amount → variable &quot;Importe&quot;
                <br />
                merchant → variable &quot;Comercio&quot;
                <br />
                card → variable &quot;Tarjeta&quot;
              </div>
            </li>
            <li>
              Listo 🎉 Cada pago con Apple Pay se registra solo. Si el comercio no
              tiene regla, cae en{" "}
              <strong className="text-foreground">Sin categorizar</strong> y lo
              clasificás con un tap desde el inicio.
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Reglas de comercio */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Reglas de comercio → categoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Si el nombre del comercio contiene la palabra clave, el gasto se
            categoriza solo. Ej: &quot;texaco&quot; → Gasolina.
          </p>
          <div className="flex gap-2">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="texaco"
              className="flex-1"
            />
            <Select
              value={ruleCategory}
              items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
              onValueChange={(v) => v && setRuleCategory(v)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" onClick={handleAddRule}>
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="space-y-1.5">
            {rules.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <code className="text-xs">{r.keyword}</code>
                <span className="text-muted-foreground">→</span>
                <span
                  className="flex items-center gap-1.5"
                  style={{ color: r.categories?.color }}
                >
                  ● <span className="text-foreground">{r.categories?.name}</span>
                </span>
                <button
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    await deleteMerchantRule(r.id);
                    toast.success("Regla eliminada");
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
