import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { CategoriesManager } from "./categories-manager";

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return <CategoriesManager categories={(data ?? []) as Category[]} />;
}
