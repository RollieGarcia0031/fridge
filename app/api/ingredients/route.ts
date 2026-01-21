import { NextResponse } from "next/server";

/**
 * get logged user's ingredients
 *
 * Response: [
 *  {
 *    id: uuid,
 *    name: egg,
 *    category: protein
 *   }
 * ]
 */
export function GET(){
  return NextResponse.json({});
}

/**
 * add ingredient's to user's inventory
 *
 * Request:
 * {
 *    name: egg,
 *    category: protein
 * }
 * 
 * Response: {
 *    id: uuid
 * }
 */
export function POST(){
  return NextResponse.json({});
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
export function DELETE(){
  return NextResponse.json({});
}
