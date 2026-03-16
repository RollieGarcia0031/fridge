-- Fridge baseline schema (managed by Supabase migrations)

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  category text,
  created_at timestamptz not null default now()
);

create unique index if not exists ingredients_normalized_name_unique
  on public.ingredients (normalized_name);

create table if not exists public.user_ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  quantity text,
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_ingredient_unique
  on public.user_ingredients (user_id, ingredient_id);

create index if not exists idx_user_ingredients_user
  on public.user_ingredients (user_id);

create index if not exists idx_user_ingredients_ingredient
  on public.user_ingredients (ingredient_id);

alter table public.ingredients enable row level security;
alter table public.user_ingredients enable row level security;

drop policy if exists "Read ingredients" on public.ingredients;
create policy "Read ingredients"
  on public.ingredients
  for select
  using (true);

drop policy if exists "Users manage their ingredients" on public.user_ingredients;
create policy "Users manage their ingredients"
  on public.user_ingredients
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_user_ingredients_updated_at on public.user_ingredients;
create trigger trigger_user_ingredients_updated_at
before update on public.user_ingredients
for each row
execute function public.update_updated_at();
