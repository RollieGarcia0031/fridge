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
 */
export default function POST(){
  
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
