"use client";

import { supabase } from "@/lib/supabase/client";
import { create } from "domain";
import { useEffect, useState } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";

interface Ingredient {
  category: string;
  created_at: string;
  id: string;
  name: string;
  normalized_name: string;
}

interface OwnedIngredient {
  id: string;
  quantity: number;
  ingredient: Ingredient;
}

export default function Home() {

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ownedIngredients, setOwnedIngredients] = useState<OwnedIngredient[]>([]);

  useEffect(()=>{
    async function fetchIngredients(){
      const data = await getAllIngredients();
      setIngredients(data);
    }

    async function fetchOwnedIngredients(){
      const data = await getOwnedIngredients();
      setOwnedIngredients(data);
    }

    fetchIngredients();
    fetchOwnedIngredients();
  },[]);

  useEffect(()=>{
    console.log("hello")
  },[ingredients]);

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

        <OwnedIngredientsPane setOwnedIngredients={setOwnedIngredients} ownedIngredients={ownedIngredients}/>
      </div>
    </div>
  );
}

function OwnedIngredientsPane({setOwnedIngredients, ownedIngredients}: {
  setOwnedIngredients: (ownedIngredients: OwnedIngredient[]) => void,
  ownedIngredients: OwnedIngredient[]
}) {

  return (
    <div className="card mt-4 flex-ccl gap-1">
      {ownedIngredients.map((ownedIngredient) => (
        <div key={ownedIngredient.id}
          className="flex-rl gap-2 border-highlight border border-solid
            py-1 px-2 rounded-xl hover:bg-highlight duration-150"
        >
          <p>{ownedIngredient.ingredient.name}</p>

          <button onClick={()=>removeIngredient(ownedIngredient.id)}>
            <IoIosCloseCircleOutline className="text-lg fill-warning" />
          </button>
        </div>
      ))}
    </div>
  );

  async function removeIngredient(id: string){
    try{

      const refreshToken = await supabase.auth.getSession();

      const res = await fetch("/api/ingredients/user",{
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
        },
        body: JSON.stringify({
          id
        })
      });

      if (res.status !== 200) throw new Error("Failed to remove ingredient");

      const newOwnedIngredients = ownedIngredients.filter((ownedIngredient) => ownedIngredient.id !== id);    
      setOwnedIngredients(newOwnedIngredients);
    } catch (error) {
      console.error(error);
    }

  }
}

async function getAllIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase.from("ingredients").select("*");
  if (error) throw new Error(error.message);
  return data;
}

async function getOwnedIngredients(): Promise<OwnedIngredient[]> {

  const refreshToken = await supabase.auth.getSession();

  const res = await fetch("/api/ingredients/user",{
    method: "GET",
    headers:{
      'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
    }
  });

  const data = await res.json();
  console.log(data.recipes);
  return data.recipes;
}