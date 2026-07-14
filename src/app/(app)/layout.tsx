import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Category, PaymentMethod } from "@/lib/types";
import { BottomTabs } from "@/components/nav/bottom-tabs";
import { CelebrationHost } from "@/components/celebration";
import { QuickAddSheet } from "@/components/transaction-form";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: categories }, { data: methods }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single(),
      supabase.from("categories").select("*").order("name"),
      supabase.from("payment_methods").select("*").order("created_at"),
    ]);

  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  return (
    <div className="mx-auto flex min-h-safe w-full max-w-md flex-col">
      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>
      <BottomTabs />
      <QuickAddSheet
        categories={(categories ?? []) as Category[]}
        methods={(methods ?? []) as PaymentMethod[]}
      />
      <CelebrationHost />
    </div>
  );
}
