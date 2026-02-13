import { createContext, useContext, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

interface DashboardContextProps {
  ingredients: Ingredient[];
  setIngredients: (ingredients: Ingredient[]) => void;
  ownedIngredients: OwnedIngredient[];
  setOwnedIngredients: (ownedIngredients: OwnedIngredient[]) => void;
  isLoadingOwnedIngredients: boolean;
  setIsLoadingOwnedIngredients: (isLoadingOwnedIngredients: boolean) => void;
  selectedIngredientId: string;
  setSelectedIngredientId: (selectedIngredientId: string) => void;
  suggestionDialogRef: React.RefObject<HTMLDialogElement | null>;
  suggestedRecipes: Recipe[];
  setSuggestedRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  isLoadingResponse: boolean;
  setIsLoadingResponse: (isLoadingResponse: boolean) => void;
  refreshRecommendedRecipes: () => Promise<void>;
  fetchOwnedIngredients: () => Promise<void>;
  RefreshIngredientList: () => Promise<void>
}

export const DashboardContext = createContext<DashboardContextProps | undefined>(undefined!);

export function DashboardProvider({children}:{
  children: React.ReactNode
}){
  // state of available ingredients in the database
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  // state of the ingredients retrieved from logged user's database
  const [ownedIngredients, setOwnedIngredients] = useState<OwnedIngredient[]>([]);

  // state for loading the owned ingredients
  const [isLoadingOwnedIngredients, setIsLoadingOwnedIngredients] = useState(false);

  // selected ingredient from UI to add to inventory
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");

  // suggestion dialog
  const suggestionDialogRef = useRef<HTMLDialogElement | null>(null);

  // state for recipe suggestions
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);

  // state for loading suggestion from AI
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);


  /**
   * reload the state for suggested recipes
   */
  async function refreshRecommendedRecipes(){
    try {
      setIsLoadingResponse(true);
      const data = await getRecommendedRecipes();
      setSuggestedRecipes(data!);
      console.log(data);
  
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingResponse(false);
    }
  } 

  async function fetchOwnedIngredients(){
    try {
      // update state for UI loading animation
      setIsLoadingOwnedIngredients(true);
      // fetch the owned ingredients
      const data = await getOwnedIngredients();
      setOwnedIngredients(data);
    } catch (error){
      console.error(error);
    } finally {
      setIsLoadingOwnedIngredients(false);
    }
  }
 
  /**
   * refresh the list of available ingredients
   */
  async function RefreshIngredientList(){
    const data = await getAllIngredients();
    setIngredients(data);
  }
  
  return (
    <DashboardContext.Provider value={{
      ingredients,
      setIngredients,
      ownedIngredients,
      setOwnedIngredients,
      isLoadingOwnedIngredients,
      setIsLoadingOwnedIngredients,
      selectedIngredientId,
      setSelectedIngredientId,
      suggestionDialogRef,
      suggestedRecipes,
      setSuggestedRecipes,
      isLoadingResponse,
      setIsLoadingResponse,
      refreshRecommendedRecipes,
      fetchOwnedIngredients,
      RefreshIngredientList
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboardContext = () => useContext(DashboardContext);

/**
 * @returns - 5 suggested recipes
 */
async function getRecommendedRecipes(): Promise<Recipe[]> {

  const refreshToken = await supabase.auth.getSession();

    const res = await fetch("/api/ai/meal-ideas",{
      method:"POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
      }
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json() as Recipe[];

    return data;

}

/**
 * retrieve the ingredients owned by the user
 */
async function getOwnedIngredients(): Promise<OwnedIngredient[]> {

  const refreshToken = await supabase.auth.getSession();

  const res = await fetch("/api/ingredients/user",{
    method: "GET",
    headers:{
      'Authorization': `Bearer ${refreshToken.data.session?.access_token}`
    }
  });

  const data = await res.json();
  console.log(data.recipes);
  return data.recipes;
}

/**
 * fetch all listed ingredients in the database
 * @returns 
 */
async function getAllIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase.from("ingredients").select("*");
  if (error) throw new Error(error.message);
  return data;
}