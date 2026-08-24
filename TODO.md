# TODO 

Analysis date: 2026-08-16. Everything below maps to `plan.txt`. Items already implemented are noted as done; the rest are actionable tasks. Trust `app/api/*/route.ts` sources over `app/api/README.md` (stale).

## Input options (plan: optional inputs)

### 1. Dish `type` filter (soup / stir-fried)
- [x] `lib/ai-flow/generateRecipe.ts`: extend `generateRecipeInputSchema` with `type: z.enum(["soup", "stir-fried"]).optional()`; thread it through `buildGenerateRecipePrompt`.
- [x] `app/api/ai/meal-ideas/route.ts`: read `type` from the request body (currently it ignores the body entirely — see line 36) and pass it to `generateRecipeFlow`.
- [x] `context/DashboardContext.tsx`: add `dishType` state + setter to `refreshRecommendedRecipes`; pass body to `getRecommendedMeals()`.
- [x] `lib/services/Meal.ts`: add body param to `getRecommendedMeals`.
- [x] `app/page.tsx`: add a select/toggle for dish type near the suggestion button; `components/SuggestedDialog.tsx` should show the active filter.

### 2. Nutrient priority (muscle / bone / sick)
- [x] Same files as #1: `nutrientPriority: z.enum(["muscle", "bone", "sick"]).optional()` on the input schema, prompt guidance (e.g., "high protein for muscle recovery", "calcium/vitamin D for bone health", "easily digestible for sick days").
- [x] Route passes body field through; context state; UI selector.

### 3. "Can suggest more ingredients" flag (true | false)
- [x] `generateRecipeInputSchema`: `allowSuggestedIngredients: z.boolean().optional()` (default `false`). When true, the prompt should explicitly allow extra ingredients beyond the input list and the output `ingredients` arrays may include non-inventory items.
- [x] Thread through route body → flow. Add a checkbox/toggle in `app/page.tsx`.

## Input modes (plan: bonus)

### 4. Autocomplete typing
- [x] Current: `react-select` searchable dropdown (`app/page.tsx:162-173`). This already covers type-ahead autocomplete. Optional enhancement: switch to a custom combobox with keyboard navigation; only do this if the react-select UX is inadequate.
- [x] No action required unless desired.

### 5. Indicate if ingredient is already taken
- [x] Current: already-owned and queued ingredients are silently filtered out of the dropdown (`filteredIngredients`, `app/page.tsx:56-67`).
- [x] Enhancement: render a "✓ already in fridge" / "✓ queued" badge instead of hiding them, so the user sees the state. Keep `filteredIngredients` behavior but add a visible indicator.

### 6. Fridge mode (bulk input, multiple foods at once)
- [x] Current: queue-and-batch-save ("Selected to Add" chips → "Add to Fridge") already allows multi-input. The plan asks for a dedicated "mode" toggle; current UX is effectively fridge mode by default.
- [ ] Optional: add an explicit mode switch UI (Fridge / Market) to satisfy the plan wording. If added, fridge mode = existing behavior.

### 7. Market mode (AI real-time suggestions while adding to cart)
- [ ] New behavior: as the user adds ingredients to the queue, the app should suggest dishes in real time (debounced ~500ms after each addition).
- [ ] Implement: reuse `refreshRecommendedRecipes` (or `generateRecipeFlow`) but auto-fire when `ingredientsToAdd` changes while in market mode. Debounce in the component or context.
- [ ] UI: a toggle to enable market mode; a live suggestion panel (can reuse `SuggestedDialog` content or an inline list) updating on each queued item.

## Dish generation (plan: main feature)

### 8. Instant generation (one-click straight to a dish)
- [ ] Add a "Generate now" button that calls the meal-ideas flow and immediately navigates to `/recipe` with the first result (or picks a random one).
- [ ] Reuse `sessionStorage` handoff already used by `components/SuggestedDialog.tsx` → `/recipe`.
- [ ] Note: full recipe (`getFullRecipeFlow`) is only generated on the `/recipe` page; instant generation should just push a chosen suggestion through the same path.

### 9. Show list of suggestions
- [x] `SuggestedDialog.tsx` + `refreshRecommendedRecipes()` cover this. No change required (but see #1–#3 for filter support).

## Instructions (plan: main feature)

### 10. Recommended tutorial (video)
- [x] `lib/ai-flow/getFullRecipe.ts`: add an optional `tutorial_url` / `video` field to `getFullRecipeOutputSchema` and prompt the model for a YouTube/instructional video recommendation. `app/recipe/page.tsx` should render a "Watch a tutorial" link.
- [x] Fallback: if the model can't produce a URL, hide the section.

### 13. Recipe page missing fields from AI output
- [x] `app/recipe/page.tsx` currently drops `tips`, `warnings`, and the detailed `ingredients` list from the flow output. Render these sections: tips as helpful cooking tips, warnings as safety/allergy notes, ingredients with name + quantity.
- [x] Consider adding collapsible sections for tips/warnings to keep the UI clean.

## Minor features (plan)

### 11. Customize fridge inventory (quantity / expiry)
- [x] DB already has `user_ingredients.quantity` and `expires_at` (`supabase/migrations/20260316125504_remote_schema.sql`); the API returns `quantity`, but the UI never edits or shows them.
- [ ] Add editable quantity + expiry date to `app/page.tsx` `OwnedIngredientsPane` (and/or the add flow). Update `POST /api/ingredients/user` to accept `quantity`/`expires_at` per id if set (currently accepts only `{ ids: string[] }`). Update `components/` as needed.

### 12. Presets of fridge inventory
- [ ] New DB table (new forward-only migration under `supabase/migrations/`): e.g. `public.fridge_presets (id, user_id, name, ingredients uuid[] or a join table, created_at)` with owner-only RLS. Then `supabase db reset` + `supabase db push`.
- [ ] New API routes: `GET/POST/DELETE /api/presets` (Bearer-auth like `/api/ingredients/user`).
- [ ] UI in `app/page.tsx`: "Save as preset", preset list, apply preset (adds all its ingredients to inventory), delete preset.
- [ ] `lib/services/` service + `DashboardContext` state for presets.

### 14. Quantity support in POST /api/ingredients/user
- [ ] Update `POST /api/ingredients/user` to accept an array of objects `{ id: string, quantity?: number, expires_at?: string }` instead of just `{ ids: string[] }`.
- [ ] Update `lib/services/Ingredients.ts` to support quantity/expiry when adding ingredients.
- [ ] Update UI to allow setting quantity when adding ingredients.

## Notes / conventions
- All route changes keep the Bearer-token auth pattern from `app/api/ingredients/user/route.ts`.
- Never add a server secret without `NEXT_PUBLIC_` prefix; schema changes go through `supabase/migrations/` (forward-only, roll back via revert migration).
- After each feature: run `pnpm build` (de-facto typecheck) and `pnpm lint`.

## Additional features (discovered during analysis)

### 15. Recipe saving / favorites
- [ ] Add ability to save generated recipes to user's collection for later access.
- [ ] New DB table `public.saved_recipes` with RLS.
- [ ] API routes for save/unlist/get saved recipes.
- [ ] UI in recipe page to save/unsave; a saved recipes section in dashboard.

### 16. Dietary restrictions / preferences
- [ ] Add user preferences for dietary restrictions (vegetarian, vegan, gluten-free, etc.).
- [ ] Update `generateRecipeFlow` to exclude ingredients based on preferences.
- [ ] UI settings page or modal for managing preferences.

### 17. Meal planning calendar
- [ ] Weekly/monthly view to plan which meals to cook on which days.
- [ ] API routes to store/retrieve meal plans.
- [ ] Calendar UI component in dashboard.

### 18. Shopping list generation
- [ ] Generate a shopping list from meal plan (ingredients not in fridge).
- [ ] Export shopping list or share via text.
- [ ] UI for viewing and managing shopping list.

### 19. Dark/light mode toggle
- [x] Add theme switcher in UI (`components/ThemeToggle.tsx`, rendered in `AppHeader` desktop nav + mobile menu).
- [x] Persist preference in localStorage (`theme` key); system preference used as fallback via pre-paint script in `app/layout.tsx`.
- [x] Update CSS variables for light mode support: dark palette moved from `prefers-color-scheme` media query to a `.dark` class in `app/globals.css`, with `@custom-variant dark` for Tailwind `dark:` utilities.

---

## Main Checklist

- [x] 1. Dish type filter
- [x] 2. Nutrient priority
- [x] 3. Allow suggested ingredients flag
- [x] 4. Autocomplete typing
- [x] 5. Indicate if ingredient is already taken
- [x] 6. Fridge mode (partial)
- [ ] 7. Market mode
- [ ] 8. Instant generation
- [x] 9. Show list of suggestions
- [x] 10. Recommended tutorial (video)
- [ ] 11. Customize fridge inventory (quantity / expiry)
- [ ] 12. Presets of fridge inventory
- [x] 13. Recipe page missing fields from AI output
- [ ] 14. Quantity support in POST /api/ingredients/user
- [ ] 15. Recipe saving / favorites
- [ ] 16. Dietary restrictions / preferences
- [ ] 17. Meal planning calendar
- [ ] 18. Shopping list generation
- [x] 19. Dark/light mode toggle

---

## Recommended Implementation Order

### Phase 1 — Low-hanging fruit (quick wins, high impact)

| # | Item | Rationale |
|---|------|-----------|
| 13 | Recipe page missing fields | The schema already returns `tips`, `warnings`, `ingredients` with quantities — just render them. No API or DB changes needed. |
| 5 | Indicate if ingredient is already taken | Minimal change: add a badge instead of filtering. Improves UX immediately. |
| 19 | Dark/light mode toggle | CSS-only if done via variables. Small scope, high perceived value. |

### Phase 2 — Input filters (core UX)

| # | Item | Rationale |
|---|------|-----------|
| 1 | Dish type filter | Extends existing schema + UI. Unlocks recipe personalization. |
| 2 | Nutrient priority | Same pattern as #1, easy to batch together. |
| 3 | Allow suggested ingredients flag | Small schema change + toggle. Completes the input options trio. |

### Phase 3 — Recipe data enrichment

| # | Item | Rationale |
|---|------|-----------|
| 10 | Recommended tutorial (video) | Extends `getFullRecipeOutputSchema`. Single-file schema + prompt change. |
| 14 | Quantity support in POST | Enables #11 (expiry). Unblocks full ingredient management. |
| 11 | Customize fridge inventory | Depends on #14. Adds quantity/expiry UI. Completes the fridge management flow. |

### Phase 4 — Advanced input modes

| # | Item | Rationale |
|---|------|-----------|
| 8 | Instant generation | Adds a "Generate now" button. Builds on existing suggestion flow. |
| 7 | Market mode | Most complex input mode. Requires debounce logic + live panel. Do after simpler features. |
| 6 | Fridge mode toggle | Optional UX polish. Only if market mode is implemented. |

### Phase 5 — Persistence & user data

| # | Item | Rationale |
|---|------|-----------|
| 15 | Recipe saving / favorites | Requires new DB table + API routes. Builds on existing recipe flow. |
| 12 | Presets of fridge inventory | New DB table + API + UI. Independent of other features. |
| 16 | Dietary restrictions | Requires user preferences storage. Impacts AI flow prompts. |

### Phase 6 — Planning features (stretch)

| # | Item | Rationale |
|---|------|-----------|
| 17 | Meal planning calendar | New feature entirely. Requires calendar UI + new DB tables. |
| 18 | Shopping list generation | Depends on #17 (meal plan). Generates list from planned meals minus inventory. |

---

**Total: 19 items. 19 → done first (CSS). 13 → done second (render existing data). Then filters, then persistence, then planning.**
