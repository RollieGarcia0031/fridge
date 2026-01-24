import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
/**
 * get list of all ingredients available in the system
 *
 * Response: [
 *  {
 *    id: uuid,
 *    name: egg,
 *    category: protein
 *   }
 * ]
 * 
 * Example usage:
 * 
 * const res = await fetch(`/api/ingredients?search=${query}`)
 * 
 * const { ingredients } = await res.json()
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")?.toLowerCase()

  let query = supabase
    .from("ingredients")
    .select("id, name, category")
    .order("name", { ascending: true })

  if (search) {
    query = query.ilike("normalized_name", `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ingredients: data })
}


/**
 * add ingredient's to user's inventory
 *
 * Request:
 * {
 *    id: uuid // primary key of the ingredient in ingredients table
 * }
 * 
 * Response: {
 *    id: uuid // primary key in user_ingredients table
 * }
 */
export async function POST(req: Request) {
  // 1. Auth
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

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
  const { data: ingredient, error: ingredientError } = await supabase
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
  const { data: userIngredient, error } = await supabase
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
 * update the quantity of selected ingredients
 */
export  function PUT(){
  return NextResponse.json({});
}

/**
 * Remove the ingredient from the database
 *
 * Request:{ id: uuid }
 */
export async function DELETE(req: Request){

}
