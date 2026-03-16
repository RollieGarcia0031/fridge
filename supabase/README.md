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

## Updating the database schema

Whenever you change the app in a way that requires a database change (new table, new column,
new policy, etc.), use a migration so every environment can be updated consistently.

1. Create a migration after making schema changes locally:

   ```bash
   supabase migration new <descriptive_name>
   ```

   Then add the SQL for the change in the generated file under `supabase/migrations/`.

2. Validate the migration locally:

   ```bash
   supabase db reset
   ```

   This ensures the full migration history (plus seed) still works from scratch.

3. Apply new migrations to the linked remote project:

   ```bash
   supabase db push
   ```

## Rolling back database changes

Supabase migrations are forward-only by default, so rollbacks are done by creating a new
"revert" migration instead of deleting or editing migrations that were already applied.

### Recommended rollback flow

1. Create a new migration that reverses the bad change:

   ```bash
   supabase migration new revert_<descriptive_name>
   ```

2. Add SQL that undoes the previous migration (for example: drop the new column, restore a
   previous constraint, recreate dropped objects).

3. Test the full chain locally:

   ```bash
   supabase db reset
   ```

4. Push the revert migration:

   ```bash
   supabase db push
   ```

### Local-only rollback while developing

If the migration is not pushed/shared yet, you can edit or remove the local migration file and
run:

```bash
supabase db reset
```

Do **not** rewrite migration history that has already been applied to shared environments;
always use a new revert migration in that case.
