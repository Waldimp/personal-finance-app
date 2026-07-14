"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-28" />;

  return (
    <Select
      value={theme}
      items={{ light: "Claro", dark: "Oscuro", system: "Sistema" }}
      onValueChange={(v) => {
        if (v) setTheme(v);
      }}
    >
      <SelectTrigger className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Claro</SelectItem>
        <SelectItem value="dark">Oscuro</SelectItem>
        <SelectItem value="system">Sistema</SelectItem>
      </SelectContent>
    </Select>
  );
}
