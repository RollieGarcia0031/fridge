"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Oval, TailSpin } from "react-loader-spinner";
import { IoArrowBackOutline, IoTimeOutline, IoPeopleOutline, IoBulbOutline, IoWarningOutline, IoLogoYoutube } from "react-icons/io5";
import { RxBookmark, RxBookmarkFilled } from "react-icons/rx";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getSavedRecipes,
  saveRecipe,
  unlistRecipes,
} from "@/lib/services/Recipes";
import { toast } from "react-toastify";

export default function Recipe() {
  const router = useRouter();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [instructions, setInstructions] = useState<Instructions | null>(null);
  const [loading, setLoading] = useState(false);

  // recipes the user has saved for later
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [isSavingSaved, setIsSavingSaved] = useState(false);

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

    // a saved recipe may carry the full AI output so it opens instantly;
    // otherwise it is a fresh suggestion and must be generated below
    const sessionInstructions = sessionStorage.getItem("instructions");
    if (parsedRecipe && sessionInstructions) {
      try {
        setInstructions(JSON.parse(sessionInstructions));
      } catch {
        setInstructions(null);
      }
    }

    if (!parsedRecipe) {
      router.push("/");
    }
  }, []);

  useEffect(() => {
    getSavedRecipes()
      .then(setSavedRecipes)
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (recipe && !loading && !instructions) {
      refreshInstructions();
    }
  }, [recipe]);

  // the recipe is "saved" when its summary name appears in the user's collection
  const isSaved =
    recipe != null &&
    savedRecipes.some((saved) => saved.recipe_name === recipe.recipe_name);

  async function handleToggleSave() {
    if (recipe === null || instructions === null) return;
    try {
      setIsSavingSaved(true);

      if (isSaved) {
        const saved = savedRecipes.find(
          (saved) => saved.recipe_name === recipe.recipe_name,
        );
        if (saved) {
          await unlistRecipes([saved.id]);
        }
        setSavedRecipes((prev) =>
          prev.filter((saved) => saved.recipe_name !== recipe.recipe_name),
        );
        toast.success("Recipe removed from your collection");
      } else {
        const saved = await saveRecipe({
          recipe_name: recipe.recipe_name,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions,
        });
        setSavedRecipes((prev) => [saved, ...prev]);
        toast.success("Recipe saved to your collection");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update saved recipes");
    } finally {
      setIsSavingSaved(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 md:py-16 w-full">
      <Link 
        href="/" 
        className="btn btn-ghost mb-8 -ml-2 group"
      >
        <IoArrowBackOutline className="text-xl group-hover:-translate-x-1 transition-transform" />
        <span>Back to Fridge</span>
      </Link>

      <div className="min-h-[60dvh] flex flex-col items-center justify-center">
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <TailSpin
              height="80"
              width="80"
              color="var(--primary)"
              ariaLabel="loading"
            />
            <div className="text-center space-y-2">
              <h3 className="animate-pulse">Preparing your recipe...</h3>
              <p className="text-text-muted text-sm">Organizing steps and timing</p>
            </div>
          </motion.div>
        )}

        {!loading && instructions && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <InstructionPanel
              instructions={instructions}
              isSaved={isSaved}
              isSavingSaved={isSavingSaved}
              onToggleSave={handleToggleSave}
            />
          </motion.div>
        )}
      </div>
    </main>
  );
}

function InstructionPanel({
  instructions,
  isSaved,
  isSavingSaved,
  onToggleSave,
}: {
  instructions: Instructions;
  isSaved: boolean;
  isSavingSaved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <div className="card bg-bg-card p-0 overflow-hidden shadow-2xl border-white/5">
      {/* Hero Header */}
      <div className="bg-linear-to-br from-primary/20 via-primary/5 to-transparent p-8 md:p-12 border-b border-border">
        <h1 className="mb-6 leading-tight max-w-[90%] font-black tracking-tight bg-linear-to-r from-text to-text-muted bg-clip-text text-transparent">
          {instructions.name}
        </h1>
        
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-2 text-text-muted font-medium bg-bg-subtle/50 px-4 py-2 rounded-full border border-border">
            <IoTimeOutline className="text-xl text-primary" />
            <span>{instructions.cook_time_minutes} mins</span>
          </div>
          <div className="flex items-center gap-2 text-text-muted font-medium bg-bg-subtle/50 px-4 py-2 rounded-full border border-border">
            <IoPeopleOutline className="text-xl text-primary" />
            <span>{instructions.servings} Servings</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1.5 rounded-md border border-accent/20">
            Healthy Choice
          </span>
        </div>
      </div>

      <div className="p-8 md:p-12 space-y-12">
        {/* Steps */}
        <section>
          <h2 className="mb-8 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-primary rounded-full" />
            Step-by-Step Guide
          </h2>
          
          <div className="space-y-10 relative">
            {/* Vertical timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-linear-to-b from-primary/20 via-border to-transparent" />
            
            {instructions.steps.map((step, idx) => (
              <motion.div 
                key={step.order}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-14 group"
              >
                {/* Step number circle */}
                <div className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-bg border-2 border-primary/20 flex items-center justify-center font-bold text-lg group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-all shadow-md">
                  {step.order}
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-xl text-text group-hover:text-primary transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-text-muted leading-relaxed text-lg">
                    {step.instruction}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Ingredients */}
        <section>
          <h2 className="mb-6 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-primary rounded-full" />
            Ingredients
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {instructions.ingredients.map((ingredient, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-bg-subtle/50 rounded-xl border border-border"
              >
                <span className="font-medium text-text">{ingredient.name}</span>
                {ingredient.quantity && (
                  <span className="text-sm text-text-muted">{ingredient.quantity}</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Tips */}
        {instructions.tips && instructions.tips.length > 0 && (
          <section>
            <details className="group">
              <summary className="flex items-center gap-3 cursor-pointer list-none">
                <span className="w-1.5 h-6 bg-green-500 rounded-full" />
                <h2 className="flex items-center gap-2">
                  <IoBulbOutline className="text-xl text-green-500" />
                  Cooking Tips
                </h2>
                <span className="ml-auto text-text-muted group-open:rotate-180 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </summary>
              <ul className="mt-4 space-y-2 ml-4">
                {instructions.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-text-muted">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        )}

        {/* Warnings */}
        {instructions.warnings && instructions.warnings.length > 0 && (
          <section>
            <details className="group">
              <summary className="flex items-center gap-3 cursor-pointer list-none">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
                <h2 className="flex items-center gap-2">
                  <IoWarningOutline className="text-xl text-amber-500" />
                  Safety & Allergy Notes
                </h2>
                <span className="ml-auto text-text-muted group-open:rotate-180 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </summary>
              <ul className="mt-4 space-y-2 ml-4">
                {instructions.warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                    <span className="mt-1">⚠</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        )}

        {/* Tutorial */}
        {instructions.tutorial_url && isValidHttpUrl(instructions.tutorial_url) && (
          <section className="flex justify-center">
            <a
              href={instructions.tutorial_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 rounded-xl border border-border bg-bg-subtle/50 text-text font-medium hover:border-primary hover:text-primary transition-colors"
            >
              <IoLogoYoutube className="text-2xl text-red-500" aria-hidden="true" />
              <span>Watch a tutorial</span>
            </a>
          </section>
        )}

        {/* Footer actions */}
        <div className="pt-8 border-t border-border flex justify-center gap-3">
            <button
                onClick={onToggleSave}
                disabled={isSavingSaved}
                className="btn btn-secondary text-sm flex items-center gap-2"
            >
                {isSavingSaved ? (
                    <TailSpin height="16" width="16" color="var(--primary)" />
                ) : isSaved ? (
                    <RxBookmarkFilled className="text-primary" />
                ) : (
                    <RxBookmark />
                )}
                <span>{isSaved ? "Saved" : "Save Recipe"}</span>
            </button>
            <button 
                onClick={() => window.print()}
                className="btn btn-secondary text-sm"
            >
                Print Recipe
            </button>
        </div>
      </div>
    </div>
  );
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchInstruction(recipe: Recipe): Promise<Instructions> {
  const refreshToken = await getSupabaseClient().auth.getSession();
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
  return await response.json();
}
