# Supabase database structure

This project now keeps database assets in the standard Supabase layout:

- `migrations/`: schema history (`*.sql`)
- `seed.sql`: development seed data
- `config.toml`: local Supabase CLI configuration

## Current schema

The baseline migration creates:

1. `public.ingredients`
   - ingredient catalog with normalized names
   - unique index on `normalized_name`
2. `public.user_ingredients`
   - user-owned ingredient rows
   - foreign keys to `auth.users` and `public.ingredients`
   - unique `(user_id, ingredient_id)` constraint
3. RLS policies
   - anyone can read `ingredients`
   - users can only manage their own `user_ingredients`
4. Trigger/function
   - `update_updated_at()` keeps `user_ingredients.updated_at` current

## Seeding

`supabase/seed.sql` is configured in `config.toml` via:

```toml
[db.seed]
enabled = true
sql_paths = ["./seed.sql"]
```

The seed file is idempotent (`on conflict do nothing`) so it can be re-run safely.

## Typical workflow

```bash
supabase db reset
supabase db push
```

- `db reset` recreates local DB, runs all migrations, then seeds.
- `db push` applies new local migrations to the linked project.
