import { z } from "genkit";
import { ai } from "./genkit";

export const getFullRecipeInputSchema = z
  .object({
    recipe_name: z.string().describe("The dish name"),
    ingredients: z
      .array(z.string())
      .min(1)
      .describe("Ingredients that can be used for the dish"),
  })
  .describe("Recipe details used to generate complete cooking instructions");

export const getFullRecipeOutputSchema = z.object({
  name: z.string().describe("The dish name"),
  servings: z.number().describe("Number of servings"),
  cook_time_minutes: z.number().describe("Estimated cooking time in minutes"),
  ingredients: z.array(
    z.object({
      name: z.string().describe("Ingredient name"),
      quantity: z.string().optional().describe("Ingredient quantity"),
    })
  ),
  steps: z.array(
    z.object({
      order: z.number().describe("Step number"),
      title: z.string().describe("Short step title"),
      instruction: z.string().describe("Instruction for this step"),
    })
  ),
  tips: z.array(z.string()).describe("Helpful cooking tips"),
  warnings: z.array(z.string()).optional().describe("Safety or allergy warnings"),
  tutorial_url: z
    .string()
    .optional()
    .describe(
      "URL of a real YouTube or instructional video tutorial for this dish, if one exists. Omit entirely if you cannot name one"
    ),
});

type GetFullRecipeInput = z.infer<typeof getFullRecipeInputSchema>;

const buildGetFullRecipePrompt = ({
  recipe_name,
  ingredients,
}: GetFullRecipeInput) => `
You are a JSON-only cooking API.

Generate a complete cooking guide for "${recipe_name}" using ONLY these ingredients:
${ingredients.join(", ")}

If you know of a real, well-known YouTube or instructional video tutorial for "${recipe_name}", set "tutorial_url" to its full URL. Never invent or guess URLs; if you are not certain a video exists, omit "tutorial_url" completely.

Return only JSON that matches the provided schema.
`;

/**
 * Generates complete step-by-step instructions for a selected dish.
 */
export const getFullRecipeFlow = ai.defineFlow(
  {
    name: "getFullRecipeFlow",
    inputSchema: getFullRecipeInputSchema,
    outputSchema: getFullRecipeOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: buildGetFullRecipePrompt(input),
      output: { schema: getFullRecipeOutputSchema },
    });

    if (!output) {
      throw new Error("Failed to generate full recipe instructions");
    }

    return output;
  }
);
