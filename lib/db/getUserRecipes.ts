import { createSupabaseServerClient as supabase } from "../supabase/server";

/**
 * Takes a list of ingredients owned by a specific user
 */
export default async function getUserRecipes(userId: string){

    const db = await (await supabase())
      .from('user_ingredients')
      .select(`
        ingredients:ingredients(
          name
        )
      `)
      .eq('user_id',userId)

      if (db.error) throw new Error();

      const data : any[] = db.data;
      return data.map(row => row.ingredients.name);
}
