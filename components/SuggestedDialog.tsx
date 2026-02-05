"use client";

import { IoIosCloseCircleOutline } from "react-icons/io";
import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { LuRefreshCcw } from "react-icons/lu";

export default function SuggestedDialog({ref, suggestedRecipes, setSuggestedRecipes, RefreshRecommendedRecipes, isLoadingResponse}:{
  ref: React.RefObject<HTMLDialogElement | null>,
  suggestedRecipes: Recipe[],
  setSuggestedRecipes: Dispatch<SetStateAction<Recipe[]>>,
  RefreshRecommendedRecipes: () => Promise<void>,
  isLoadingResponse: boolean
}){
  return(
    <dialog ref={ref}
      className="open:flex-cl open:w-140 open:h-160 open:pb-8"
    >
      <div className="flex flex-row items-end justify-end">
        <button onClick={handleClose}>
          <IoIosCloseCircleOutline className="fill-red-700 text-xl"/>
        </button>
      </div>
      <div className="m-4">
        <p className="text-text text-lg">
          Recommended recipes
        </p>

        <p className="text-text-muted text-sm my-2">
          Recipes are generated based on your available ingredients
        </p>

        <button onClick={RefreshRecommendedRecipes}
          className="text-black bg-secondary px-2 py-px rounded-sm mt-2"
        >
          Refresh
        </button>
      </div>

      {
        isLoadingResponse &&
        <span className="flex flex-row justify-center itemse-center" >
          <LuRefreshCcw className="dark:fill-white animate-spin"/>
          <p className="dark:text-text-muted">Loading, please wait</p>
        </span>
      }
      <div className="card flex-ccl gap-4 mx-4 mt-8">
        {suggestedRecipes?.map((recipe,index) => (
          <RecipeCard key={index} recipe={recipe} />
        ))}
      </div>
    </dialog>
  )

  function handleClose(){
    ref.current?.close();
  }
}

function RecipeCard({recipe}:{recipe: Recipe}){
  const router = useRouter();

  return (
    <div className="border-t border-t-border rounded-md p-2
      overflow-y-auto hover:bg-highlight duration-150
      cursor-pointer"
      onClick={openRecipe}
    >
      <p className="text-text text-md">
        {recipe.recipe_name}
      </p>
      <p className="text-text-muted text-sm text-justify px-8">
        {recipe.description}
      </p>
    </div>
  )

  function openRecipe(){
    // save the recipe in session storage
    sessionStorage.setItem("recipe", JSON.stringify(recipe));
    // open the recipe page
    router.push("/recipe");
  }
}
