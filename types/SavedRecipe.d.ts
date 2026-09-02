interface SavedRecipe {
  /**
   * Primary id of the saved recipe row
   */
  id: string;
  /**
   * Name of the recipe
   */
  recipe_name: string;
  /**
   * Short AI-generated description
   */
  description: string;
  /**
   * Ingredient names used by the recipe
   */
  ingredients: string[];
  /**
   * Full AI-generated cooking instructions, when they were persisted; null otherwise
   */
  instructions: Instructions | null;
  /**
   * When the recipe was saved (ISO timestamp)
   */
  created_at: string;
}