create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null, -- lowercase, trimmed
  category text,
  created_at timestamp with time zone default now()
);

create unique index ingredients_normalized_name_unique
on public.ingredients (normalized_name);

create table public.user_ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,

  quantity text,
  expires_at date,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index user_ingredient_unique
on public.user_ingredients (user_id, ingredient_id);

create index idx_user_ingredients_user
on public.user_ingredients (user_id);

create index idx_user_ingredients_ingredient
on public.user_ingredients (ingredient_id);

alter table public.ingredients enable row level security;
alter table public.user_ingredients enable row level security;


create policy "Read ingredients"
on public.ingredients
for select
using (true);

create policy "Users manage their ingredients"
on public.user_ingredients
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_user_ingredients_updated_at
before update on public.user_ingredients
for each row
execute function update_updated_at();
