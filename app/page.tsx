"use client";

import { useEffect, useState } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { VscDebugContinue } from "react-icons/vsc";
import SuggestedDialog from "@/components/SuggestedDialog";
import { Oval, TailSpin } from "react-loader-spinner";
import { motion, AnimatePresence } from "framer-motion";
import {
  useDashboardContext,
  DashboardProvider,
} from "@/context/DashboardContext";
import Select, { SingleValue } from "react-select";
import { saveIngredient, removeIngredient } from "@/lib/services/Ingredients";
import { toast } from "react-toastify";

export interface inputOption {
  label: string;
  value: string;
}

export default function Dashboard() {
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
    setIsLoadingAddIngredient,
    ingredientsToAdd,
    setIngredientsToAdd
  } = useDashboardContext()!;

  useEffect(() => {
    RefreshIngredientList();
    fetchOwnedIngredients();
  }, []);

  const filteredIngredients = ingredients.filter((ingredient) => {

    const matchedOwnedIngredient =  !ownedIngredients.some(
      (ownedIngredient) => ownedIngredient.ingredient.id === ingredient.id,
    );

    const matchedIngredientToAdd = !ingredientsToAdd.some(
      (ingredientToAdd) => ingredientToAdd.value === ingredient.id
    );

    return matchedOwnedIngredient && matchedIngredientToAdd;
  });

  useEffect(()=>{

  }, [ingredientsToAdd]);

  const options: inputOption[] = filteredIngredients.map((i) => ({
    value: i.id,
    label: i.name,
  }));

  const colorStyle = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "var(--bg-subtle)",
      borderColor: state.isFocused ? "var(--primary)" : "var(--border)",
      borderRadius: "var(--radius-md)",
      padding: "2px",
      boxShadow: state.isFocused ? "0 0 0 2px var(--ring)" : "none",
      "&:hover": {
        borderColor: "var(--primary)",
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "var(--primary)"
        : state.isFocused
        ? "var(--bg-subtle)"
        : "transparent",
      color: state.isSelected ? "white" : "var(--text)",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "var(--primary)",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)",
      backdropFilter: "blur(8px)",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "var(--text)",
    }),
    input: (base: any) => ({
      ...base,
      color: "var(--text)",
    }),
  };

  const handleIngredientChange = (selectedOption : SingleValue<inputOption>) => {

    selectedOption = selectedOption as inputOption;

    setIngredientsToAdd(selectedIngredients => {
      const newIngredientsToAdd = [...selectedIngredients, selectedOption]
      return newIngredientsToAdd;
    })

    setSelectedIngredientId(selectedOption.value || "");
  };

  const selectedIngredient = ingredients.find(
    (ingredient) => ingredient.id === selectedIngredientId,
  );

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-12 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-10"
        >
          <div className="text-center space-y-4">
            <h1 className="bg-linear-to-br from-text to-primary bg-clip-text text-transparent">
              Kitchen Inventory
            </h1>
            <p className="text-text-muted text-lg max-w-[500px] mx-auto">
              Scan your fridge by adding ingredients you have. We&apos;ll suggest great recipes for you.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Control Panel */}
            <div className="md:col-span-2 space-y-6">
              <div className="card p-6 bg-linear-to-br from-bg-card to-bg-subtle/30 shadow-xl border-white/10">
                <h3 className="mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-accent rounded-full" />
                  Add Ingredient
                </h3>
                <div className="space-y-4">
                  <Select
                    instanceId="ingredientSelector"
                    options={options}
                    styles={colorStyle}
                    value={
                      selectedIngredient
                        ? { label: selectedIngredient.name, value: selectedIngredient.id }
                        : null
                    }
                    onChange={handleIngredientChange}
                    placeholder="Search ingredients..."
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveIngredient()}
                      disabled={isLoadingAddIngredient || !selectedIngredientId}
                      className="btn btn-primary flex-1 h-12 text-base"
                    >
                      {isLoadingAddIngredient ? (
                        <Oval visible height="20" width="20" color="currentColor" />
                      ) : (
                        "Add to Fridge"
                      )}
                    </button>

                    <button
                      onClick={() => openSuggestedIngredients()}
                      className="btn btn-secondary p-3 aspect-square"
                      title="Generate Recipes"
                    >
                      <VscDebugContinue className="text-2xl text-primary" />
                    </button>
                  </div>

                  {ingredientsToAdd.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          Selected to Add
                        </span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                          {ingredientsToAdd.length}
                        </span>
                      </div>
                      <div className="max-h-[180px] overflow-y-auto pr-1 flex flex-col gap-1.5">
                        <AnimatePresence>
                          {ingredientsToAdd.map((ingredient) => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              key={ingredient.value}
                              className="flex items-center justify-between p-2 bg-bg-subtle/50 border border-border rounded-lg group"
                            >
                              <span className="text-sm font-medium">{ingredient.label}</span>
                              <button
                                onClick={() => {
                                  setIngredientsToAdd(prev => prev.filter(i => i.value !== ingredient.value));
                                }}
                                className="text-text-muted hover:text-red-500 transition-colors"
                              >
                                <IoIosCloseCircleOutline className="text-lg" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ingredients List */}
            <div className="md:col-span-3">
              <OwnedIngredientsPane />
            </div>
          </div>
        </motion.div>
      </main>

      <SuggestedDialog />
    </>
  );

  async function handleSaveIngredient() {
    try {
      setIsLoadingAddIngredient(true);

      const selectedIdsToAdd = ingredientsToAdd.map((ingredient) => ingredient.value)

      const newOwnedIngredients = await saveIngredient(selectedIdsToAdd);
      setOwnedIngredients([...ownedIngredients, ...newOwnedIngredients]);
      setIngredientsToAdd([]);
      setSelectedIngredientId("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save ingredient");
    } finally {
      setIsLoadingAddIngredient(false);
    }
  }

  function openSuggestedIngredients() {
    suggestionDialogRef.current?.showModal();
    if (suggestedRecipes.length === 0) {
      refreshRecommendedRecipes();
    }
  }
}

function OwnedIngredientsPane() {
  const { setOwnedIngredients, ownedIngredients, isLoadingOwnedIngredients } =
    useDashboardContext()!;

  return (
    <div className="card p-6 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary rounded-full" />
          On Your Shelf
        </h3>
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted px-2 py-1 bg-border rounded-md">
          {ownedIngredients.length} Items
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {isLoadingOwnedIngredients ? (
          <div className="h-full flex items-center justify-center">
            <TailSpin height="40" width="40" color="var(--primary)" />
          </div>
        ) : ownedIngredients.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <div className="w-16 h-16 rounded-full bg-bg-subtle flex items-center justify-center text-2xl">
              🥘
            </div>
            <p>Your fridge is empty.<br />Start by adding some items!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {ownedIngredients.map((ownedIngredient) => (
                <motion.div
                  layout
                  key={ownedIngredient.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  className="flex items-center justify-between p-3 bg-bg-subtle border border-border rounded-lg hover:border-primary/30 transition-colors"
                >
                  <span className="font-medium text-sm">{ownedIngredient.ingredient.name}</span>
                  <button
                    onClick={() => handleRemoveIngredient(ownedIngredient.id)}
                    className="p-1 transition-colors text-text-muted hover:text-red-500"
                  >
                    <IoIosCloseCircleOutline className="text-xl" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );

  async function handleRemoveIngredient(id: string) {
    try {
      removeIngredient(id);
      setOwnedIngredients(ownedIngredients.filter((oi) => oi.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Error removing ingredient");
    }
  }
}
