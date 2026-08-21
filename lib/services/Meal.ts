import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Generate 5 recipes based on the ingredients in the user's inventory
 * 
 * it takes the user's session token and uses it as reference from backend
 * to determine all of the ingredients by the user
 * 
 * after that it calls the AI to generate 5 recipes
 * 
 * @param filters - optional filters applied to the generated suggestions
 * @returns 5 suggested recipes
 */
export async function getRecommendedMeals(
  filters?: { type?: "soup" | "stir-fried" }
): Promise<Recipe[]> {

  const refreshToken = await getSupabaseClient().auth.getSession();

    const res = await fetch("/api/ai/meal-ideas",{
      method:"POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
      },
      body: JSON.stringify(filters ?? {})
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json() as Recipe[];

    return data;
}