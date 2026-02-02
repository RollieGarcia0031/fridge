"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { VscDebugContinue } from "react-icons/vsc";
import SuggestedDialog from "@/components/SuggestedDialog";

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

  // selected ingredient from UI to add to inventory
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");

  // suggestion dialog
  const suggestionDialogRef = useRef<HTMLDialogElement | null>(null);

  // state for recipe suggestions
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);

  async function fetchOwnedIngredients(){
    const data = await getOwnedIngredients();
    setOwnedIngredients(data);
  }

  async function fetchRecommendedRecipes(){
    const data = await getRecommendedRecipes();
    setSuggestedRecipes(data!);
    console.log(data);
  }

  useEffect(()=>{
    async function fetchIngredients(){
      const data = await getAllIngredients();
      setIngredients(data);
    }

    fetchIngredients();
    fetchOwnedIngredients();
  },[]);

  return (
    <>
    <div className="card-screen">
      <div>
        
        <div className="w-full">
          <select
            value={selectedIngredientId}
            onChange={(e) => setSelectedIngredientId(e.target.value)}
            className="w-full bg-bg-light border-border border border-solid py-2 px-4 rounded-sm">
            {ingredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 gap-2 flex flex-row justify-center items-center">
          <button
            onClick={e=>addIngredient()}
            className="bg-bg-light border-border border border-solid w-[20rem]
            py-2 px-4 rounded-sm hover:bg-highlight duration-150">
            Add
          </button>

          <button
            onClick={()=>openSuggestedIngredients()}
            className="bg-primary p-2 rounded-xl hover:bg-secondary duration-150"
          >
            <VscDebugContinue className="dark:fill-black text-2xl"/>
          </button>
        </div>

        <OwnedIngredientsPane
          setOwnedIngredients={setOwnedIngredients}
          ownedIngredients={ownedIngredients}
        />
      </div>
    </div>
    
    <SuggestedDialog
      ref={suggestionDialogRef}
      setSuggestedRecipes={setSuggestedRecipes}
      suggestedRecipes={suggestedRecipes}
      fetchRecommendedRecipes={fetchRecommendedRecipes}
    />
    </>
  );

  async function addIngredient(){
    try {
      const refreshToken = await supabase.auth.getSession();

      if (!refreshToken.data.session) return;

      const res = await fetch("/api/ingredients/user",{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
        },
        body: JSON.stringify({
          ingredient_id: selectedIngredientId
        })
      })

      if (!res.ok) return console.log(await res.text());

      const data = await res.json();

      fetchOwnedIngredients();
    } catch (error){
      console.log(error);
    }
  }

  function openSuggestedIngredients(){
    suggestionDialogRef.current?.showModal();
    fetchRecommendedRecipes();
  }
}

function OwnedIngredientsPane({setOwnedIngredients, ownedIngredients}: {
  setOwnedIngredients: (ownedIngredients: OwnedIngredient[]) => void,
  ownedIngredients: OwnedIngredient[]
}) {

  return (
    <div>
      {ownedIngredients.length === 0 && <p>No ingredients owned</p>}
      {ownedIngredients.length > 0 &&
        <p className="text-primary font-semibold my-4"
        >
          Owned Ingredients:
        </p>
      }

      <div className="card flex flex-col items-start gap-2 h-80 overflow-y-scroll">
        {ownedIngredients?.map((ownedIngredient) => (
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

async function getRecommendedRecipes(){

  const refreshToken = await supabase.auth.getSession();

  try{
    const res = await fetch("/api/ai/meal-ideas",{
      method:"POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
      }
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();

    return data;
  } catch (error){
    console.log(error);
  }
}