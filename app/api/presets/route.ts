import { NextResponse } from "next/server";
import { createSupabaseServerClient as supabase } from "@/lib/supabase/server";

/**
 * Obtain the list of fridge presets owned by the logged-in user
 *
 * Response:
 * {
 *   presets: Preset[]
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
      .from("fridge_presets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) throw queryError;

    return NextResponse.json({ presets: data }, { status: 200 });
  } catch (e) {
    console.error(e);
    return new NextResponse("Unknown error occurred", { status: 500 });
  }
}

/**
 * Create or update a fridge preset.
 *
 * Request:
 * {
 *   name: string;
 *   ingredients: PresetIngredient[];
 * }
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new NextResponse(null, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await (await supabase()).auth.getUser(token);
    if (error || !user?.id) return new NextResponse(null, { status: 401 });

    const body = await req.json();
    const { name, ingredients } = body;

    if (
      typeof name !== "string" ||
      !name ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return NextResponse.json(
        { error: "name (string) and ingredients (non-empty array) are required" },
        { status: 400 }
      );
    }

    const { data, error: upsertError } = await (await supabase())
      .from("fridge_presets")
      .upsert(
        {
          user_id: user.id,
          name,
          ingredients,
        },
        { onConflict: "user_id,name" }
      )
      .select("*")
      .single();

    if (upsertError) {
      console.error(upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ preset: data }, { status: 201 });
  } catch (e) {
    console.error(e);
    let message = "Unknown error occurred";
    if (e instanceof Error) message = e.message;
    return new NextResponse(message, { status: 500 });
  }
}

/**
 * Delete a fridge preset.
 *
 * Request:
 * {
 *   id: string
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

    const { id } = await req.json();
    if (!id) return new NextResponse("Incomplete request", { status: 403 });

    const query = await (await supabase())
      .from("fridge_presets")
      .delete()
      .eq("user_id", user.id)
      .eq("id", id);

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
