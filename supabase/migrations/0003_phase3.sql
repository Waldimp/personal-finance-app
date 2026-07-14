-- ============================================================
-- 0003_phase3.sql — Tokens de API (Atajos de iOS), reglas de
-- comercio→categoría y suscripciones push.
-- ============================================================

-- 1. API TOKENS (solo se guarda el hash sha256) ---------------
create table public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'iPhone Shortcut',
  token_hash text not null unique,
  token_prefix text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.api_tokens enable row level security;
create policy "own api_tokens" on public.api_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. MERCHANT RULES (aprende comercio → categoría) ------------
create table public.merchant_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, keyword)
);

alter table public.merchant_rules enable row level security;
create policy "own merchant_rules" on public.merchant_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. PUSH SUBSCRIPTIONS ---------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
create policy "own push_subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
