-- Supabase complete setup script
-- This file contains all necessary tables, policies, triggers, and seed data.

-- 1. EXTENSIONS
-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- 2. TABLES
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  quantity text,
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. INDEXES
create unique index if not exists ingredients_normalized_name_unique
  on public.ingredients (normalized_name);

create unique index if not exists user_ingredient_unique
  on public.user_ingredients (user_id, ingredient_id);

create index if not exists idx_user_ingredients_user
  on public.user_ingredients (user_id);

create index if not exists idx_user_ingredients_ingredient
  on public.user_ingredients (ingredient_id);

-- 4. ROW LEVEL SECURITY (RLS)
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

-- 5. FUNCTIONS AND TRIGGERS
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

-- 6. SEED DATA
insert into public.ingredients (name, normalized_name, category)
values
  -- Pantry / staples
  ('Rice', 'rice', 'pantry'),
  ('Pasta', 'pasta', 'pantry'),
  ('Bread', 'bread', 'pantry'),
  ('Flour', 'flour', 'pantry'),
  ('Cooking Oil', 'cooking oil', 'pantry'),
  ('Olive Oil', 'olive oil', 'pantry'),
  ('Sugar', 'sugar', 'pantry'),
  ('Salt', 'salt', 'pantry'),

  -- Proteins
  ('Chicken Breast', 'chicken breast', 'protein'),
  ('Pork', 'pork', 'protein'),
  ('Beef', 'beef', 'protein'),
  ('Eggs', 'eggs', 'protein'),
  ('Fish', 'fish', 'protein'),
  ('Tofu', 'tofu', 'protein'),

  -- Vegetables
  ('Onion', 'onion', 'vegetable'),
  ('Garlic', 'garlic', 'vegetable'),
  ('Tomato', 'tomato', 'vegetable'),
  ('Potato', 'potato', 'vegetable'),
  ('Carrot', 'carrot', 'vegetable'),
  ('Bell Pepper', 'bell pepper', 'vegetable'),
  ('Cabbage', 'cabbage', 'vegetable'),
  ('Spinach', 'spinach', 'vegetable'),

  -- Fruits
  ('Apple', 'apple', 'fruit'),
  ('Banana', 'banana', 'fruit'),
  ('Lemon', 'lemon', 'fruit'),
  ('Calamansi', 'calamansi', 'fruit'),

  -- Dairy
  ('Milk', 'milk', 'dairy'),
  ('Butter', 'butter', 'dairy'),
  ('Cheese', 'cheese', 'dairy'),

  -- Condiments & spices
  ('Soy Sauce', 'soy sauce', 'condiment'),
  ('Vinegar', 'vinegar', 'condiment'),
  ('Fish Sauce', 'fish sauce', 'condiment'),
  ('Black Pepper', 'black pepper', 'spice'),
  ('Chili Powder', 'chili powder', 'spice'),
  ('Bay Leaf', 'bay leaf', 'spice')
on conflict (normalized_name) do nothing;
