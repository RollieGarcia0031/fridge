import { generateRecipeFlow } from "@/lib/ai-flow/generateRecipe";
import getIngredientNames from "@/lib/db/getIngredientNames";
import getUserRecipes from "@/lib/db/getUserRecipes";
import { createSupabaseServerClient as supabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * returns 5 suggested meal based on the available ingredients of user
 *
 * request:
 *   Headers: 
 *     Authorization: Bearer <Supabase token>
 *   Body (optional):
 *     { "type": "soup" | "stir-fried", "nutrientPriority": "muscle" | "bone" | "sick", "allowSuggestedIngredients": boolean, "ingredientIds": string[] }
 *
 * note:
 *   ingredientIds are merged with the user's owned inventory (e.g. items queued
 *   in market mode but not yet saved to the fridge).
 *
 * response:
 * [
 *   {
 *      recipe_name: string;
 *      ingredients: string[];
 *      descriptin: string;
 *   }
 * ]
 */
export async function POST(req: Request){

  try {
    // auth middleware
    const auth = req.headers.get('Authorization');  
    if (!auth)
      return new NextResponse(null, {status: 401});

    const token = auth.replace('Bearer ','');
    const { data, error } = await (await supabase()).auth.getUser(token);

    if (error || !data.user)
      return new NextResponse(null,{status: 401});
  
    // optional dish type filter from request body; ignored when absent/invalid
    let type: "soup" | "stir-fried" | undefined;
    // optional nutrient priority filter from request body; ignored when absent/invalid
    let nutrientPriority: "muscle" | "bone" | "sick" | undefined;
    // optional flag allowing the AI to suggest ingredients beyond the user's inventory; default false
    let allowSuggestedIngredients: boolean | undefined;
    // optional ingredient ids to consider alongside the user's inventory (market mode queue)
    let ingredientIds: string[] | undefined;
    try {
      const body = await req.json();
      if (body?.type === "soup" || body?.type === "stir-fried")
        type = body.type;
      if (
        body?.nutrientPriority === "muscle" ||
        body?.nutrientPriority === "bone" ||
        body?.nutrientPriority === "sick"
      )
        nutrientPriority = body.nutrientPriority;
      if (body?.allowSuggestedIngredients === true)
        allowSuggestedIngredients = true;
      if (Array.isArray(body?.ingredientIds))
        ingredientIds = body.ingredientIds.filter(
          (id: unknown): id is string => typeof id === "string" && id.length > 0,
        );
    } catch {
      // no body provided — keep filter unset
    }

    const ingredients = await getUserRecipes(data.user.id);

    // merge market-mode queued ingredients with the owned inventory (deduped)
    if (ingredientIds && ingredientIds.length > 0) {
      const ownedNames = new Set(ingredients);
      const queuedNames = (await getIngredientNames(ingredientIds))
        .filter((name) => !ownedNames.has(name));
      ingredients.push(...queuedNames);
    }

    const result = await generateRecipeFlow({ingredients, type, nutrientPriority, allowSuggestedIngredients});

    return new NextResponse(JSON.stringify(result),{
      status: 200
    })

  } catch (e){
    console.log(e);
    return new NextResponse(
      JSON.stringify({error: "Unknown error has occured!"}), {
      status: 500
    })
  }
  
}
