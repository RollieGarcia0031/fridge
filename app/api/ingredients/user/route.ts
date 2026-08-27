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
        expires_at,
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
 * add ingredient's to user's inventory (or update their quantity / expiry)
 *
 * Request (ids form — add only):
 * {
 *    ids: string[] // array of primary keys of the ingredient
 * }
 *
 * Request (rows form — add or update with metadata):
 * {
 *    rows: {
 *      ingredient_id: string,
 *      quantity?: string,
 *      expires_at?: string // ISO date (yyyy-mm-dd)
 *    }[]
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
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  const { ids, rows } = body as { ids?: unknown; rows?: unknown };

  const hasIds = Array.isArray(ids) && ids.length > 0;
  const hasRows = Array.isArray(rows) && rows.length > 0;

  if (!hasIds && !hasRows) {
    return NextResponse.json(
      { error: "ids or rows is required" },
      { status: 400 }
    )
  }

  if (hasRows && !rows.every((row) => row && typeof row === "object" && typeof (row as { ingredient_id?: unknown }).ingredient_id === "string")) {
    return NextResponse.json(
      { error: "rows must contain ingredient_id" },
      { status: 400 }
    )
  }

  let entries: Array<{ ingredient_id: string; quantity?: string; expires_at?: string }>;

  if (hasRows) {
    entries = rows as Array<{ ingredient_id: string; quantity?: string; expires_at?: string }>;
  } else {
    entries = (ids as string[]).map((ingredient_id: string) => ({ ingredient_id }));
  }

  const ingredientIds = entries.map((e) => e.ingredient_id);

  // 3. Validate ingredient exists
  const { data: ingredients, error: ingredientError } = await (await supabase())
    .from("ingredients")
    .select("id, name, category")
    .in("id", ingredientIds);

  if (ingredientError || ingredients.length != ingredientIds.length) {
    return NextResponse.json(
      { error: "Invalid ingredient_id" },
      { status: 400 }
    )
  }

  const rowsToUpsert = entries.map(({ ingredient_id, quantity, expires_at }) => {
    const row: Record<string, unknown> = {
      user_id: user.id,
      ingredient_id
    };

    if (quantity !== undefined) row.quantity = quantity;
    if (expires_at !== undefined && expires_at !== "") row.expires_at = expires_at;
    if (expires_at === "") row.expires_at = null;

    return row;
  });

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
      quantity,
      expires_at,
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
