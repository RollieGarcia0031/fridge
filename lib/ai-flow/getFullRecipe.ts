import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { ai } from "./genkit";

const inputSchema = z.object({
  recipe_name: z.string().describe("the name of the dish"),
  ingredients: z.array(z.string()).describe("The required ingredients to cook the generated dish"),
}).describe("generated recipe from the given ingredients");

const outputSchema = z.object({
  preparation: z.string().describe("tips and suggestion to prepare the ingredients before cooking the dish"),
  full_recipe: z.string().describe("step by step process on how to cook the dish")
});

export const getFullRecipeFlow = ai.defineFlow({
  name: 'getFullRecipeFlow',
  inputSchema,
  outputSchema,
}, async (input)=>{
  const prompt = `${input.recipe_name}`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: outputSchema }
  });

  if (!output) throw new Error("Failed to get full instructions");

  return output;
});