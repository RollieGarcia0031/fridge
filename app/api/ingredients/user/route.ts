import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createSupabaseServerClient as supabase } from "@/lib/supabase/server";
import getUserRecipes from "@/lib/db/getUserRecipes";

/**
 * Obtain the list of ingredients owned by the logged user
 *
 */
export async function GET(req: Request){

  try {
    const bearer = req.headers.get("Authorization");
    if (!bearer) return new NextResponse("No bearer recieved",{status:401});
  
    const token = bearer?.replace("Bearer ", '');
    const { data: {user}, error } = await (await supabase()).auth.getUser(token);
  
    if (error || !user?.id) return new NextResponse("user not found", {status: 401});
  
    const db = (await supabase())
      .from("user_ingredients")
      .select(`
        id,
        quantity,
        ingredient:ingredients (
          id,
          name,
          category
        )
      `)
      .eq('user_id', user.id);

    const recipes = (await db).data;

    return new NextResponse(JSON.stringify({ recipes }), {status: 200});
  } catch (error){
    console.error(error);
    return new NextResponse("Unkown error occured", {status: 500});
  }
}

/**
 * add ingredient's to user's inventory
 *
 * Request:
 * {
 *    ids: string[] // array of primary keys of the ingredient
 * }
 */
export async function POST(req: Request) {
  // 1. Auth
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: authError } = await (await supabase()).auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  const body = await req.json();
  const { ids } = body;

  if (!ids || !Array.isArray(ids)) {
    return NextResponse.json(
      { error: "ids is required" },
      { status: 400 }
    )
  }

  // 3. Validate ingredient exists
  const { data: ingredients, error: ingredientError } = await (await supabase())
    .from("ingredients")
    .select("id, name, category")
    .in("id", ids);

  if (ingredientError || ingredients.length != ids.length) {
    return NextResponse.json(
      { error: "Invalid ingredient_id" },
      { status: 400 }
    )
  }

  const rowsToUpsert = ids.map(ingredient_id => ({
    user_id: user.id,
    ingredient_id
  }));

  // 4. Insert into user_ingredients
  const { data: addedIngredients, error } = await (await supabase())
    .from("user_ingredients")
    .upsert(
      rowsToUpsert, {
        onConflict: "user_id,ingredient_id"
      }
    )
    .select(`
      id,
      created_at,
      ingredient:ingredients (
        id,
        name,
        category
      )
    `);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidateTag("user-ingredients", "max");

  // 5. Return result (new added ingredients)
  return NextResponse.json(
    { ingredients: addedIngredients },
    { status: 201 }
  )
}

/**
 * remove ingredient from user's inventory
 * 
 * Request:
 * {
 *    ids: uuid[] // the primary id of user_ingredient to be removed ( array of string ) 
 * }
 */
export async function DELETE(req: Request){

  try {
    const bearer = req.headers.get("Authorization");

    if (!bearer) return new NextResponse(null, {status: 401});

    const token = bearer.replace("Bearer ", '');
    const { data: { user }, error } = await (await supabase()).auth.getUser(token)

    if (error || !user?.id) throw new NextResponse(null, {status: 401});

    const { ids } = await req.json();
    if (!ids) return new NextResponse("Incomplete request", {status: 403});

    const query = await (await supabase()).from('user_ingredients')
      .delete()
      .eq('user_id', user.id)
      .in('id', [...ids]);

    if (query.error) {
      console.error(query.error);
      throw query.error;
    };

    revalidateTag("user-ingredients", "max");

    return NextResponse.json(null, { status: 200 });
  } catch (error){
    console.log(error);
    let message = "Unkown error occured";
    if (error instanceof Error) message = error.message;
    return new NextResponse(message, {status: 500});
  }
}
