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
    if (!recipe) {
      router.push("/");
    }
  }, []);

  useEffect(()=>{
    refreshInstructions();
  }, [recipeRef])


  // ! IMPORTANT FIX ME
  // TODO : fix bug, instruction doesn't load upon updating instructionsref, it only loads
  // TODO : when manually updating the page then allowing hmr to auto refresh
  return (
    <div>

      {loadingRef.current && <p>Loading...</p>}

      {instructionRef.current && <InstructionPanel instructionsRef={instructionRef} />}

    </div>
  );
}

function InstructionPanel({instructionsRef}:{
  instructionsRef: React.RefObject<Instrcutions | null>
}){

  useEffect(()=>{
    console.log('rendering instruction panel');
    console.log(instructionsRef.current);
  }, [instructionsRef]);

  const instructions = instructionsRef.current;

  if (!instructions) return <p>Loading...</p>;

  return (
    <div className="card w-200">
      <p className="text-lg">
        {instructions.name}
      </p>

      <p className="text-sm space-x-4">
        <span>
          {instructions.cook_time_minutes} Minutes
        </span>

        <span>
          {instructions.servings} Servings
        </span>
      </p>


      <div className="mt-4">
        <p className="my-2 font-semibold">
          Instructions
        </p>

        <div className="space-y-4">
          {instructions.steps.map((step) => (
            <div key={step.order}>
              <p className="text-sm">
                {step.order}. {step.title}
              </p>
              <p className="text-sm text-text-muted">
                {step.instruction}
              </p>
            </div>
          ))}
        </div>

      </div>
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