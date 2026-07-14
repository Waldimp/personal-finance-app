-- ============================================================
-- 0004_shortcut_logs.sql — Registro de llamadas al endpoint de
-- Atajos (Apple Pay) para depuración y auditoría desde la app.
-- ============================================================

create table public.shortcut_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null si el token fue inválido
  status text not null check (status in ('ok','duplicate','inbox','auth_error','bad_request','error')),
  merchant text not null default '',
  amount numeric(10,2),
  card text not null default '',
  matched_category text,
  matched_method text,
  error text,
  created_at timestamptz not null default now()
);

alter table public.shortcut_logs enable row level security;

-- El usuario solo VE sus propios logs; los inserta el servidor (service role).
create policy "own shortcut_logs" on public.shortcut_logs
  for select using (auth.uid() = user_id);

create index shortcut_logs_user_idx on public.shortcut_logs (user_id, created_at desc);
