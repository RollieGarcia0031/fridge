-- Migration: create user_preferences table
-- Purpose: stores per-user dietary restrictions (e.g. vegetarian, vegan,
-- gluten-free) so generated meal suggestions always respect them.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dietary_restrictions text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "Users manage their preferences" on public.user_preferences;
create policy "Users manage their preferences"
  on public.user_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger trigger_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.update_updated_at();