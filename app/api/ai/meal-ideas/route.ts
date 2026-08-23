import { generateRecipeFlow } from "@/lib/ai-flow/generateRecipe";
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
 *     { "type": "soup" | "stir-fried", "nutrientPriority": "muscle" | "bone" | "sick" }
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
    } catch {
      // no body provided — keep filter unset
    }

    const ingredients = await getUserRecipes(data.user.id);

    const result = await generateRecipeFlow({ingredients, type, nutrientPriority});

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
