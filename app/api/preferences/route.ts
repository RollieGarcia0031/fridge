import { NextResponse } from "next/server";
import { createSupabaseServerClient as supabase } from "@/lib/supabase/server";
import { DIETARY_RESTRICTIONS } from "@/lib/ai-flow/dietary";

/**
 * Obtain the dietary preferences for the logged-in user.
 *
 * Response:
 * {
 *   preferences: {
 *     user_id: string;
 *     dietary_restrictions: DietaryRestriction[];
 *   }
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
      .from("user_preferences")
      .select("user_id, dietary_restrictions, created_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (queryError) throw queryError;

    return NextResponse.json(
      {
        preferences:
          data ?? { user_id: user.id, dietary_restrictions: [] },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return new NextResponse("Unknown error occurred", { status: 500 });
  }
}

/**
 * Save (upsert) the dietary preferences for the logged-in user.
 *
 * Request:
 * {
 *   dietaryRestrictions: DietaryRestriction[]
 * }
 *
 * Response:
 * {
 *   preferences: {
 *     user_id: string;
 *     dietary_restrictions: DietaryRestriction[];
 *     created_at: string;
 *     updated_at: string;
 *   }
 * }
 */
export async function PUT(req: Request) {
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
    const { dietaryRestrictions } = body ?? {};

    if (!Array.isArray(dietaryRestrictions)) {
      return NextResponse.json(
        { error: "dietaryRestrictions (array of strings) is required" },
        { status: 400 }
      );
    }

    const seen = new Set<DietaryRestriction>();
    const normalized: DietaryRestriction[] = [];
    for (const raw of dietaryRestrictions) {
      if (typeof raw !== "string") {
        return NextResponse.json(
          { error: "each dietary restriction must be a string" },
          { status: 400 }
        );
      }
      const value = raw.trim().toLowerCase() as DietaryRestriction;
      if (!DIETARY_RESTRICTIONS.includes(value)) {
        return NextResponse.json(
          { error: `unsupported dietary restriction: "${raw}"` },
          { status: 400 }
        );
      }
      if (!seen.has(value)) {
        seen.add(value);
        normalized.push(value);
      }
    }

    const { data, error: upsertError } = await (await supabase())
      .from("user_preferences")
      .upsert(
        { user_id: user.id, dietary_restrictions: normalized },
        { onConflict: "user_id" }
      )
      .select("user_id, dietary_restrictions, created_at, updated_at")
      .single();

    if (upsertError) {
      console.error(upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ preferences: data }, { status: 200 });
  } catch (e) {
    console.error(e);
    let message = "Unknown error occurred";
    if (e instanceof Error) message = e.message;
    return new NextResponse(message, { status: 500 });
  }
}