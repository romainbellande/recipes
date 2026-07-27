import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const API_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const DEFAULT_GRAMS = 100;

interface SearchFood {
  fdcId: number;
  description: string;
  dataType?: string;
}

interface FoodNutrient {
  amount?: number;
  nutrient?: {
    name?: string;
    unitName?: string;
  };
}

interface FoodDetails {
  fdcId: number;
  description: string;
  dataType?: string;
  foodNutrients?: FoodNutrient[];
}

function bestMatch(
  ingredient: string,
  foods: SearchFood[],
): SearchFood | undefined {
  const terms = ingredient.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const meaningfulTerms = terms.filter(
    (term) => !["raw", "cooked", "drained", "fresh"].includes(term),
  );
  return foods
    .map((food) => {
      const description = food.description.toLowerCase();
      const matchedTerms = meaningfulTerms.filter((term) =>
        description.includes(term),
      ).length;
      const unwantedTerms = [
        "leaves",
        "puffs",
        "pie",
        "chips",
        "babyfood",
      ].filter((term) => description.includes(term)).length;
      return {
        food,
        score: matchedTerms * 10 - unwantedTerms * 20 - description.length / 10,
      };
    })
    .sort((a, b) => b.score - a.score)[0]?.food;
}

function apiKey(): string {
  const key = process.env.FDC_API_KEY;
  if (!key)
    throw new Error(
      "FDC_API_KEY is required. Get one at https://fdc.nal.usda.gov/api-key-signup.html",
    );
  return key;
}

async function fdcFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  url.searchParams.set("api_key", apiKey());
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(
      `FoodData Central returned ${response.status}: ${await response.text()}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function getIngredientNutrition(
  ingredient: string,
  grams = DEFAULT_GRAMS,
) {
  const search = await fdcFetch<{ foods?: SearchFood[] }>("/foods/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: ingredient,
      dataType: ["Foundation", "SR Legacy"],
      pageSize: 50,
    }),
  });
  const food = bestMatch(ingredient, search.foods ?? []);
  if (!food) throw new Error(`No USDA food found for "${ingredient}".`);

  const details = await fdcFetch<FoodDetails>(`/food/${food.fdcId}`);
  const multiplier = grams / DEFAULT_GRAMS;
  const nutrients = (details.foodNutrients ?? [])
    .filter(
      (nutrient) => nutrient.amount !== undefined && nutrient.nutrient?.name,
    )
    .map((nutrient) => ({
      name: nutrient.nutrient!.name!,
      unit: nutrient.nutrient!.unitName ?? "",
      per100g: nutrient.amount!,
      amount: nutrient.amount! * multiplier,
    }));

  return {
    ingredient,
    grams,
    food: {
      fdcId: details.fdcId,
      description: details.description,
      dataType: details.dataType,
      url: `https://fdc.nal.usda.gov/food-details/${details.fdcId}/nutrients`,
    },
    nutrients,
    source: "USDA FoodData Central",
  };
}

const server = new McpServer({
  name: "usda-fooddata-central",
  version: "0.1.0",
});

server.registerTool(
  "get_ingredient_nutrition",
  {
    description:
      "Find the best USDA Foundation or SR Legacy match for an ingredient and return its nutrients, scaled to the requested edible grams.",
    inputSchema: z.object({
      ingredient: z
        .string()
        .min(1)
        .describe('Ingredient and state, for example "raw chicken breast".'),
      grams: z
        .number()
        .positive()
        .optional()
        .describe("Edible ingredient weight in grams. Defaults to 100."),
    }),
  },
  async ({ ingredient, grams }) => {
    try {
      const nutrition = await getIngredientNutrition(
        ingredient,
        grams ?? DEFAULT_GRAMS,
      );
      return {
        content: [{ type: "text", text: JSON.stringify(nutrition, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text:
              error instanceof Error
                ? error.message
                : "Unable to fetch USDA nutrition.",
          },
        ],
        isError: true,
      };
    }
  },
);

await server.connect(new StdioServerTransport());
