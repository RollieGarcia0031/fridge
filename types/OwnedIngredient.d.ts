interface OwnedIngredient {
  /**
   * Primary id of user_ingredient
   */
  id: string;
  /**
   * The quantity of the owned ingredient
   */
  quantity: string | null;
  /**
   * The date the owned ingredient expires (yyyy-mm-dd)
   */
  expires_at: string | null;
  ingredient: Ingredient;
}