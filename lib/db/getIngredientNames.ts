import { createSupabaseServerClient as supabase } from "../supabase/server";

/**
 * Resolves names for a list of ingredient ids from the global ingredient catalog.
 *
 * @param ids - ingredient catalog ids to look up
 * @returns the matching ingredient names (missing ids are skipped)
 */
export default async function getIngredientNames(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];

  const db = await (await supabase())
    .from("ingredients")
    .select("name")
    .in("id", ids);

  if (db.error) throw new Error(db.error.message);

  return (db.data ?? []).map((row) => row.name);
}
