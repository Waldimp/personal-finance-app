import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/lib/types";
import { CardsManager } from "./cards-manager";

export default async function TarjetasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_methods")
    .select("*")
    .order("created_at");

  return <CardsManager methods={(data ?? []) as PaymentMethod[]} />;
}
