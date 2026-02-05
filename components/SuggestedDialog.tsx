"use client";

import { IoIosCloseCircleOutline } from "react-icons/io";
import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { LuRefreshCcw } from "react-icons/lu";
import { RxReload } from "react-icons/rx";
import { TailSpin } from "react-loader-spinner";

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
      {/* header with close button */}
      <div className="flex flex-row items-end justify-end">
        <button onClick={handleClose}>
          <IoIosCloseCircleOutline className="fill-red-700 text-xl"/>
        </button>
      </div>
      
      {/* option header and menu buttons */}
      <div className="m-4">
        <p className="text-text text-lg">
          Recommended recipes
        </p>

        <p className="text-text-muted text-sm my-2">
          Recipes are generated based on your available ingredients
        </p>

        <button onClick={RefreshRecommendedRecipes}
          title="Refresh Suggestions"
          className="text-black bg-secondary md:aspect-square sm:aspect-auto p-2 rounded-sm flex-rc gap-2"
        >
          <RxReload/>
          <span className="sm:hidden text-sm">Refresh Suggestions</span>
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
        <div className="cardflex-ccl gap-4 mx-4 mt-4">
          {suggestedRecipes?.map((recipe,index) => (
            <RecipeCard key={index} recipe={recipe} />
          ))}
        </div>
      }
    </dialog>
  )

  function handleClose(){
    ref.current?.close();
  }
}

function RecipeCard({recipe}:{recipe: Recipe}){
  const router = useRouter();

  return (
    <div className="card rounded-md p-2
      overflow-y-auto hover:bg-highlight duration-150
      cursor-pointer"
      onClick={openRecipe}
    >
      <p className="text-text text-sm">
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
