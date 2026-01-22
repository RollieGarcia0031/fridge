import { generateRecipeFlow } from "@/lib/ai-flow/generateRecipe";
import getUserRecipes from "@/lib/db/getUserRecipes";
import { createSupabaseServerClient as supabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";


export async function POST(req: Request){

  try {
    // auth middleware
    const auth = req.headers.get('authorization');  
    if (!auth)
      throw new NextResponse(null, {status: 401});

    const token = auth.replace('Bearer','');
    const { data, error } = await (await supabase()).auth.getUser(token);
  
    if (error || !data.user)
      return new NextResponse(null,{status: 401});
  
    const ingredients = getUserRecipes(data.user.id);

    return new NextResponse(JSON.stringify(ingredients), {
      status: 200
    })

  } catch {

    return new NextResponse(
      JSON.stringify({error: "Unknown error has occured!"}), {
      status: 500
    })
  }
  
}
