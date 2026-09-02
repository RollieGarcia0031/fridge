import { NextResponse } from "next/server";
import { createSupabaseServerClient as supabase } from "@/lib/supabase/server";

/**
 * Obtain the list of recipes saved by the logged-in user
 *
 * Response:
 * {
 *   recipes: {
 *     id: string;
 *     recipe_name: string;
 *     description: string;
 *     ingredients: string[];
 *     instructions: Instructions | null;
 *     created_at: string;
 *   }[]
 * }
 */
export async function GET(req: Request) {
  try {
    const bearer = req.headers.get("Authorization");
    if (!bearer) return new NextResponse("No bearer received", { status: 401 });

    const token = bearer.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await (await supabase()).auth.getUser(token);

    if (error || !user?.id)
      return new NextResponse("user not found", { status: 401 });

    const { data, error: queryError } = await (await supabase())
      .from("saved_recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) throw queryError;

    return NextResponse.json({ recipes: data }, { status: 200 });
  } catch (e) {
    console.error(e);
    return new NextResponse("Unknown error occurred", { status: 500 });
  }
}

/**
 * Save (upsert) a recipe in the logged-in user's collection.
 *
 * Request:
 * {
 *   recipe: {
 *     recipe_name: string;
 *     description: string;
 *     ingredients: string[];
 *     instructions?: Instructions; // full AI output, optional
 *   }
 * }
 */
export async function POST(req: Request) {
  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new NextResponse(null, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await (await supabase()).auth.getUser(token);
    if (error || !user?.id) return new NextResponse(null, { status: 401 });

    // 2. Parse + validate body
    const body = await req.json();
    const recipe = body?.recipe;

    if (
      recipe == null ||
      typeof recipe !== "object" ||
      typeof recipe.recipe_name !== "string" ||
      !recipe.recipe_name ||
      typeof recipe.description !== "string" ||
      !Array.isArray(recipe.ingredients) ||
      recipe.ingredients.some((ing: unknown) => typeof ing !== "string") ||
      (recipe.instructions !== undefined && recipe.instructions !== null && typeof recipe.instructions !== "object")
    ) {
      return NextResponse.json(
        { error: "recipe must include recipe_name, description and ingredients, with optional instructions" },
        { status: 400 }
      );
    }

    const row: Record<string, unknown> = {
      user_id: user.id,
      recipe_name: recipe.recipe_name,
      description: recipe.description,
      ingredients: recipe.ingredients,
    };
    if (recipe.instructions !== undefined && recipe.instructions !== null) {
      row.instructions = recipe.instructions;
    }

    // 3. Upsert on (user_id, recipe_name); re-saving updates the stored details
    const { data, error: upsertError } = await (await supabase())
      .from("saved_recipes")
      .upsert(row, { onConflict: "user_id,recipe_name" })
      .select("*")
      .single();

    if (upsertError) {
      console.error(upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ recipe: data }, { status: 201 });
  } catch (e) {
    console.error(e);
    let message = "Unknown error occurred";
    if (e instanceof Error) message = e.message;
    return new NextResponse(message, { status: 500 });
  }
}

/**
 * Remove recipes from the logged-in user's collection.
 *
 * Request:
 * {
 *   ids: uuid[] // primary keys of the saved_recipes rows to remove
 * }
 */
export async function DELETE(req: Request) {
  try {
    const bearer = req.headers.get("Authorization");
    if (!bearer) return new NextResponse(null, { status: 401 });

    const token = bearer.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await (await supabase()).auth.getUser(token);
    if (error || !user?.id) return new NextResponse(null, { status: 401 });

    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids))
      return new NextResponse("Incomplete request", { status: 403 });

    const query = await (await supabase())
      .from("saved_recipes")
      .delete()
      .eq("user_id", user.id)
      .in("id", ids);

    if (query.error) {
      console.error(query.error);
      throw query.error;
    }

    return NextResponse.json(null, { status: 200 });
  } catch (e) {
    console.error(e);
    let message = "Unknown error occurred";
    if (e instanceof Error) message = e.message;
    return new NextResponse(message, { status: 500 });
  }
}