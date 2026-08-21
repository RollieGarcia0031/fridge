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

const buildGenerateRecipePrompt = ({ ingredients, type }: GenerateRecipeInput) => `
You are a meal-planning assistant.

Generate exactly 5 easy-to-cook dishes using ingredients from this list when possible:
${ingredients.join(", ")}

${
  type
    ? `All 5 dishes must be of the "${type}" type (e.g. brothy simmered dishes for "soup", pan-fried dishes tossed in a wok for "stir-fried").`
    : "The dishes can be of any type."
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
