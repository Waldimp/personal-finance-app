import type { Insight } from "@/lib/insights/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

const STYLES: Record<Insight["severity"], string> = {
  alert:
    "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
  warn:
    "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
  cheer:
    "border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-950/40",
  info: "border-border bg-muted/40",
};

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="size-4" /> Consejos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.map((insight, i) => (
          <div
            key={insight.id}
            className={`animate-fade-up rounded-xl border p-3 ${STYLES[insight.severity]}`}
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <p className="text-sm font-medium">
              <span className="mr-1.5">{insight.emoji}</span>
              {insight.title}
            </p>
            {insight.detail && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {insight.detail}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
