"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { VscDebugContinue } from "react-icons/vsc";
import SuggestedDialog from "@/components/SuggestedDialog";
import { Oval, TailSpin } from "react-loader-spinner";
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardContext, DashboardProvider } from "@/context/DashboardContext";
import Select, { StylesConfig } from 'react-select';
import { removeIngredient, saveIngredient } from "@/lib/services/Ingredients";
import { toast } from "react-toastify";

export default function Dashboard(){
  return (
    <DashboardProvider>
      <Home />
    </DashboardProvider>
  );
}

function Home() {
  const {
    ingredients,
    selectedIngredientId,
    setSelectedIngredientId,
    suggestionDialogRef,
    suggestedRecipes,
    refreshRecommendedRecipes,
    fetchOwnedIngredients,
    RefreshIngredientList,
    ownedIngredients,
    setOwnedIngredients,
    isLoadingAddIngredient,
    setIsLoadingAddIngredient
  } = useDashboardContext()!;

  useEffect(()=>{
    RefreshIngredientList();
    fetchOwnedIngredients();
  },[]);

  /**
   * Filter the ingredients list to remove the owned ingredients
   * 
   * it is to make sure that the user can't add the same ingredient twice
   */
  const filteredIngredients = ingredients.filter((ingredient) => {
    return !ownedIngredients.some((ownedIngredient) => ownedIngredient.ingredient.id === ingredient.id);
  });

  /**
   * Convert the ingredients list into a list of options for the select input
   */
  const options = filteredIngredients.map(i => {
    return {
      value: i.id,
      label: i.name
    };
  });

  const colorStyle = {
    control: (styles: any) => ({
      ...styles,
      backgroundColor: 'var(--bg-light)',
      borderColor: 'var(--border-muted)',
      color: 'var(--text-muted)',
    }),
    menu: (styles: any) => ({
      ...styles,
      backgroundColor: 'var(--bg-light)',
      color: 'var(--text-muted)',
    }),
    option: (styles: any) => ({
      ...styles,
      backgroundColor: 'var(--bg-light)',
      color: 'var(--text-muted)',
    }),
    singleValue: (styles: any) => ({
      ...styles,
      color: 'var(--text-muted)',
    }),
    input: (styles: any) => ({
      ...styles,
      color: 'var(--text)',
    })
  };


  /**
   * updates the state for the selected ingredient
   */
  const handleIngredientChange = (selectedOption: any) => {
    setSelectedIngredientId(selectedOption.value);
  };

  const selectedIngredient = ingredients.find((ingredient) => ingredient.id === selectedIngredientId);
  return (
    <>
    <div className="p-4
      flex flex-col items-center justify-center
      sm:px-8 overflow-hidden"
    >
      <div className="flex flex-col flex-1 w-full sm:w-88 max-w-lg gap-8 h-full">
        <fieldset>
          {/* select input */}

          <div className="w-full">
            <Select
              instanceId="ingredientSelector"
              options={options}
              styles={colorStyle}
              value={{label: selectedIngredient?.name, value: selectedIngredient?.id}}
              onChange={handleIngredientChange}
            />

          </div>
  
          <div className="mt-4 gap-2 flex flex-row items-center">
            {/* add button */}
            <button
              onClick={e=>handleSaveIngredient()}
              disabled={isLoadingAddIngredient}
              className="flex flex-row items-center justify-center gap-2
              bg-bg-light border-border border border-solid w-full sm:w-80
              py-2 px-4 rounded-sm hover:bg-highlight duration-150
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-light disabled:text-text-muted disabled:border-border-muted"
              >

              {isLoadingAddIngredient &&
                <Oval
                  visible={true}
                  height="20"
                  width="20"
                  strokeWidth="7"
                  color="#4fa94d"
                  ariaLabel="oval-loading"
                  wrapperStyle={{}}
                  wrapperClass=""
                />
              }

              <span>Add</span>
            </button>

            {/* show suggestion dialog button */}
            <button
              onClick={()=>openSuggestedIngredients()}
              className="bg-primary p-2 rounded-xl hover:bg-secondary duration-150"
            >
              <VscDebugContinue className="dark:fill-black fill-white text-2xl"/>
            </button>
          </div>
        </fieldset>

        <OwnedIngredientsPane />
      </div>
    </div>
    
    <SuggestedDialog />
    </>
  );

  /**
   * Save a new ingredients in the user's datbase
   */
  async function handleSaveIngredient(){
    try {
      setIsLoadingAddIngredient(true);
      const newOwnedIngredient = await saveIngredient(selectedIngredientId);
      setOwnedIngredients([...ownedIngredients, newOwnedIngredient]);
      setSelectedIngredientId("");
    } catch (error){
      console.log(error);
      toast.error("Failed to save ingredient");
    } finally {
      setIsLoadingAddIngredient(false);
    }
  }

  /**
   * Open the suggested ingredients dialog which contains
   * the 5 recommended recipes
   */
  function openSuggestedIngredients(){
    suggestionDialogRef.current?.showModal();
    if (suggestedRecipes.length === 0){
      refreshRecommendedRecipes();
    }
  }
}

/**
 * Contains the ingredients owned by the user
 */
function OwnedIngredientsPane() {
  const {
    setOwnedIngredients,
    ownedIngredients,
    isLoadingOwnedIngredients
  } = useDashboardContext()!;

  return (
    <div className="flex-1 flex flex-col">
      { /** message for empty ingredients list */
        !isLoadingOwnedIngredients && ownedIngredients.length === 0 &&
          <p>No ingredients owned</p>
      }

      {/* container for owned ingredients */}
      <div className="card flex-cl flex-1 max-h-100 sm:max-h-full gap-2 overflow-y-auto">

        {!isLoadingOwnedIngredients && ownedIngredients.length > 0 &&
          <p className="text-primary font-semibold mb-4"
          >
            Owned Ingredients:
          </p>
        }

        { /** loading indicator */
          isLoadingOwnedIngredients &&
          <div className="w-full flex-cc">
            <TailSpin
              visible={true}
              height="80"
              width="80"
              color="#5e03fc"
              ariaLabel="tail-spin-loading"
              radius="1"
              wrapperStyle={{}}
              wrapperClass=""
            />
          </div>            
        }

        <div className="flex-1 flex flex-col items-start gap-2">
          <AnimatePresence>
            {ownedIngredients?.map((ownedIngredient) => (
              /** each owned ingredient */
              <motion.div
                key={ownedIngredient.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex-rl gap-2 border-border border border-solid
                  py-1 px-2 rounded-xl dark:hover:bg-highlight bg-bg-dark duration-150"
              >
                <p>{ownedIngredient.ingredient.name}</p>

                <button onClick={()=>handleRemoveIngredient(ownedIngredient.id)}>
                  <IoIosCloseCircleOutline className="text-lg fill-warning" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  /**
   * Removes an owned ingredient from user's database
   * @param id 
   */
  async function handleRemoveIngredient(id: string){
    try{
      removeIngredient(id);
      const newOwnedIngredients = ownedIngredients.filter((ownedIngredient) => ownedIngredient.id !== id);    
      setOwnedIngredients(newOwnedIngredients);
    } catch (error) {
      console.error(error);
      toast("Error removing ingredient", {
        type: "error"
      })
    }

  }
}