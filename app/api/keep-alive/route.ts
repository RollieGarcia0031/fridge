import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Keep-alive endpoint — touches the `keep_alive` table so the Supabase
 * free-tier database doesn't go inactive.
 *
 * GET /api/keep-alive
 *   200 { ok: true, updated_at: "<iso-timestamp>" }
 *   401 { error: "Unauthorized" }
 *   500 { error: "<message>" }
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.KEEP_ALIVE_TOKEN;

  // Protect route if KEEP_ALIVE_TOKEN is configured in environment
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  // Insert a new row on every ping
  const { data, error } = await (supabase
    .from("keep_alive") as any)
    .insert({ updated_at: new Date().toISOString() })
    .select("updated_at")
    .single();

  if (error) {
    console.error("[keep-alive] DB write failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated_at: data.updated_at });
}
