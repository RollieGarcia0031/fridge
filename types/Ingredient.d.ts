interface Ingredient {
  /**
   * The category of the ingredient
   */
  category: string;
  created_at: string;
  id: string;
  /**
   * Display name of the ingredient
   * Ex: "Eggs"
   */
  name: string;
  /**
   * Normalized name of the ingredient
   * Ex: "eggs"
   */
  normalized_name: string;
}