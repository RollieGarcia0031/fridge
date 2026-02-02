"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Recipe() {
  const router = useRouter();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [instructions, setInstructions] = useState<Instrcutions | null>(null);
  const [loading, setLoading] = useState(false); 

  async function refreshInstructions() {
    try {
      setLoading(true);
      if (recipe === null) throw new Error("recipe is null");

      const fetchedInstructions = await fetchInstruction(recipe);
      setInstructions(fetchedInstructions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const sessionRecipe = sessionStorage.getItem("recipe");
    const parsedRecipe = sessionRecipe ? JSON.parse(sessionRecipe) : null;

    setRecipe(parsedRecipe);
    if (!parsedRecipe) {
      router.push("/");
    }
  }, []);

  useEffect(() => {
    if (recipe && !loading) {
      refreshInstructions();
    }
  }, [recipe]);
  return (
    <div>
      {loading && <p>Loading...</p>}

      {instructions && <InstructionPanel instructions={instructions} />}
    </div>
  );
}


function InstructionPanel({ instructions }: { instructions: Instrcutions }) {
  useEffect(() => {
    console.log("rendering instruction panel");
    console.log(instructions);
  }, [instructions]);

  if (!instructions) return <p>Loading...</p>;

  return (
    <div className="card w-200">
      <p className="text-lg">{instructions.name}</p>

      <p className="text-sm space-x-4">
        <span>{instructions.cook_time_minutes} Minutes</span>

        <span>{instructions.servings} Servings</span>
      </p>

      <div className="mt-4">
        <p className="my-2 font-semibold">Instructions</p>

        <div className="space-y-4">
          {instructions.steps.map((step) => (
            <div key={step.order}>
              <p className="text-sm">
                {step.order}. {step.title}
              </p>
              <p className="text-sm text-text-muted">{step.instruction}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function fetchInstruction(recipe: Recipe): Promise<Instrcutions> {
  const refreshToken = await supabase.auth.getSession();

  const response = await fetch("/api/ai/meal-recipe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken.data.session?.access_token}`,
    },

    body: JSON.stringify({
      recipe_name: recipe.recipe_name,
      ingredients: recipe.ingredients,
    }),
  });

  const data = await response.json();

  console.log(data);

  return data;
}