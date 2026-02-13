interface OwnedIngredient {
  /**
   * Primary id of user_ingredient
   */
  id: string;
  /**
   * The quantity of the owned ingredient
   */
  quantity: number;
  ingredient: Ingredient;
}