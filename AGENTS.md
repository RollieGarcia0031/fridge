# AGENTS.md

Next.js 16 (App Router, Turbopack) + Supabase + Genkit (Gemini) personal meal-planner. UI is a client-heavy dashboard driven by `context/DashboardContext.tsx`; server work happens in `app/api` route handlers.

## Commands

- `pnpm dev` — dev server (port 3000)
- `pnpm build` — production build; also the de-facto typecheck (no separate typecheck script)
- `pnpm lint` — ESLint flat config (`eslint.config.mjs`); there is no `next lint` script
- `pnpm test` — Vitest (jsdom). Single test: `pnpm vitest run components/AppHeader.test.tsx`
- `pnpm dev_ai` — Genkit dev UI for the AI flows (`lib/ai-flow/index.ts`)

## Toolchain

- **pnpm is the only package manager.** `pnpm-lock.yaml` + `pnpm-workspace.yaml` are authoritative; `package-lock.json` is stale and must not be regenerated (`npm install` would corrupt the setup). Node 20+ via Corepack (`corepack enable`).
- `@/` maps to the repo root (both `tsconfig.json` and `vitest.config.ts`).
- Next 16 renamed middleware to **`proxy.ts`** — the root `proxy.ts` is the request-interception file; do not rename it to `middleware.ts`. `cookies()`, `headers()`, `params` are async here; always `await`.
- `lib/auth/requireAuth.ts` is unused dead code (sync `cookies()`). Protected pages use the `proxy.ts` cookie check; protected APIs use Bearer tokens (below).

## Env & secrets

- `.env.example` is authoritative (9 vars). Copy it to `.env` for `pnpm dev`. **`compose.yml` reads `.env.local`** instead — copy the example there for container runs. `.example.env.local` is stale.
- Client-exposed (no secrets): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `KEEP_ALIVE_TOKEN`. Never add a server secret without the `NEXT_PUBLIC_` prefix, and never put a real secret in a `NEXT_PUBLIC_` var.
- NEXT_PUBLIC vars are also injected at runtime into `window.__ENV` (`app/layout.tsx`); `lib/supabase/client.ts` reads it first. That's why the Docker image needs no build args for them.

## Supabase

- Three clients in `lib/supabase/`: `server.ts` (SSR cookie client — returns a Promise; callers use the `await (await supabase())` pattern), `client.ts` (browser), `admin.ts` (service role, server-only). Never use the service-role key in client code.
- Schema source of truth: `supabase/migrations/` (forward-only SQL). `supabase/schema.sql` is a generated snapshot; `supabase/seed.sql` is idempotent seed; **`db/` and `setup_supabase.sql` are deprecated**. Workflow: `supabase db reset`, then `supabase db push`. Roll back via a new revert migration, never rewrite pushed history. See `supabase/README.md`.
- `public.keep_alive` + `/api/keep-alive` (guarded by `KEEP_ALIVE_TOKEN`) keep the Supabase free tier from sleeping; `.github/workflows/keep-alive.yml` pings it on a cron (needs secrets `KEEP_ALIVE_TOKEN`, `APP_URL`).

## API & auth conventions

- Protected API routes authenticate with `Authorization: Bearer <supabase_access_token>` verified via `(await supabase()).auth.getUser(token)` — not cookies. Pages use the cookie session.
- `POST`/`DELETE /api/ingredients/user` take **`{ ids: string[] }`** (batch upsert/delete) and `POST` calls `revalidateTag("user-ingredients", ...)`. `app/api/README.md` is stale on request shapes and some response keys — trust the route source.
- `lib/services/Ingredients.ts` keeps module-level client caches; `clearIngredientsCache()` must run on logout — previously caused a logged-out user to see the previous user's inventory.

## AI flows (Genkit)

- Flows live in `lib/ai-flow/`, called by `app/api/ai/*` handlers. Pattern per flow: zod `inputSchema`/`outputSchema`, prompt-builder helper, `ai.defineFlow`, `ai.generate` with strict schema output, throw if output empty.
- Model is `gemini-2.5-flash` in `lib/ai-flow/genkit.ts` (needs `GEMINI_API_KEY`). `/api/ai/meal-ideas` reads the user's inventory server-side and passes ingredient names to the flow. Use `pnpm dev_ai` to iterate on flows in the Genkit UI.

## Git

- Branch names prefix `feature/`, `fix/`, `chore/`; changes land via PRs with conventional-style commits (`fix: ...`, `feat: ...`).
