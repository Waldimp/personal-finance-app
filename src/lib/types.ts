export type Profile = {
  id: string;
  display_name: string | null;
  monthly_income_estimate: number;
  pay_frequency: "monthly" | "biweekly";
  pay_day_1: number | null;
  pay_day_2: number | null;
  onboarding_completed: boolean;
};

export type PaymentMethod = {
  id: string;
  user_id: string;
  name: string;
  type: "credit" | "debit" | "cash";
  last4: string | null;
  color: string;
  has_wallet: boolean;
  cut_day: number | null;
  payment_due_day: number | null;
  credit_limit: number | null;
  is_archived: boolean;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  needs_bucket: "need" | "want" | "saving" | null;
  is_archived: boolean;
};

export type TransactionSource =
  | "manual"
  | "recurring"
  | "installment"
  | "debt"
  | "shortcut";

export type Transaction = {
  id: string;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  tx_date: string; // YYYY-MM-DD
  description: string;
  category_id: string | null;
  payment_method_id: string | null;
  source: TransactionSource;
  created_at: string;
};

export type TransactionWithRefs = Transaction & {
  categories: Pick<Category, "name" | "icon" | "color" | "type"> | null;
  payment_methods: Pick<PaymentMethod, "name" | "color" | "type"> | null;
};
