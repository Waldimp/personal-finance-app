import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "./theme-toggle";
import {
  ChevronRight,
  CreditCard,
  LogOut,
  Tags,
  UserRound,
} from "lucide-react";

export default async function AjustesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, monthly_income_estimate, pay_frequency")
    .eq("id", user!.id)
    .single();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      <Card>
        <CardContent className="flex items-center gap-4 pt-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {profile?.display_name ?? "Sin nombre"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {user?.email}
            </p>
            <p className="text-xs text-muted-foreground">
              Ingreso estimado: {formatMoney(profile?.monthly_income_estimate ?? 0)}{" "}
              · {profile?.pay_frequency === "biweekly" ? "quincenal" : "mensual"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-2">
          <SettingsLink
            href="/ajustes/tarjetas"
            icon={<CreditCard className="size-5" />}
            title="Tarjetas y métodos de pago"
            subtitle="Tarjetas de crédito, corte, efectivo"
          />
          <Separator />
          <SettingsLink
            href="/ajustes/categorias"
            icon={<Tags className="size-5" />}
            title="Categorías"
            subtitle="Personalizá tus categorías de gasto"
          />
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Tema</p>
              <p className="text-sm text-muted-foreground">Claro, oscuro o sistema</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <form action={signOut}>
        <Button variant="outline" className="w-full text-destructive" type="submit">
          <LogOut className="size-4" /> Cerrar sesión
        </Button>
      </form>
    </div>
  );
}

function SettingsLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
