import { createClient } from "@/lib/supabase/server";
import { currentMonth } from "@/lib/dates";
import { getCommitmentProjection } from "@/lib/queries/commitments";
import type {
  Category,
  Debt,
  InstallmentPayment,
  InstallmentPlan,
  PaymentMethod,
} from "@/lib/types";
import { DebtsManager } from "./debts-manager";

export type PlanWithPayments = InstallmentPlan & {
  installment_payments: InstallmentPayment[];
};

export default async function DeudasPage() {
  const supabase = await createClient();
  const [
    { data: debts },
    { data: plans },
    { data: categories },
    { data: methods },
    projection,
  ] = await Promise.all([
    supabase.from("debts").select("*").order("created_at"),
    supabase
      .from("installment_plans")
      .select("*, installment_payments(*)")
      .order("created_at"),
    supabase
      .from("categories")
      .select("*")
      .eq("type", "expense")
      .eq("is_archived", false)
      .order("name"),
    supabase
      .from("payment_methods")
      .select("*")
      .eq("is_archived", false)
      .order("created_at"),
    getCommitmentProjection(supabase, currentMonth(), 6),
  ]);

  return (
    <DebtsManager
      debts={(debts ?? []) as Debt[]}
      plans={(plans ?? []) as PlanWithPayments[]}
      categories={(categories ?? []) as Category[]}
      methods={(methods ?? []) as PaymentMethod[]}
      projection={projection}
    />
  );
}
