interface PresetIngredient {
  /**
   * Ingredient id from the ingredients table
   */
  id: string;
  /**
   * Display name
   */
  name: string;
  /**
   * Optional quantity carried over from inventory
   */
  quantity?: number;
  /**
   * Optional expiry date (ISO date string)
   */
  expires_at?: string;
}

interface Preset {
  /**
   * Primary id of the preset row
   */
  id: string;
  /**
   * User-chosen name for the preset
   */
  name: string;
  /**
   * Ingredients saved in this preset
   */
  ingredients: PresetIngredient[];
  /**
   * When the preset was created (ISO timestamp)
   */
  created_at: string;
}
