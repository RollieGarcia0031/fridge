interface OwnedIngredient {
  /**
   * Primary id of user_ingredient
   */
  id: string;
  /**
   * The quantity of the owned ingredient
   */
  quantity: number;
  /**
   * The expiry date of the owned ingredient (ISO date string or null)
   */
  expires_at: string | null;
  ingredient: Ingredient;
}