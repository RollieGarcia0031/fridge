-- Migration: create saved_recipes table
-- Purpose: lets users keep generated recipes for later access instead of
-- regenerating them each time.

create table if not exists public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_name text not null,
  description text not null,
  ingredients jsonb not null default '[]'::jsonb,
  -- full getFullRecipe output so a saved recipe opens without re-running the AI
  instructions jsonb,
  created_at timestamptz not null default now()
);

-- a user may save each named recipe only once; lets the API upsert idempotently
create unique index if not exists saved_recipes_user_name_unique
  on public.saved_recipes (user_id, recipe_name);

create index if not exists idx_saved_recipes_user
  on public.saved_recipes (user_id);

alter table public.saved_recipes enable row level security;

drop policy if exists "Users manage their saved recipes" on public.saved_recipes;
create policy "Users manage their saved recipes"
  on public.saved_recipes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);