import { getSupabaseClient } from "@/lib/supabase/client";

export interface IngredientItem {
  id: string;
  /** quantity as a number, or "" to clear the stored value */
  quantity?: number | "";
  expires_at?: string;
}

// Cache variables for client-side persistence within the session
let allIngredientsCache: Ingredient[] | null = null;
let ownedIngredientsCache: OwnedIngredient[] | null = null;

/**
 * Clears the locally cached ingredients.
 * Should be called upon user logout to prevent data leaking between sessions.
 */
export function clearIngredientsCache() {
  ownedIngredientsCache = null;
}

/**
 * Retrieve all of the ingredients in the user's inventory
 * 
 * @param forceRefresh - Whether to bypass the cache and fetch fresh data
 * @returns - List of owned ingredients
 */
export async function getOwnedIngredients(forceRefresh = false): Promise<OwnedIngredient[]> {
  if (ownedIngredientsCache && !forceRefresh) {
    return ownedIngredientsCache;
  }

  const refreshToken = await getSupabaseClient().auth.getSession();

  const res = await fetch("/api/ingredients/user",{
    method: "GET",
    headers:{
      'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
    },
    next: { tags: ['user-ingredients'] }
  });

  const data = await res.json();
  ownedIngredientsCache = data.recipes;
  return data.recipes;
}

/**
 * Fetch all of the ingredients from the database
 * 
 * @param forceRefresh - Whether to bypass the cache and fetch fresh data
 * @returns 
 */
export async function getAllIngredients(forceRefresh = false): Promise<Ingredient[]> {
  if (allIngredientsCache && !forceRefresh) {
    return allIngredientsCache;
  }

  const { data, error } = await getSupabaseClient().from("ingredients").select("*");
  if (error) throw new Error(error.message);
  
  allIngredientsCache = data;
  return data;
}

/**
 * Save ingredients in the user's inventory
 *
 * @param items - Array of ingredient ids (string[]) or objects with { id, quantity?, expires_at? }
 * @returns List of saved ingredients
 */
export async function saveIngredient(items: string[] | IngredientItem[]): Promise<OwnedIngredient[]> {
  const refreshToken = await getSupabaseClient().auth.getSession();

  if (!refreshToken.data.session) throw new Error("Failed to retrieve session");

  // Normalize: convert string[] to IngredientItem[] format
  const normalizedItems: IngredientItem[] = items.map(item =>
    typeof item === "string" ? { id: item } : item
  );

  const res = await fetch("/api/ingredients/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
    },
    body: JSON.stringify({ items: normalizedItems })
  });

  if (!res.ok) throw new Error("Failed to save ingredient");

  // Invalidate cache since data has changed
  ownedIngredientsCache = null;

  return (await res.json()).ingredients;
}

/**
 * Remove a single ingredient from a user's inventory
 * 
 * @param id primary key of ingredient from user's inventory
 */
export async function removeIngredients(ids: string[]){
  const refreshToken = await getSupabaseClient().auth.getSession();

  const res = await fetch("/api/ingredients/user",{
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
    },
    body: JSON.stringify({
      ids
    })
  });

  if (!res.ok){
    const errorBody = await res.json().catch(()=>({}));
    const message = errorBody.message || `Error ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  // Invalidate cache since data has changed
  ownedIngredientsCache = null;
}
