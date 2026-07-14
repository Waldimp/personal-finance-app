import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCardCycles } from "@/lib/queries/cards";
import { CardCycles } from "./card-cycles";

export default async function TarjetasCicloPage() {
  const supabase = await createClient();
  const cycles = await getCardCycles(supabase);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Mis tarjetas</h1>
      {cycles.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-3xl">💳</p>
          <p className="mt-2 text-sm text-muted-foreground">
            No tenés tarjetas de crédito activas.
          </p>
          <Link
            href="/ajustes/tarjetas"
            className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
          >
            Agregar una tarjeta
          </Link>
        </div>
      ) : (
        <CardCycles cycles={cycles} />
      )}
    </div>
  );
}
