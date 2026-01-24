import { NextResponse } from "next/server";
import { createSupabaseServerClient as supabase } from "@/lib/supabase/server";
import getUserRecipes from "@/lib/db/getUserRecipes";

/**
 * Obtain the list of ingredients owned by the logged user
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
 *    id: uuid // primary key of the ingredient in ingredients table
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
  const { ingredient_id } = body;

  if (!ingredient_id || typeof ingredient_id !== "string") {
    return NextResponse.json(
      { error: "ingredient_id is required" },
      { status: 400 }
    )
  }

  // 3. Validate ingredient exists
  const { data: ingredient, error: ingredientError } = await (await supabase())
    .from("ingredients")
    .select("id, name, category")
    .eq("id", ingredient_id)
    .single();

  if (ingredientError || !ingredient) {
    return NextResponse.json(
      { error: "Invalid ingredient_id" },
      { status: 400 }
    )
  }

  // 4. Insert into user_ingredients
  const { data: userIngredient, error } = await (await supabase())
    .from("user_ingredients")
    .upsert(
      {
        user_id: user.id,
        ingredient_id: ingredient.id
      },
      {
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
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 5. Return result
  return NextResponse.json(
    { ingredient: userIngredient },
    { status: 201 }
  )
}

/**
 * remove ingredient from user's inventory
 * 
 * Request:
 * {
 *    id: uuid // the primary id of user_ingredient to be removed 
 * }
 */
export async function DELETE(req: Request){

  try {
    const bearer = req.headers.get("Authorization");

    if (!bearer) return new NextResponse(null, {status: 401});

    const token = bearer.replace("Bearer ", '');
    const { data: { user }, error } = await (await supabase()).auth.getUser(token)

    if (error || !user?.id) throw new NextResponse(null, {status: 401});

    const { id } = await req.json();
    if (!id) return new NextResponse("Incomplete request", {status: 403});

    const query = await (await supabase()).from('user_ingredients')
      .delete()
      .eq('user_id', user.id)
      .eq('id', id);

    if (query.error) return new NextResponse("cannot delete", {status: 500});

    return NextResponse.json(null, { status: 200 });
  } catch (error){
    console.log(error);
    return new NextResponse("Unknown error occured", {status: 500});
  }
}