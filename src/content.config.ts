import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const recipes = defineCollection({
  loader: glob({ base: "./src/content/recipes", pattern: "*.md" }),
  schema: z.object({
    title: z.string(),
    icon: z
      .string()
      .regex(/^\p{Extended_Pictographic}$/u, "icon must be a single icon"),
    summary: z.string(),
    prep_time: z.string(),
    cook_time: z.string(),
    servings: z.coerce.string(),
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
    image: z.string().optional(),
  }),
});

export const collections = { recipes };
