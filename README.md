# Fridge

Fridge is a personal project that helps users decide meals based on constraints such as budget and goals. It also experiments with AI-powered meal generation.

## API Documentation

A practical API reference for all current route handlers lives at:

- [`app/api/README.md`](app/api/README.md)

---

## Environment Variables (Security First)

This app uses both **client-exposed** and **server-only** variables.

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Fill in real values in `.env`.

### Variable reference

- `NEXT_PUBLIC_SUPABASE_URL` (client-exposed)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-exposed)
- `SUPABASE_SERVICE_ROLE_KEY` (**secret**, server-only)
- `GEMINI_API_KEY` (**secret**, server-only)

### Security notes

- Never commit `.env` files with real credentials.
- Keep all server secrets **without** the `NEXT_PUBLIC_` prefix.
- `.gitignore` and `.dockerignore` are configured to exclude `.env` files.

---


## Database (Supabase standard layout)

Database schema and seed SQL are managed in the `/supabase` folder:

- [`supabase/migrations/`](supabase/migrations) for schema migrations
- [`supabase/seed.sql`](supabase/seed.sql) for local/dev seed data
- [`supabase/README.md`](supabase/README.md) for structure and workflow

## Run Manually (Local Development)

### Prerequisites

- Node.js 20+
- `pnpm` (via Corepack)

### Steps

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

Then open: <http://localhost:3000>

---

## Run with Docker

### Prerequisites

- Docker Engine
- Docker Compose plugin (`docker compose`)

### Build and run

```bash
cp .env.example .env
docker compose up --build
```

> Note: public Supabase vars are injected at runtime, so you do not need to pass Docker build args for `NEXT_PUBLIC_SUPABASE_*`.

Then open: <http://localhost:3000>

### Stop containers

```bash
docker compose down
```

### Run in detached mode

```bash
docker compose up --build -d
```

### View logs

```bash
docker compose logs -f app
```

---

## How containerization is set up

- `Dockerfile`: multi-stage build for a production Next.js runtime.
- `compose.yml`: starts the app on port `3000` and injects vars from `.env`.
- `.dockerignore`: excludes local artifacts, git metadata, and environment files from build context.
