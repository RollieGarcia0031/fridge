-- Migration: create fridge_presets table
-- Purpose: lets users save named collections of ingredients so they can
-- quickly re-apply a common fridge setup without re-adding each item.

create table if not exists public.fridge_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  ingredients jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- a user may save each named preset only once
create unique index if not exists fridge_presets_user_name_unique
  on public.fridge_presets (user_id, name);

create index if not exists idx_fridge_presets_user
  on public.fridge_presets (user_id);

alter table public.fridge_presets enable row level security;

drop policy if exists "Users manage their fridge presets" on public.fridge_presets;
create policy "Users manage their fridge presets"
  on public.fridge_presets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
