"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { CirclesWithBar } from 'react-loader-spinner';

export default function Recipe() {
  const router = useRouter();

  // state for list of retrieved recipe of logged user
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  // state for fetched instruction by ai-flow
  const [instructions, setInstructions] = useState<Instrcutions | null>(null);
  // loading state for screen updates
  const [loading, setLoading] = useState(false); 

  /**
   * reloads the instructions from AI
   */
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
    // obtain recipe from session storage
    // it is assumed that before the user opens this page, the user
    // must have selected a meal from the dialog box in dashboard
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
    <div className="card-screen">
      {loading && 
        <div className="flex-cc gap-3">
          <CirclesWithBar
            height="100"
            width="100"
            color="#4fa94d"
            outerCircleColor="#4fa94d"
            innerCircleColor="#4fa94d"
            barColor="#4fa94d"
            ariaLabel="circles-with-bar-loading"
            wrapperStyle={{}}
            wrapperClass=""
            visible={true}
            />

            <p className="text-text-muted text-sm">
              Loading instructions...
            </p>
        </div>
      }

      {instructions && !loading && <InstructionPanel instructions={instructions} />}
    </div>
  );
}


function InstructionPanel({ instructions }: { instructions: Instrcutions }) {

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

/**
 * Fetch the instruction from AI-model
 *
 * @param recipe - saved recipe in the sessionStorage, that is assumed to be selected by the user
 */
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

  return data;
}
