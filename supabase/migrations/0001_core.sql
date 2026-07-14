-- ============================================================
-- 0001_core.sql — Esquema núcleo: perfiles, métodos de pago,
-- categorías, transacciones. RLS en todas las tablas.
-- ============================================================

-- 1. PROFILES ------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  monthly_income_estimate numeric(10,2) not null default 0,
  pay_frequency text not null default 'monthly'
    check (pay_frequency in ('monthly','biweekly')),
  pay_day_1 smallint check (pay_day_1 between 1 and 31),
  pay_day_2 smallint check (pay_day_2 between 1 and 31),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- 2. PAYMENT METHODS -----------------------------------------
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('credit','debit','cash')),
  last4 char(4),
  color text not null default '#6366f1',
  has_wallet boolean not null default false,
  cut_day smallint check (cut_day between 1 and 28),
  payment_due_day smallint check (payment_due_day between 1 and 31),
  credit_limit numeric(10,2),
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

create policy "own payment_methods" on public.payment_methods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index payment_methods_user_idx on public.payment_methods (user_id);

-- 3. CATEGORIES ----------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  icon text not null default 'circle',
  color text not null default '#64748b',
  needs_bucket text check (needs_bucket in ('need','want','saving')),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

alter table public.categories enable row level security;

create policy "own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index categories_user_idx on public.categories (user_id);

-- 4. TRANSACTIONS --------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  amount numeric(10,2) not null check (amount > 0),
  tx_date date not null default ((now() at time zone 'America/El_Salvador')::date),
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  source text not null default 'manual'
    check (source in ('manual','recurring','installment','debt','shortcut')),
  installment_payment_id uuid, -- FK real en 0002
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index transactions_user_date_idx on public.transactions (user_id, tx_date desc);
create index transactions_user_cat_date_idx on public.transactions (user_id, category_id, tx_date);

-- 5. TRIGGER: perfil + categorías default + Efectivo ---------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));

  insert into public.categories (user_id, name, type, icon, color, needs_bucket) values
    (new.id, 'Salario',                'income',  'banknote',      '#22c55e', null),
    (new.id, 'Otros ingresos',         'income',  'coins',         '#10b981', null),
    (new.id, 'Gasolina',               'expense', 'fuel',          '#f97316', 'need'),
    (new.id, 'Carwash y mantenimiento','expense', 'car',           '#f59e0b', 'need'),
    (new.id, 'Préstamo carro',         'expense', 'landmark',      '#ef4444', 'need'),
    (new.id, 'Cuotas de tarjeta',      'expense', 'credit-card',   '#dc2626', 'need'),
    (new.id, 'Comida y súper',         'expense', 'shopping-cart', '#84cc16', 'need'),
    (new.id, 'Restaurantes',           'expense', 'utensils',      '#eab308', 'want'),
    (new.id, 'Cine y salidas',         'expense', 'popcorn',       '#a855f7', 'want'),
    (new.id, 'Salud',                  'expense', 'heart-pulse',   '#ec4899', 'need'),
    (new.id, 'Ropa',                   'expense', 'shirt',         '#06b6d4', 'want'),
    (new.id, 'Hogar y servicios',      'expense', 'house',         '#3b82f6', 'need'),
    (new.id, 'Regalos',                'expense', 'gift',          '#f43f5e', 'want'),
    (new.id, 'Ahorro',                 'expense', 'piggy-bank',    '#14b8a6', 'saving');

  insert into public.payment_methods (user_id, name, type, color)
  values (new.id, 'Efectivo', 'cash', '#16a34a');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
