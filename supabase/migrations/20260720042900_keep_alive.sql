-- Migration: create keep_alive table
-- Purpose: used to prevent Supabase free-tier DB from going inactive
-- by periodically writing to this table via the /api/keep-alive route.

create table if not exists public.keep_alive (
  updated_at timestamptz not null default now()
);

-- Seed a single row so the route can always do an UPDATE (no INSERT needed each call)
insert into public.keep_alive (updated_at)
select now()
where not exists (select 1 from public.keep_alive);

-- No RLS needed; this table is only written to by the service-role key
alter table public.keep_alive enable row level security;
