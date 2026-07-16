import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addMonths, currentMonth } from "@/lib/dates";
import { getWrappedData } from "@/lib/queries/wrapped";
import { Button } from "@/components/ui/button";
import { WrappedStories } from "./wrapped-stories";

export default async function WrappedPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(params.mes ?? "")
    ? params.mes!
    : addMonths(currentMonth(), -1);

  const supabase = await createClient();
  const data = await getWrappedData(supabase, month);

  if (data.txCount === 0) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-4xl">🎁</p>
        <p className="font-medium">Aún no hay resumen para este mes</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Cuando tengás movimientos registrados en un mes completo, aquí
          aparece tu resumen con lo mejor (y lo peor 🐜).
        </p>
        <Button render={<Link href="/" />} variant="outline">
          Volver al inicio
        </Button>
      </div>
    );
  }

  return <WrappedStories data={data} />;
}
