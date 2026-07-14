"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  ChartPie,
  House,
  Plus,
  ReceiptText,
  Settings,
} from "lucide-react";

const TABS = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/transacciones", label: "Movimientos", icon: ReceiptText },
  // hueco central para el botón "+"
  { href: "/estadisticas", label: "Estadísticas", icon: ChartPie },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

function Tabs() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function openQuickAdd() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("nuevo", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div
        className="mx-auto grid max-w-md grid-cols-5 items-center px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {left.map((tab) => (
          <TabLink key={tab.href} {...tab} active={pathname === tab.href} />
        ))}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={openQuickAdd}
            aria-label="Agregar movimiento"
            className="-mt-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            <Plus className="size-7" />
          </button>
        </div>
        {right.map((tab) => (
          <TabLink
            key={tab.href}
            {...tab}
            active={pathname.startsWith(tab.href)}
          />
        ))}
      </div>
    </nav>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

export function BottomTabs() {
  return (
    <Suspense>
      <Tabs />
    </Suspense>
  );
}
