"use client";

import { IoIosCloseCircleOutline } from "react-icons/io";
import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { LuRefreshCcw } from "react-icons/lu";
import { RxReload } from "react-icons/rx";
import { TailSpin } from "react-loader-spinner";
import { useDashboardContext } from "@/context/DashboardContext";

export default function SuggestedDialog({RefreshRecommendedRecipes}:{
  RefreshRecommendedRecipes: () => Promise<void>,
}){

  const {
    suggestionDialogRef,
    suggestedRecipes,
    setSuggestedRecipes,
    isLoadingResponse
  } = useDashboardContext()!;

  return(
    <dialog ref={suggestionDialogRef}
      className="open:flex-cl open:sm:w-140 w-full open:sm:h-160 open:pb-8"
    >
      {/* header with close button */}
      <div className="flex flex-row items-end justify-end">
        <button onClick={handleClose}>
          <IoIosCloseCircleOutline className="fill-red-700 text-xl"/>
        </button>
      </div>
      
      {/* option header and menu buttons */}
      <div className="m-0 sm:m-4">
        <p className="text-text text-lg">
          Recommended recipes
        </p>

        <p className="text-text-muted text-sm my-2">
          Recipes are generated based on your available ingredients
        </p>

        {/* refresh button */}
        <button onClick={RefreshRecommendedRecipes}
          title="Refresh Suggestions"
          className="text-black bg-secondary md:aspect-square sm:aspect-auto p-2 rounded-sm flex-rc gap-2"
        >
          <RxReload className="text-xs sm:text-md text-white dark:text-black" />
          <span className="sm:hidden text-xs text-white dark:text-black">Refresh Suggestions</span>
        </button>
      </div>

      {/* loader animation for suggestions */}
      {
        isLoadingResponse &&
        <div className="flex flex-rc gap-4 my-16" >
            <TailSpin
              visible={true}
              height="20"
              width="20"
              color="#5e03fc"
              ariaLabel="tail-spin-loading"
              radius="1"
              wrapperStyle={{}}
              wrapperClass=""
            />
          <p className="dark:text-text-muted">Loading meal suggestions...</p>
        </div>
      }
      { suggestedRecipes.length > 0 &&
        <div className="flex-ccl gap-4 sm:mx-4 m-0 mt-4">
          {suggestedRecipes?.map((recipe,index) => (
            <RecipeCard key={index} recipe={recipe} />
          ))}
        </div>
      }
    </dialog>
  )

  function handleClose(){
    suggestionDialogRef.current?.close();
  }
}

function RecipeCard({recipe}:{recipe: Recipe}){
  const router = useRouter();

  return (
    <div className="card rounded-md sm:p-2 p-1
      overflow-y-auto hover:bg-highlight duration-150
      cursor-pointer"
      onClick={openRecipe}
    >
      <p className="text-text text-sm">
        {recipe.recipe_name}
      </p>
      <p className="text-text-muted text-xs sm:text-sm text-justify sm:px-8 px-2">
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
