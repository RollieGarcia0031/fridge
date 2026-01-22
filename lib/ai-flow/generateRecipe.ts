import { googleAI } from "@genkit-ai/google-genai";
import { genkit, z } from "genkit";
import { ai } from "./genkit";

const inputSchema = z.object({
  ingredients: z.array(z.string()).describe("The available ingredients to cook a meal")
});

const outputSchema = z.array(z.object({
    recipe_name: z.string().describe("the name of the dish"),
    ingredients: z.array(z.string()).describe("The required ingredients to cook the generated dish"),
    description: z.string().describe("short description for the generated meal")
  }).describe("generated recipe from the given ingredients")
);

export const generateRecipeFlow = ai.defineFlow(
  {
    name: 'generateRecipeFlow',
    inputSchema,
    outputSchema,
  },

  async (input) => {
    const prompt = `generate 5 dishes with these available ingredients:
      ${input.ingredients}, provide simple dishes that are easy to cook.
    `;

    const { output } = await ai.generate({
      prompt,
      output: {schema: outputSchema}
    });

    if (!output) throw new Error("Failed to generate a dish");

    return output
  }
);