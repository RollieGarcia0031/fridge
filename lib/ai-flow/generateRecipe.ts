import { z } from "genkit";
import { ai } from "./genkit";

export const generateRecipeInputSchema = z.object({
  ingredients: z
    .array(z.string())
    .min(1)
    .describe("The available ingredients that can be used to cook a meal"),
  type: z
    .enum(["soup", "stir-fried"])
    .optional()
    .describe("The preferred dish type; omit for any kind of dish"),
  nutrientPriority: z
    .enum(["muscle", "bone", "sick"])
    .optional()
    .describe(
      "The nutritional priority to optimize the dishes for; omit for no priority"
    ),
  allowSuggestedIngredients: z
    .boolean()
    .optional()
    .describe(
      "Whether the dishes may use extra ingredients beyond the given list; omit or false to restrict to the list only (default false)"
    ),
});

export const generateRecipeOutputSchema = z.array(
  z.object({
    recipe_name: z.string().describe("The generated dish name"),
    ingredients: z
      .array(z.string())
      .describe("Ingredients required for the generated dish"),
    description: z
      .string()
      .describe("A short description of the generated meal"),
  })
);

type GenerateRecipeInput = z.infer<typeof generateRecipeInputSchema>;

const buildGenerateRecipePrompt = ({
  ingredients,
  type,
  nutrientPriority,
  allowSuggestedIngredients,
}: GenerateRecipeInput) => `
You are a meal-planning assistant.

Generate exactly 5 easy-to-cook dishes using ingredients from this list when possible:
${ingredients.join(", ")}

${
  allowSuggestedIngredients
    ? `The dishes may additionally use a few common pantry items and other sensible ingredients beyond the list above; when they do, include those extra ingredients in each dish's "ingredients" array alongside the ones from the list. Still feature the listed ingredients as the stars of the dishes whenever possible.`
    : `Only use the ingredients from the list above; do not introduce any other ingredients.`
}

${
  type
    ? `All 5 dishes must be of the "${type}" type (e.g. brothy simmered dishes for "soup", pan-fried dishes tossed in a wok for "stir-fried").`
    : "The dishes can be of any type."
}

${
  nutrientPriority === "muscle"
    ? 'Prioritize dishes high in protein to support muscle recovery (e.g. lean meats, eggs, tofu, legumes).'
    : nutrientPriority === "bone"
    ? 'Prioritize dishes rich in calcium and vitamin D for bone health (e.g. dairy, small fish with bones, leafy greens).'
    : nutrientPriority === "sick"
    ? 'Prioritize easily digestible, gentle dishes suitable for sick days (e.g. broths, congee, steamed foods; avoid heavy, greasy or spicy dishes).'
    : "There is no nutritional priority."
}

Return only JSON that matches the provided output schema.
`;

/**
 * Generates five suggested recipes based on available ingredients.
 */
export const generateRecipeFlow = ai.defineFlow(
  {
    name: "generateRecipeFlow",
    inputSchema: generateRecipeInputSchema,
    outputSchema: generateRecipeOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: buildGenerateRecipePrompt(input),
      output: { schema: generateRecipeOutputSchema },
    });

    if (!output) {
      throw new Error("Failed to generate recipe ideas");
    }

    return output;
  }
);
