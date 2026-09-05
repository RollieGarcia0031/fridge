/**
 * Pure helpers for translating dietary restrictions into concrete rules for
 * the AI flows: ingredient filtering (so restricted items never even reach
 * the prompt) and the guidance text the model must follow.
 */

export const DIETARY_RESTRICTIONS: readonly DietaryRestriction[] = [
  "vegetarian",
  "vegan",
  "pescatarian",
  "gluten-free",
  "dairy-free",
  "nut-free",
  "halal",
  "keto",
];

export const DIETARY_RESTRICTION_LABELS: Record<DietaryRestriction, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
  "gluten-free": "Gluten-free",
  "dairy-free": "Dairy-free",
  "nut-free": "Nut-free",
  halal: "Halal",
  keto: "Keto",
};

/**
 * Ingredient name fragments that disqualify an ingredient for a restriction.
 * Matching is case-insensitive over the whole (already normalized) name, so
 * "Fish" and "fish sauce" are both caught by the "fish" fragment.
 */
const DIETARY_BLOCKLIST: Record<DietaryRestriction, readonly string[]> = {
  vegetarian: [
    "beef",
    "pork",
    "chicken",
    "turkey",
    "lamb",
    "duck",
    "goat",
    "meat",
    "ham",
    "bacon",
    "sausage",
    "fish",
    "shrimp",
    "prawn",
    "seafood",
    "clam",
    "mussel",
    "oyster",
    "squid",
    "octopus",
    "crab",
    "anchovy",
  ],
  vegan: [
    "egg",
    "milk",
    "cheese",
    "butter",
    "yogurt",
    "yoghurt",
    "cream",
    "honey",
    "gelatin",
    "whey",
    "ghee",
    "meat",
    "chicken",
    "beef",
    "pork",
    "turkey",
    "lamb",
    "duck",
    "ham",
    "bacon",
    "sausage",
    "fish",
    "shrimp",
    "seafood",
  ],
  pescatarian: [
    "beef",
    "chicken",
    "pork",
    "turkey",
    "lamb",
    "duck",
    "meat",
    "ham",
    "bacon",
    "sausage",
  ],
  "gluten-free": [
    "wheat",
    "flour",
    "pasta",
    "bread",
    "barley",
    "rye",
    "oats",
    "couscous",
    "bulgur",
    "noodle",
    "soy sauce",
  ],
  "dairy-free": [
    "milk",
    "cheese",
    "butter",
    "yogurt",
    "yoghurt",
    "cream",
    "ghee",
    "whey",
    "ice cream",
  ],
  "nut-free": [
    "peanut",
    "almond",
    "walnut",
    "pecan",
    "cashew",
    "pistachio",
    "hazelnut",
    "macadamia",
    "pine nut",
    "chestnut",
    "nut",
  ],
  halal: ["pork", "bacon", "ham", "lard", "wine", "beer", "gin", "rum", "vodka", "whiskey", "alcohol"],
  keto: [
    "rice",
    "pasta",
    "bread",
    "flour",
    "sugar",
    "potato",
    "banana",
    "mango",
    "grape",
    "honey",
    "cereal",
    "oat",
    "oats",
    "corn",
    "tortilla",
    "noodle",
    "syrup",
    "wheat",
  ],
};

/**
 * Short reasoning guidance shown to the model for each restriction.
 */
const DIETARY_GUIDANCE: Record<DietaryRestriction, string> = {
  vegetarian:
    "no meat, poultry, fish or seafood in any dish (eggs and dairy are allowed)",
  vegan:
    "no animal products of any kind in any dish, including meat, fish, eggs, dairy and honey",
  pescatarian:
    "no meat or poultry in any dish, but fish and seafood are allowed",
  "gluten-free":
    "no wheat, barley, rye or any gluten-containing ingredient in any dish, including hidden sources like regular soy sauce",
  "dairy-free":
    "no milk, butter, cheese, cream, yogurt or any other dairy in any dish",
  "nut-free":
    "no peanuts or tree nuts in any dish, and no dishes that risk nut cross-contamination",
  halal:
    "no pork and no alcohol in any dish, and no pork-derived or alcohol-based ingredients",
  keto:
    "keep every dish low-carb and high-fat: no sugar, grains, or starchy vegetables",
};

/**
 * Keeps only ingredient names that are compatible with all active restrictions.
 *
 * @param ingredients - ingredient names (e.g. from the user's inventory)
 * @param restrictions - active dietary restrictions
 * @returns the ingredients that pass every active restriction
 */
export function filterIngredientsByDiet(
  ingredients: readonly string[],
  restrictions: readonly string[] | undefined,
): string[] {
  if (!restrictions || restrictions.length === 0) return [...ingredients];

  const active = restrictions.filter(
    (restriction): restriction is DietaryRestriction =>
      DIETARY_RESTRICTIONS.includes(restriction as DietaryRestriction),
  );
  if (active.length === 0) return [...ingredients];

  return ingredients.filter((name) => {
    const lower = name.toLowerCase();
    return active.every((restriction) =>
      DIETARY_BLOCKLIST[restriction].every((fragment) => !lower.includes(fragment)),
    );
  });
}

/**
 * Renders the dietary guidance block inserted into the generation prompt.
 * Returns an empty string when there are no active restrictions.
 *
 * @param restrictions - active dietary restrictions
 */
export function buildDietaryGuidance(
  restrictions: readonly string[] | undefined,
): string {
  const active = (restrictions ?? []).filter(
    (restriction): restriction is DietaryRestriction =>
      DIETARY_RESTRICTIONS.includes(restriction as DietaryRestriction),
  );

  if (active.length === 0) return "";

  const bullets = active.map(
    (restriction) =>
      `- ${DIETARY_RESTRICTION_LABELS[restriction]} (${DIETARY_GUIDANCE[restriction]})`,
  );

  return `This meal plan must respect the following strict dietary restrictions:\n${bullets.join(
    "\n",
  )}\nFollow them in every dish. Never use a restricted ingredient, and never introduce one even when extra ingredients beyond the list are allowed.`;
}