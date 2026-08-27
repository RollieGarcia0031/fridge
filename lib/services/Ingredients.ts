import { getSupabaseClient } from "@/lib/supabase/client";

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
 * Save a new ingredient in the user's inventory
 * 
 * @param ingredient_ids array of primary keys of the ingredient
 * @returns 
 */
export async function saveIngredient(ingredient_ids: string[]):Promise<OwnedIngredient[]>{
  const refreshToken = await getSupabaseClient().auth.getSession();

  if (!refreshToken.data.session) throw new Error("Failed to retrieve session");

  const res = await fetch("/api/ingredients/user",{
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
    },
    body: JSON.stringify({ ids: ingredient_ids })
  })

  if (!res.ok) throw new Error("Failed to save ingredient");

  // Invalidate cache since data has changed
  ownedIngredientsCache = null;

  return (await res.json()).ingredients;
}

/**
 * Update (or set) the quantity / expiry of an owned ingredient
 *
 * Uses the upsert semantics of POST /api/ingredients/user keyed on
 * (user_id, ingredient_id), so it can both create and update a row.
 *
 * @param ingredient_id primary key of the ingredient
 * @param metadata optional quantity and expiry to store
 */
export async function updateOwnedIngredient(
  ingredient_id: string,
  metadata: { quantity?: string; expires_at?: string } = {},
): Promise<OwnedIngredient[]> {
  const refreshToken = await getSupabaseClient().auth.getSession();

  if (!refreshToken.data.session) throw new Error("Failed to retrieve session");

  const res = await fetch("/api/ingredients/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken.data.session?.access_token}`,
    },
    body: JSON.stringify({ rows: [{ ingredient_id, ...metadata }] }),
  });

  if (!res.ok) throw new Error("Failed to update ingredient");

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
