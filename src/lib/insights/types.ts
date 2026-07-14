export type InsightSeverity = "alert" | "warn" | "cheer" | "info";

export type Insight = {
  id: string;
  severity: InsightSeverity;
  emoji: string;
  title: string;
  detail?: string;
};

export type CategorySnapshot = {
  id: string;
  name: string;
  needs_bucket: "need" | "want" | "saving" | null;
  current: number;
  previous: number;
  avg3: number;
};

export type InsightContext = {
  month: string;
  daysInMonth: number;
  daysElapsed: number;
  incomeBase: number;
  totalSpent: number;
  totalSpentPrev: number;
  committedPending: number;
  committedNextMonth: number;
  categories: CategorySnapshot[];
  budgets: {
    categoryName: string;
    limit: number;
    spent: number;
    pct: number;
  }[];
  plansEnding: { description: string; monthly: number; lastMonth: string }[];
  cardCuts: { name: string; daysToCut: number; currentCharges: number }[];
  maxSingleExpense: { amount: number; description: string } | null;
};
