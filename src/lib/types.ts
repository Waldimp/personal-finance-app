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

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
};

export type InstallmentPlan = {
  id: string;
  user_id: string;
  description: string;
  total_amount: number;
  months: number;
  monthly_amount: number;
  first_month: string; // YYYY-MM
  payment_method_id: string | null;
  category_id: string | null;
};

export type InstallmentPayment = {
  id: string;
  user_id: string;
  plan_id: string;
  due_month: string; // YYYY-MM
  number: number;
  amount: number;
  status: "pending" | "paid";
  transaction_id: string | null;
};

export type Debt = {
  id: string;
  user_id: string;
  name: string;
  original_amount: number;
  remaining_balance: number;
  monthly_payment: number;
  payment_day: number;
  category_id: string | null;
  payment_method_id: string | null;
  last_paid_month: string | null;
  is_paid_off: boolean;
};

export type CardPayment = {
  id: string;
  user_id: string;
  payment_method_id: string;
  amount: number;
  paid_date: string;
  note: string;
};

export type RecurringTransaction = {
  id: string;
  user_id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  day_of_month: number;
  category_id: string | null;
  payment_method_id: string | null;
  is_active: boolean;
  last_generated_month: string | null;
};
