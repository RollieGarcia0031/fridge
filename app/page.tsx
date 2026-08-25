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
  DishType,
  NutrientPriority,
} from "@/context/DashboardContext";
import Select, { SingleValue, components as selectComponents } from "react-select";
import { saveIngredient, removeIngredients, IngredientItem } from "@/lib/services/Ingredients";
import { toast } from "react-toastify";
import { MdDeleteOutline } from "react-icons/md";

interface ingredientOption extends inputOption {
  status?: "owned" | "queued";
}

export interface inputOption {
  label: string;
  value: string;
  quantity?: number;
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
    setIngredientsToAdd,
    setSelectedOwnedIngredientId,
    selectedOwnedIngredientId,
    dishType,
    setDishType,
    nutrientPriority,
    setNutrientPriority,
    allowSuggestedIngredients,
    setAllowSuggestedIngredients,
    setSuggestedRecipes
  } = useDashboardContext()!;

  useEffect(() => {
    RefreshIngredientList();
    fetchOwnedIngredients();
  }, []);

  const options: ingredientOption[] = ingredients.map((i) => {
    const isOwned = ownedIngredients.some(
      (owned) => owned.ingredient.id === i.id,
    );
    const isQueued = ingredientsToAdd.some(
      (queued) => queued.value === i.id,
    );

    return {
      value: i.id,
      label: i.name,
      status: isOwned ? "owned" : isQueued ? "queued" : undefined,
    };
  });

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
      cursor: state.data.status ? "not-allowed" : "pointer",
      opacity: state.data.status ? 0.6 : 1,
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

  const OptionBadge = ({ status }: { status?: "owned" | "queued" }) => {
    if (!status) return null;
    return (
      <span
        className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
          status === "owned"
            ? "bg-green-500/15 text-green-400"
            : "bg-amber-500/15 text-amber-400"
        }`}
      >
        {status === "owned" ? "✓ in fridge" : "✓ queued"}
      </span>
    );
  };

  const CustomOption = (props: any) => (
    <selectComponents.Option {...props}>
      <div className="flex items-center gap-2 w-full">
        <span>{props.label}</span>
        <OptionBadge status={props.data.status} />
      </div>
    </selectComponents.Option>
  );

  const handleIngredientChange = (selectedOption : SingleValue<inputOption>) => {

    selectedOption = selectedOption as inputOption;

    setIngredientsToAdd(selectedIngredients => {
      const newIngredientsToAdd = [...selectedIngredients, selectedOption]
      return newIngredientsToAdd;
    })

    setSelectedIngredientId(selectedOption.value || "");
  };

  const handleDishTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as DishType;

    // drop stale suggestions so the dialog regenerates with the new filter
    setSuggestedRecipes([]);
    setDishType(value);
  };

  const handleNutrientPriorityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as NutrientPriority;

    // drop stale suggestions so the dialog regenerates with the new filter
    setSuggestedRecipes([]);
    setNutrientPriority(value);
  };

  const handleAllowSuggestedIngredientsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;

    // drop stale suggestions so the dialog regenerates with the new flag
    setSuggestedRecipes([]);
    setAllowSuggestedIngredients(checked);
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
                  <Select<ingredientOption>
                    instanceId="ingredientSelector"
                    options={options}
                    styles={colorStyle}
                    components={{ Option: CustomOption }}
                    isOptionDisabled={(option) => !!option.status}
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

                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="dishTypeFilter"
                      className="text-[10px] font-bold uppercase tracking-widest text-text-muted whitespace-nowrap"
                    >
                      Dish type
                    </label>
                    <select
                      id="dishTypeFilter"
                      value={dishType}
                      onChange={handleDishTypeChange}
                      className="flex-1 h-10 px-3 text-sm bg-bg-subtle border border-border rounded-lg
                      focus:border-primary focus:outline-none cursor-pointer"
                    >
                      <option value="">Any type</option>
                      <option value="soup">Soup</option>
                      <option value="stir-fried">Stir-fried</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="nutrientPriorityFilter"
                      className="text-[10px] font-bold uppercase tracking-widest text-text-muted whitespace-nowrap"
                    >
                      Nutrition
                    </label>
                    <select
                      id="nutrientPriorityFilter"
                      value={nutrientPriority}
                      onChange={handleNutrientPriorityChange}
                      className="flex-1 h-10 px-3 text-sm bg-bg-subtle border border-border rounded-lg
                      focus:border-primary focus:outline-none cursor-pointer"
                    >
                      <option value="">No priority</option>
                      <option value="muscle">Muscle (high protein)</option>
                      <option value="bone">Bone (calcium / vitamin D)</option>
                      <option value="sick">Sick day (easy to digest)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id="allowSuggestedIngredientsToggle"
                      type="checkbox"
                      checked={allowSuggestedIngredients}
                      onChange={handleAllowSuggestedIngredientsChange}
                      className="w-4 h-4 shrink-0 accent-primary cursor-pointer"
                    />
                    <label
                      htmlFor="allowSuggestedIngredientsToggle"
                      className="text-sm text-text-muted cursor-pointer select-none"
                    >
                      Let AI suggest extra ingredients beyond my fridge
                    </label>
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
                              className="flex items-center gap-2 p-2 bg-bg-subtle/50 border border-border rounded-lg group"
                            >
                              <span className="text-sm font-medium flex-1 truncate">{ingredient.label}</span>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                placeholder="Qty"
                                value={ingredient.quantity ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setIngredientsToAdd(prev =>
                                    prev.map(i =>
                                      i.value === ingredient.value
                                        ? { ...i, quantity: val === "" ? undefined : Number(val) }
                                        : i
                                    )
                                  );
                                }}
                                className="w-16 h-7 text-xs text-center bg-bg-subtle border border-border rounded
                                  focus:border-primary focus:outline-none [appearance:textfield]
                                  [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                onClick={() => {
                                  setIngredientsToAdd(prev => prev.filter(i => i.value !== ingredient.value));
                                }}
                                className="text-text-muted hover:text-red-500 transition-colors shrink-0"
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

      const items: IngredientItem[] = ingredientsToAdd.map((ingredient) => ({
        id: ingredient.value,
        quantity: ingredient.quantity,
      }));

      const newOwnedIngredients = await saveIngredient(items);
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
  const {
    setOwnedIngredients, ownedIngredients,
    isLoadingOwnedIngredients,
    selectedOwnedIngredientId, setSelectedOwnedIngredientId,
    isDeletingOwnedIngredients, setIsDeletingOwnedIngredients
  } = useDashboardContext()!;

  function handleIngredientCardClick(id: string){
    if (!id) return;

    setSelectedOwnedIngredientId(selectedIds => {
      const idFound = selectedIds?.indexOf(id) >= 0;

      if (!idFound) {
        return [...selectedIds, id];
      } 
      
      return selectedIds.filter((selectedId) => selectedId !== id);

    });
  }

  /**
   * Checks if an id exists in the selected owned-ingredients
   *
   * @param id - primary key of ingredient
   */
  function isSelectedId(id: string): boolean{
    return selectedOwnedIngredientId.indexOf(id) >= 0;
  }

  async function handleMultipleDeleteButton(){
    if (isDeletingOwnedIngredients) return;
    try {
      setIsDeletingOwnedIngredients(true);
      await removeIngredients(selectedOwnedIngredientId);
      
      const filteredOwnedIngredients = ownedIngredients.filter(_ownedIngredient => {
        const found = selectedOwnedIngredientId.indexOf(_ownedIngredient.id) >= 0;
        return !found;
      });
      setOwnedIngredients(filteredOwnedIngredients);
      setSelectedOwnedIngredientId([]);
    } catch (error){
      if (error instanceof Error)
        console.error(error.message);
    } finally {
      setIsDeletingOwnedIngredients(false);
    }
  }

  return (
    <div className="card p-6 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary rounded-full" />
          On Your Shelf
        </h3>

        { selectedOwnedIngredientId?.length > 0 && (
          <button
            onClick={handleMultipleDeleteButton}
            className="cursor-pointer border border-border rounded-md p-2"
          >
            <MdDeleteOutline />
          </button>
        )}
       
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
                  className={`flex items-center justify-between
                    p-3 bg-bg-subtle border ${isSelectedId(ownedIngredient.id)? 'border-accent':'border-border'} rounded-lg
                    hover:${isSelectedId(ownedIngredient.id)? '':'border-primary/30'} transition-colors
                  `}
                  onClick={()=>handleIngredientCardClick(ownedIngredient.id || "")}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-sm">{ownedIngredient.ingredient.name}</span>
                    {ownedIngredient.quantity != null && ownedIngredient.quantity > 0 && (
                      <span className="text-[10px] text-text-muted bg-bg-card px-1.5 py-0.5 rounded">
                        x{ownedIngredient.quantity}
                      </span>
                    )}
                  </div>
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
      removeIngredients([id]);
      setOwnedIngredients(ownedIngredients.filter((oi) => oi.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Error removing ingredient");
    }
  }
}
