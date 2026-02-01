"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Recipe() {

  const router = useRouter();

  const recipeRef = useRef<Recipe | null>(null);
  const instructionRef = useRef<Instrcutions | null>(null);
  const loadingRef = useRef(false);

  async function refreshInstructions(){
    try {
      loadingRef.current = true;
      if (recipeRef.current === null) throw new Error("recipe is null");

      const instructions = await fetchInstruction(recipeRef.current!);
      instructionRef.current = instructions;
      
    } catch (e){
      console.log(e);
    } finally {
      loadingRef.current = false;
    }
  }

  useEffect(()=>{
    const sessionRecipe = sessionStorage.getItem("recipe");
    const recipe = sessionRecipe ? JSON.parse(sessionRecipe) : null;

    recipeRef.current = recipe;
    console.log('updated recipe');
    if (!recipe) {
      router.push("/");
    }
  }, []);

  useEffect(()=>{
    refreshInstructions();
    console.log(instructionRef.current);
  }, [recipeRef])


  return (
    <div>
      <h1>Recipe</h1>

      {loadingRef.current && <p>Loading...</p>}

      {instructionRef.current && <InstructionPanel instructions={instructionRef.current} />}

    </div>
  );
}

function InstructionPanel({instructions}:{instructions: Instrcutions}){
  return (
    <div>
      <p className="text-lg">
        {instructions.name}
      </p>

      <p className="text-sm">
        {instructions.cook_time_minutes} Minutes
      </p>
    </div>
  )
}

async function fetchInstruction(recipe: Recipe): Promise<Instrcutions>{
  const refreshToken = await supabase.auth.getSession();

  const response = await fetch("/api/ai/meal-recipe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${refreshToken.data.session?.access_token}`
    },

    body: JSON.stringify({
      recipe_name: recipe.recipe_name,
      ingredients: recipe.ingredients
    })
  });

  const data = await response.json();

  console.log(data);

  return data;
}