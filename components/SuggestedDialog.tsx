"use client";

import { IoIosCloseCircleOutline } from "react-icons/io";
import { useRouter } from "next/navigation";
import { RxReload, RxBookmark } from "react-icons/rx";
import { TailSpin } from "react-loader-spinner";
import { useDashboardContext } from "@/context/DashboardContext";
import { motion, AnimatePresence } from "framer-motion";

export default function SuggestedDialog() {
  const {
    suggestionDialogRef,
    suggestedRecipes,
    refreshRecommendedRecipes,
    isLoadingResponse,
    dishType,
    nutrientPriority,
    allowSuggestedIngredients,
  } = useDashboardContext()!;

  const activeFilterLabel =
    dishType === "soup" ? "Soup" : dishType === "stir-fried" ? "Stir-fried" : "Any type";

  const nutrientPriorityLabel =
    nutrientPriority === "muscle"
      ? "Muscle"
      : nutrientPriority === "bone"
      ? "Bone"
      : nutrientPriority === "sick"
      ? "Sick day"
      : null;

  const handleClose = () => {
    suggestionDialogRef.current?.close();
  };

  return (
    <dialog
      ref={suggestionDialogRef}
      className="m-0 bg-transparent p-0 w-full max-w-2xl"
    >
      <div className="fixed inset-0 bg-black/60 z-[-1]" onClick={handleClose} />
      <div className="card m-4 sm:m-auto p-6 bg-bg-card shadow-2xl border-white/10 max-h-[90dvh] flex flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="flex items-center gap-3">
              <span className="w-1.5 h-6 bg-accent rounded-full animate-pulse" />
              Meal Suggestions
              <span className="text-[10px] font-bold uppercase tracking-widest bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                {activeFilterLabel}
              </span>
              {nutrientPriorityLabel && (
                <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {nutrientPriorityLabel}
                </span>
              )}
              {allowSuggestedIngredients && (
                <span className="text-[10px] font-bold uppercase tracking-widest bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">
                  Extra ingredients
                </span>
              )}
            </h2>
            <p className="text-text-muted text-sm">
              AI-generated recipes matching your available ingredients
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 text-text-muted hover:text-red-500 transition-colors"
          >
            <IoIosCloseCircleOutline className="text-3xl" />
          </button>
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-4">
          <button
            disabled={isLoadingResponse}
            onClick={refreshRecommendedRecipes}
            className="btn btn-primary h-10 px-6 gap-3 flex-1"
          >
            {isLoadingResponse ? (
              <TailSpin height="16" width="16" color="currentColor" />
            ) : (
              <RxReload className="text-lg" />
            )}
            <span className="font-semibold">
              {isLoadingResponse ? "Thinking..." : "Regenerate Ideas"}
            </span>
          </button>
        </div>

        {/* Suggested Recipes List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1 custom-scrollbar">
          {isLoadingResponse && suggestedRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 opacity-70">
              <TailSpin visible height="60" width="60" color="var(--primary)" />
              <p className="font-medium animate-pulse">
                Consulting the digital chef...
              </p>
            </div>
          ) : suggestedRecipes.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-3"
              >
                {suggestedRecipes.map((recipe, index) => (
                  <RecipeCard key={index} recipe={recipe} delay={index * 0.1} />
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            !isLoadingResponse && (
              <div className="text-center py-20 opacity-50 space-y-2">
                <p className="text-4xl">🧑‍🍳</p>
                <p className="font-bold text-lg">No suggestions yet</p>
                <p className="text-sm">
                  Add more ingredients to get personalized recipes!
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </dialog>
  );
}

export function RecipeCard({ recipe, delay }: { recipe: any; delay: number }) {
  const router = useRouter();

  const openRecipe = () => {
    // clear any persisted instructions from a previously opened saved recipe
    // so a freshly generated suggestion is not shown with someone else's steps
    sessionStorage.removeItem("instructions");
    sessionStorage.setItem("recipe", JSON.stringify(recipe));
    router.push("/recipe");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="group p-5 bg-bg border border-border rounded-2xl hover:border-primary/50 hover:bg-bg-subtle
      transition-all cursor-pointer shadow-sm hover:shadow-lg flex gap-4"
      onClick={openRecipe}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl transition-transform">
        🥗
      </div>
      <div className="flex-1 space-y-1">
        <h4 className="font-bold text-lg text-text group-hover:text-primary transition-colors">
          {recipe.recipe_name}
        </h4>
        <p className="text-text-muted text-sm leading-relaxed">
          {recipe.description}
        </p>
      </div>
    </motion.div>
  );
}
