-- Caliber database setup
-- Run this whole file once in Supabase SQL Editor.

-- ============================================
-- TABLES
-- ============================================

create table if not exists public.user_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_policy text not null default 'always' check (run_policy in ('always', 'sampled')),
  sample_rate_pct integer not null default 10 check (sample_rate_pct >= 0 and sample_rate_pct <= 100),
  obfuscate_pii boolean not null default false,
  max_eval_per_day integer not null default 100 check (max_eval_per_day >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  interaction_id text not null,
  prompt text not null,
  response text not null,
  score integer not null check (score >= 0 and score <= 100),
  latency_ms integer not null check (latency_ms >= 0),
  flags jsonb,
  pii_tokens_redacted integer,
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index if not exists idx_user_configs_user_id
  on public.user_configs(user_id);

create index if not exists idx_evaluations_user_id
  on public.evaluations(user_id);

create index if not exists idx_evaluations_created_at
  on public.evaluations(created_at desc);

create index if not exists idx_evaluations_interaction_id
  on public.evaluations(interaction_id);

create index if not exists idx_evaluations_score
  on public.evaluations(score);

create index if not exists idx_evaluations_user_date
  on public.evaluations(user_id, created_at desc);

-- ============================================
-- RLS
-- ============================================

alter table public.user_configs enable row level security;
alter table public.evaluations enable row level security;

-- user_configs policies

drop policy if exists "Users can view own config" on public.user_configs;
create policy "Users can view own config"
  on public.user_configs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own config" on public.user_configs;
create policy "Users can insert own config"
  on public.user_configs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own config" on public.user_configs;
create policy "Users can update own config"
  on public.user_configs for update
  using (auth.uid() = user_id);

-- evaluations policies

drop policy if exists "Users can view own evaluations" on public.evaluations;
create policy "Users can view own evaluations"
  on public.evaluations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own evaluations" on public.evaluations;
create policy "Users can insert own evaluations"
  on public.evaluations for insert
  with check (auth.uid() = user_id);

-- ============================================
-- DONE
-- ============================================

-- Optional next step after this setup:
-- Run scripts/optimize-database.sql for performance analysis helpers.
