import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createSupabaseServerClient as supabase } from "@/lib/supabase/server";

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
 * add ingredients to user's inventory
 *
 * Request (new format):
 * {
 *    items: { id: string, quantity?: number, expires_at?: string }[]
 * }
 *
 * Legacy format (still accepted):
 * {
 *    ids: string[]
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

  // 2. Parse body — support both { items: [...] } and legacy { ids: [...] }
  const body = await req.json();
  const { items, ids } = body;

  let normalizedItems: {
    id: string;
    /** present only when the client explicitly set it; "" clears the stored value */
    quantity?: string;
    /** present only when the client explicitly set it; "" clears the stored value */
    expires_at?: string;
  }[] = [];

  if (items && Array.isArray(items)) {
    const rejected = items.find(
      (item: unknown) =>
        item == null ||
        typeof item !== "object" ||
        !("id" in item) ||
        typeof (item as Record<string, unknown>).id !== "string" ||
        !(item as Record<string, unknown>).id
    );
    if (rejected !== undefined) {
      return NextResponse.json(
        { error: "Each item must be an object with a string id" },
        { status: 400 }
      );
    }

    normalizedItems = items.map((item: { id: string; quantity?: number | string | null; expires_at?: string | null }) => {
      const normalized: { id: string; quantity?: string; expires_at?: string } = { id: item.id };

      // absent -> do not touch the stored value; "" -> clear it
      if (item.quantity !== undefined && item.quantity !== null) {
        normalized.quantity = item.quantity === "" ? "" : String(item.quantity);
      }
      if (item.expires_at !== undefined && item.expires_at !== null) {
        normalized.expires_at = item.expires_at;
      }

      return normalized;
    });
  } else if (ids && Array.isArray(ids)) {
    normalizedItems = ids.map((id: string) => ({ id }));
  } else {
    return NextResponse.json(
      { error: "items (array of { id, quantity?, expires_at? }) is required" },
      { status: 400 }
    );
  }

  if (normalizedItems.length === 0) {
    return NextResponse.json(
      { error: "items must not be empty" },
      { status: 400 }
    );
  }

  // 3. Validate ingredients exist
  const ingredientIds = normalizedItems.map(item => item.id);
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

  // 4. Insert into user_ingredients
  //    Each item only carries the optional fields the request explicitly
  //    provided, so updating one field can never overwrite the other.
  //    Items are grouped by which optional fields they carry; every group is
  //    upserted separately so untouched columns are preserved on conflict.
  const rowGroups = new Map<
    string,
    Record<string, unknown>[]
  >();

  for (const item of normalizedItems) {
    const base: Record<string, unknown> = {
      user_id: user.id,
      ingredient_id: item.id,
    };
    if (item.quantity !== undefined) base.quantity = item.quantity;
    if (item.expires_at !== undefined) base.expires_at = item.expires_at || null;

    const shape = `${item.quantity !== undefined ? "q" : ""}${item.expires_at !== undefined ? "e" : ""}`;
    const group = rowGroups.get(shape) ?? [];
    group.push(base);
    rowGroups.set(shape, group);
  }

  const upsertOpts = { onConflict: "user_id,ingredient_id" as const };
  const selectClause = `
      id,
      quantity,
      expires_at,
      created_at,
      ingredient:ingredients (
        id,
        name,
        category
      )
    `;

  let addedIngredients: unknown[] = [];

  for (const rows of rowGroups.values()) {
    const { data, error } = await (await supabase())
      .from("user_ingredients")
      .upsert(rows, upsertOpts)
      .select(selectClause);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    addedIngredients = addedIngredients.concat(data ?? []);
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
