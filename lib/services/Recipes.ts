import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * A recipe the user is saving; the summary fields are required and the full
 * AI-generated instructions are optional so a saved recipe can be opened
 * without re-running the generation flow.
 */
export interface SavedRecipeInput {
  recipe_name: string;
  description: string;
  ingredients: string[];
  instructions?: Instructions;
}

/**
 * Retrieve all recipes saved by the logged-in user.
 *
 * @returns list of saved recipes, newest first
 */
export async function getSavedRecipes(): Promise<SavedRecipe[]> {
  const refreshToken = await getSupabaseClient().auth.getSession();

  const res = await fetch("/api/recipes/saved", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken.data.session?.access_token}`,
    },
  });

  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();
  return data.recipes as SavedRecipe[];
}

/**
 * Save (or update) a recipe in the logged-in user's collection.
 *
 * @param recipe the recipe summary plus optional persisted instructions
 * @returns the saved recipe row
 */
export async function saveRecipe(recipe: SavedRecipeInput): Promise<SavedRecipe> {
  const refreshToken = await getSupabaseClient().auth.getSession();

  const res = await fetch("/api/recipes/saved", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken.data.session?.access_token}`,
    },
    body: JSON.stringify({ recipe }),
  });

  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();
  return data.recipe as SavedRecipe;
}

/**
 * Remove recipes from the logged-in user's collection.
 *
 * @param ids primary keys of the saved-recipes rows to remove
 */
export async function unlistRecipes(ids: string[]): Promise<void> {
  const refreshToken = await getSupabaseClient().auth.getSession();

  const res = await fetch("/api/recipes/saved", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken.data.session?.access_token}`,
    },
    body: JSON.stringify({ ids }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.message || `Error ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }
}