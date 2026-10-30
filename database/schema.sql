-- Budget Goal Planner database schema for Supabase PostgreSQL.
-- Run this entire file once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  title varchar(90) not null check (length(trim(title)) > 0),
  type varchar(10) not null check (type in ('income', 'expense')),
  amount numeric(12,2) not null check (amount > 0),
  category varchar(40) not null check (length(trim(category)) > 0),
  date date not null,
  notes varchar(500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_date_idx on public.transactions (date desc);
create index if not exists transactions_type_idx on public.transactions (type);
create index if not exists transactions_category_idx on public.transactions (category);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  title varchar(90) not null check (length(trim(title)) > 0),
  target_amount numeric(12,2) not null check (target_amount > 0),
  saved_amount numeric(12,2) not null default 0 check (saved_amount >= 0 and saved_amount <= target_amount),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists savings_goals_created_at_idx on public.savings_goals (created_at desc);

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists savings_goals_set_updated_at on public.savings_goals;
create trigger savings_goals_set_updated_at before update on public.savings_goals
for each row execute function public.set_updated_at();

-- Add savings atomically so concurrent requests cannot overwrite one another.
create or replace function public.add_goal_contribution(p_goal_id uuid, p_amount numeric)
returns public.savings_goals
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.savings_goals;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Contribution must be greater than zero' using errcode = '22023';
  end if;

  update public.savings_goals
  set saved_amount = saved_amount + p_amount
  where id = p_goal_id and saved_amount + p_amount <= target_amount
  returning * into result;

  if not found then
    if exists (select 1 from public.savings_goals where id = p_goal_id) then
      raise exception 'Contribution exceeds target amount' using errcode = '22023';
    end if;
    raise exception 'Savings goal not found' using errcode = 'P0002';
  end if;

  return result;
end;
$$;

-- This starter app uses a server-only Supabase service-role key and server-side
-- routes. Keep that key private. The browser never connects directly to Supabase.
-- If you later add user accounts, add user_id ownership columns and RLS policies.
alter table public.transactions enable row level security;
alter table public.savings_goals enable row level security;
-- No anon policies are created intentionally; browser/anon clients cannot read or write.
-- The trusted server's service-role key bypasses RLS, so do not expose this backend
-- publicly without adding authentication/authorization.
