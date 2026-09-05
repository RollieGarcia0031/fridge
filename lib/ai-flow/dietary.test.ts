import { describe, it, expect } from "vitest";
import {
  DIETARY_RESTRICTIONS,
  DIETARY_RESTRICTION_LABELS,
  buildDietaryGuidance,
  filterIngredientsByDiet,
} from "./dietary";

describe("filterIngredientsByDiet", () => {
  const inventory = [
    "Chicken Breast",
    "Beef",
    "Pork",
    "Fish",
    "Eggs",
    "Tofu",
    "Milk",
    "Cheese",
    "Rice",
    "Pasta",
    "Flour",
    "Onion",
    "Tomato",
    "Soy Sauce",
    "Peanut Butter",
  ];

  it("returns everything when there are no restrictions", () => {
    expect(filterIngredientsByDiet(inventory, undefined)).toEqual(inventory);
    expect(filterIngredientsByDiet(inventory, [])).toEqual(inventory);
  });

  it("filters meat and seafood for vegetarian", () => {
    const result = filterIngredientsByDiet(inventory, ["vegetarian"]);
    expect(result).not.toContain("Chicken Breast");
    expect(result).not.toContain("Beef");
    expect(result).not.toContain("Pork");
    expect(result).not.toContain("Fish");
    expect(result).toContain("Eggs");
    expect(result).toContain("Milk");
    expect(result).toContain("Tofu");
  });

  it("filters animal products for vegan", () => {
    const result = filterIngredientsByDiet(inventory, ["vegan"]);
    expect(result).not.toContain("Chicken Breast");
    expect(result).not.toContain("Eggs");
    expect(result).not.toContain("Milk");
    expect(result).not.toContain("Cheese");
    expect(result).toContain("Tofu");
    expect(result).toContain("Rice");
  });

  it("allows fish for pescatarian but removes chicken and pork", () => {
    const result = filterIngredientsByDiet(inventory, ["pescatarian"]);
    expect(result).toContain("Fish");
    expect(result).not.toContain("Chicken Breast");
    expect(result).not.toContain("Beef");
    expect(result).not.toContain("Pork");
  });

  it("filters gluten sources for gluten-free", () => {
    const result = filterIngredientsByDiet(inventory, ["gluten-free"]);
    expect(result).not.toContain("Pasta");
    expect(result).not.toContain("Flour");
    expect(result).not.toContain("Soy Sauce");
    expect(result).toContain("Rice");
    expect(result).toContain("Tofu");
  });

  it("filters dairy for dairy-free", () => {
    const result = filterIngredientsByDiet(inventory, ["dairy-free"]);
    expect(result).not.toContain("Milk");
    expect(result).not.toContain("Cheese");
    expect(result).toContain("Eggs");
  });

  it("filters nuts for nut-free", () => {
    const result = filterIngredientsByDiet(inventory, ["nut-free"]);
    expect(result).not.toContain("Peanut Butter");
    expect(result).toContain("Tofu");
  });

  it("filters pork for halal", () => {
    const result = filterIngredientsByDiet(inventory, ["halal"]);
    expect(result).not.toContain("Pork");
    expect(result).toContain("Chicken Breast");
  });

  it("filters carbs for keto", () => {
    const result = filterIngredientsByDiet(inventory, ["keto"]);
    expect(result).not.toContain("Rice");
    expect(result).not.toContain("Pasta");
    expect(result).not.toContain("Flour");
    expect(result).toContain("Tofu");
    expect(result).toContain("Onion");
  });

  it("combines restrictions and ignores unknown values", () => {
    const result = filterIngredientsByDiet(inventory, ["vegetarian", "dairy-free" as DietaryRestriction]);
    expect(result).not.toContain("Chicken Breast");
    expect(result).not.toContain("Milk");
    expect(result).not.toContain("Cheese");
    expect(result).toContain("Tofu");
  });
});

describe("buildDietaryGuidance", () => {
  it("returns an empty string when there are no restrictions", () => {
    expect(buildDietaryGuidance(undefined)).toBe("");
    expect(buildDietaryGuidance([])).toBe("");
  });

  it("mentions every active restriction", () => {
    const guidance = buildDietaryGuidance(["vegan", "gluten-free"]);
    expect(guidance).toContain(DIETARY_RESTRICTION_LABELS.vegan);
    expect(guidance).toContain(DIETARY_RESTRICTION_LABELS["gluten-free"]);
    expect(guidance).toContain("strict dietary restrictions");
  });

  it("ships a restriction label for every supported restriction", () => {
    for (const restriction of DIETARY_RESTRICTIONS) {
      expect(DIETARY_RESTRICTION_LABELS[restriction].length).toBeGreaterThan(0);
    }
  });
});