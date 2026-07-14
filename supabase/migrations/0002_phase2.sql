-- ============================================================
-- 0002_phase2.sql — Presupuestos, cuotas tasa cero, deudas,
-- abonos a tarjeta y transacciones recurrentes.
-- ============================================================

-- 1. BUDGETS (límite mensual recurrente por categoría) --------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  monthly_limit numeric(10,2) not null check (monthly_limit > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id)
);

alter table public.budgets enable row level security;
create policy "own budgets" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. INSTALLMENT PLANS (cuotas tasa cero) ---------------------
create table public.installment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  total_amount numeric(10,2) not null check (total_amount > 0),
  months smallint not null check (months between 1 and 72),
  monthly_amount numeric(10,2) not null check (monthly_amount > 0),
  first_month char(7) not null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.installment_plans enable row level security;
create policy "own installment_plans" on public.installment_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.installment_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.installment_plans(id) on delete cascade,
  due_month char(7) not null,
  number smallint not null,
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','paid')),
  transaction_id uuid references public.transactions(id) on delete set null,
  unique (plan_id, number)
);

alter table public.installment_payments enable row level security;
create policy "own installment_payments" on public.installment_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index installment_payments_month_idx
  on public.installment_payments (user_id, due_month, status);

-- FK diferida desde 0001
alter table public.transactions
  add constraint transactions_installment_payment_fk
  foreign key (installment_payment_id)
  references public.installment_payments(id) on delete set null;

-- 3. DEBTS (préstamo del carro, etc.) -------------------------
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  original_amount numeric(12,2) not null check (original_amount > 0),
  remaining_balance numeric(12,2) not null check (remaining_balance >= 0),
  monthly_payment numeric(10,2) not null check (monthly_payment > 0),
  payment_day smallint not null default 1 check (payment_day between 1 and 28),
  category_id uuid references public.categories(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  last_paid_month char(7),
  is_paid_off boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.debts enable row level security;
create policy "own debts" on public.debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. CARD PAYMENTS (abonos al saldo de la tarjeta) ------------
create table public.card_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_method_id uuid not null references public.payment_methods(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  paid_date date not null default ((now() at time zone 'America/El_Salvador')::date),
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.card_payments enable row level security;
create policy "own card_payments" on public.card_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index card_payments_method_idx
  on public.card_payments (user_id, payment_method_id, paid_date desc);

-- 5. RECURRING TRANSACTIONS (fijos + salario) -----------------
create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  description text not null,
  amount numeric(10,2) not null check (amount > 0),
  day_of_month smallint not null check (day_of_month between 1 and 28),
  category_id uuid references public.categories(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  is_active boolean not null default true,
  last_generated_month char(7),
  created_at timestamptz not null default now()
);

alter table public.recurring_transactions enable row level security;
create policy "own recurring_transactions" on public.recurring_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
