import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const recipes = defineCollection({
	loader: glob({ base: './src/content/recipes', pattern: '*.md' }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		prep_time: z.string(),
		cook_time: z.string(),
		servings: z.coerce.string(),
		tags: z.array(z.string()),
		image: z.string().optional(),
	}),
});

export const collections = { recipes };
