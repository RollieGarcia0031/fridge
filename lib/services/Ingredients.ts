import { supabase } from "@/lib/supabase/client";

/**
 * Retrieve all of the ingredients in the user's inventory
 * 
 * It takes the user's access token from the client side
 * and uses it reference and determine the logged user's inventory
 * 
 * @returns - List of owned ingredients
 */
export async function getOwnedIngredients(): Promise<OwnedIngredient[]> {

  const refreshToken = await supabase.auth.getSession();

  const res = await fetch("/api/ingredients/user",{
    method: "GET",
    headers:{
      'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
    }
  });

  const data = await res.json();
  return data.recipes;
}

/**
 * Fetch all of the ingredients from the database
 * 
 * It returns all of the available ingredients that users can choose
 * to add to their inventory
 * @returns 
 */
export async function getAllIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase.from("ingredients").select("*");
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Save a new ingredient in the user's inventory
 * 
 * @param ingredient_id primary key of the ingredient
 */
export async function saveIngredient(ingredient_id: string){
  const refreshToken = await supabase.auth.getSession();

  if (!refreshToken.data.session) return;

  const res = await fetch("/api/ingredients/user",{
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
    },
    body: JSON.stringify({ ingredient_id })
  })

  if (!res.ok) throw new Error("Failed to save ingredient");
}

/**
 * Remove a single ingredient from a user's inventory
 * 
 * @param id primary key of ingredient from user's inventory
 */
export async function removeIngredient(id: string){
  const refreshToken = await supabase.auth.getSession();

  const res = await fetch("/api/ingredients/user",{
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
    },
    body: JSON.stringify({
      id
    })
  });

  if (res.status !== 200) throw new Error("Failed to remove ingredient");
}