import { useContext, createContext, useState, SetStateAction, Dispatch, ReactNode } from "react";

interface IngredientsContextProvider {
  setSelectedIngredients: Dispatch<SetStateAction<string[]>>
  selectedIngredients: string[]
}

const IngredientsContext = createContext<IngredientsContextProvider>({
  selectedIngredients: [],
  setSelectedIngredients: ()=>{}
});

export function FoodCtx({children}:{
  children: ReactNode
}) {

  const [ selectedIngredients, setSelectedIngredients ] = useState<string[]>([]);

  return (
    <IngredientsContext.Provider value={{setSelectedIngredients, selectedIngredients}}>
    {children}
    </IngredientsContext.Provider>
  );
}

export const useIngredients = ()=> useContext(IngredientsContext);
