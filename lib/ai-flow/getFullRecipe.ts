import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { ai } from "./genkit";

const inputSchema = z.object({
  recipe_name: z.string().describe("the name of the dish"),
  ingredients: z.array(z.string()).describe("The required ingredients to cook the generated dish"),
}).describe("generated recipe from the given ingredients");

const outputSchema = z.object({
  name: z.string(),
  servings: z.number(),
  cook_time_minutes: z.number(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.string().optional()
    })
  ),
  steps: z.array(
    z.object({
      order: z.number(),
      title: z.string(),
      instruction: z.string()
    })
  ),
  tips: z.array(z.string()),
  warnings: z.array(z.string()).optional()
});


export const getFullRecipeFlow = ai.defineFlow({
  name: 'getFullRecipeFlow',
  inputSchema,
  outputSchema,
}, async (input)=>{
  const prompt = `
    You are a JSON API.

      Generate cooking intruction for ${input.recipe_name} using ONLY the given ingredients.

      Ingredients:
      ${input.ingredients.join(", ")}
    `;

  const { output } = await ai.generate({
    prompt,
    output: { schema: outputSchema }
  });

  if (!output) throw new Error("Failed to get full instructions");

  return output;
});