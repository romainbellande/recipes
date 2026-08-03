import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { METHOD_VALUES, PROTEIN_VALUES } from "./scripts/taxonomy.js";

const recipes = defineCollection({
  loader: glob({ base: "./src/content/recipes", pattern: "*.md" }),
  schema: z.object({
    title: z.string(),
    icon: z
      .string()
      .regex(/^\/[^\s].*\/[^\s]+$/, "icon must be a repository-local path"),
    summary: z.string(),
    prep_time: z.string(),
    cook_time: z.string(),
    servings: z.coerce.string(),
    protein: z.enum([...PROTEIN_VALUES]),
    method: z
      .enum([...METHOD_VALUES])
      .array()
      .min(1)
      .refine(
        (values) => new Set(values).size === values.length,
        "method must be distinct",
      )
      .optional(),
    nutrition: z.object({
      weight_g: z.coerce.number().positive(),
      energy_kj: z.coerce.number().nonnegative(),
      energy_kcal: z.coerce.number().nonnegative(),
      fat_g: z.coerce.number().nonnegative(),
      saturates_g: z.coerce.number().nonnegative(),
      carbohydrates_g: z.coerce.number().nonnegative(),
      sugars_g: z.coerce.number().nonnegative(),
      fibre_g: z.coerce.number().nonnegative(),
      protein_g: z.coerce.number().nonnegative(),
      salt_g: z.coerce.number().nonnegative(),
    }),
    tags: z.array(z.string()),
    timers: z
      .array(
        z.object({
          step: z.coerce.number().int().positive(),
          title: z.string().min(1),
          duration: z
            .string()
            .regex(/^(?:(?:[1-9]\d*) h(?: [1-9]\d* min)?|[1-9]\d* min)$/),
        }),
      )
      .optional(),
    aliases: z.array(z.string()).optional(),
  }),
});

export const collections = { recipes };
