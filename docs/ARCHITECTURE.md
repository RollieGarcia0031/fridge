# Architecture Overview: Fridge

Fridge is a personal meal management and AI-powered cooking assistant application built with Next.js, Supabase, and Google Genkit.

## High-Level Stack
- **Framework:** Next.js (TypeScript)
- **Database/Auth:** Supabase
- **AI/LLM:** Google Genkit (integrating with Gemini)
- **Deployment:** Docker
- **Styling:** Tailwind CSS

## Directory Structure
- `app/`: Next.js App Router (pages and API handlers).
- `components/`: UI components.
- `context/`: Application state management (e.g., DashboardContext).
- `db/`: Database schema and seed data.
- `lib/`: Business logic, AI flows, and service layers.
- `supabase/`: Supabase configuration and migrations.
- `types/`: Shared TypeScript definitions.

## Key Modules
### AI Flows (`lib/ai-flow/`)
The application uses Genkit to define AI flows:
- `generateRecipeFlow`: Generates meal ideas from ingredients.
- `getFullRecipeFlow`: Generates detailed cooking instructions.
These are exposed as HTTP APIs in `app/api/ai/`.

### API Routes (`app/api/`)
- `/ai/`: Endpoints interacting with Genkit flows.
- `/auth/`: Authentication handlers (login/register/logout).
- `/ingredients/`: API for managing user ingredients.

### Services (`lib/services/`)
- `Ingredients.ts`: Ingredient-related logic.
- `Meal.ts`: Meal-related logic.

## Environment Management
- Uses `.env` for configuration.
- Client variables prefixed with `NEXT_PUBLIC_`.
- Server-only secrets handled via Supabase Service Role and Gemini API keys.
