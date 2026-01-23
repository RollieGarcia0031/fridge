import { generateRecipeFlow } from "@/lib/ai-flow/generateRecipe";
import getUserRecipes from "@/lib/db/getUserRecipes";
import { createSupabaseServerClient as supabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";


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
  
    const ingredients = await getUserRecipes(data.user.id);

    const result = await generateRecipeFlow({ingredients});

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
