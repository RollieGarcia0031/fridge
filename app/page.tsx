"use client";

import { supabase } from "@/lib/supabase/client";
import { create } from "domain";
import { useEffect, useState } from "react";

export default function Home() {

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(()=>{
    async function fetchIngredients(){
      const data = await getAllIngredients();
      setIngredients(data);
    }

    fetchIngredients();
  },[]);

  return (
    <div className="card-screen">
      <div>
        
        <div className="w-full">
          <select
            className="w-full bg-bg-light border-border border border-solid py-2 px-4 rounded-sm">
            {ingredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </option>
            ))}
          </select>
        </div>

        <button className="mt-4 bg-bg-light border-border border border-solid w-[20rem]
          py-2 px-4 rounded-sm hover:bg-highlight duration-150">
          Add
        </button>
      </div>
    </div>
  );
}

interface Ingredient {
  category: string;
  created_at: string;
  id: string;
  name: string;
  normalized_name: string;
}
async function getAllIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase.from("ingredients").select("*");
  if (error) throw new Error(error.message);
  return data;
}
