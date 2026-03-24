"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Oval, TailSpin } from "react-loader-spinner";
import { IoArrowBackOutline, IoTimeOutline, IoPeopleOutline } from "react-icons/io5";
import Link from "next/link";
import { motion } from "framer-motion";

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
            <InstructionPanel instructions={instructions} />
          </motion.div>
        )}
      </div>
    </main>
  );
}

function InstructionPanel({ instructions }: { instructions: Instrcutions }) {
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

        {/* Footer actions */}
        <div className="pt-8 border-t border-border flex justify-center">
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

async function fetchInstruction(recipe: Recipe): Promise<Instrcutions> {
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
