"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/money";

/** Número de dinero que cuenta desde 0 hasta su valor al montarse. */
export function CountUp({
  value,
  className,
  prefix = "",
}: {
  value: number;
  className?: string;
  prefix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const duration = 700;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(value * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value]);

  return (
    <span className={className}>
      {prefix}
      {formatMoney(display)}
    </span>
  );
}
