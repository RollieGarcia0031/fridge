# AI Flow Guide

This folder contains Genkit flows used by the API endpoints under `app/api/ai/*`.

## Flows overview

### 1) `generateRecipeFlow`
- **File:** `lib/ai-flow/generateRecipe.ts`
- **Purpose:** Generate five meal ideas from a list of available ingredients.
- **Used by:** `POST /api/ai/meal-ideas`

#### Input
```ts
{
  ingredients: string[];
}
```

#### Output
```ts
Array<{
  recipe_name: string;
  ingredients: string[];
  description: string;
}>
```

---

### 2) `getFullRecipeFlow`
- **File:** `lib/ai-flow/getFullRecipe.ts`
- **Purpose:** Generate a complete recipe with servings, ingredient list, and step-by-step instructions.
- **Used by:** `POST /api/ai/meal-recipe`

#### Input
```ts
{
  recipe_name: string;
  ingredients: string[];
}
```

#### Output
```ts
{
  name: string;
  servings: number;
  cook_time_minutes: number;
  ingredients: Array<{
    name: string;
    quantity?: string;
  }>;
  steps: Array<{
    order: number;
    title: string;
    instruction: string;
  }>;
  tips: string[];
  warnings?: string[];
}
```

## Standard flow pattern in this directory

Each flow follows the same structure:
1. Define `inputSchema` and `outputSchema` with `zod` from Genkit.
2. Build prompt text in a small prompt-builder helper.
3. Register the flow with `ai.defineFlow`.
4. Call `ai.generate` with strict schema output.
5. Throw a clear error if model output is empty.

This pattern keeps flows predictable, testable, and easier to maintain.

## How to run and test AI flows

### Prerequisites
1. Set environment variable:
   - `GEMINI_API_KEY=<your-key>`
2. Install dependencies:
   - `npm install`

### Run Genkit development UI
Use either of the following:

```bash
npm run dev_ai
```

Or run the command directly:

```bash
genkit start -- npx tsx --watch ./lib/ai-flow/index.ts
```

Both commands start Genkit with `lib/ai-flow/index.ts`, which imports all registered flows.

### Quick API testing
Run the app:
```bash
npm run dev
```

Then test endpoints with a valid Supabase bearer token.

#### Meal ideas
```bash
curl -X POST http://localhost:3000/api/ai/meal-ideas \
  -H "Authorization: Bearer <SUPABASE_TOKEN>"
```

#### Full recipe
```bash
curl -X POST http://localhost:3000/api/ai/meal-recipe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_TOKEN>" \
  -d '{
    "recipe_name": "Vegetable Omelette",
    "ingredients": ["egg", "onion", "tomato", "salt"]
  }'
```

### Static checks
```bash
npm run lint
```
