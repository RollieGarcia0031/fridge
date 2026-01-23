import { NextResponse } from "next/server";
import { createSupabaseServerClient as supabase } from "@/lib/supabase/server";
import { getFullRecipeFlow } from "@/lib/ai-flow/getFullRecipe";
/**
 * 
 * Request: {
 *  recipe_name: "egg pie",
 *  ingredients: ["egg", "sugar", "flour"]
 * }
 */
export async function POST(req: Request){
  try {
    const bearer = req.headers.get('Authorization');

    if (!bearer) return new NextResponse(null,{status: 401});

    const token = bearer.replace("Bearer ", '');
    const {data, error} = await (await supabase()).auth.getUser(token);

    if (error || !data.user.id) return new NextResponse(null, {status: 401});

    const { ingredients, recipe_name } = await req.json();    
    
    if (!recipe_name || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const result = await getFullRecipeFlow({ingredients, recipe_name});

    return new NextResponse(JSON.stringify(result), {
      status: 200
    })
    
  } catch (error) {
    console.log(error);
    return new NextResponse("Error occured during instruction generation", {
      status: 500
    })
  }

}
