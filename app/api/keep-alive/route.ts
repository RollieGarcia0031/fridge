import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Keep-alive endpoint — touches the `keep_alive` table so the Supabase
 * free-tier database doesn't go inactive.
 *
 * GET /api/keep-alive
 *   200 { ok: true, updated_at: "<iso-timestamp>" }
 *   500 { error: "<message>" }
 */
export async function GET() {
  const supabase = getSupabaseAdminClient();

  // Update the single sentinel row's timestamp
  const { data, error } = await (supabase
    .from("keep_alive") as any)
    .update({ updated_at: new Date().toISOString() })
    .select("updated_at")
    .single();

  if (error) {
    console.error("[keep-alive] DB write failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated_at: data.updated_at });
}
