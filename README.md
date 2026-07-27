# Recipes

A static, open Collection of everyday Recipes for home cooks.

## Features

- Browse Recipes with text search and tag filters; filter state is shareable in the URL.
- Read focused Recipe pages with adjustable servings and automatically scaled Ingredients.
- Switch to a checkable shopping list or step-by-step cooking mode with editable timers and audio alerts.
- Print Recipes or save them as PDFs.
- Install the site as a lightweight PWA.
- Use accessible controls, live search results, visible keyboard focus, and skip links.
- Keep Recipe content consistent with schema-backed collections and a validator for metadata, tags, images, Ingredients, steps, aliases, and timers.

## Develop

Use [direnv](https://direnv.net/) to load `FDC_API_KEY` from `.envrc` before starting the site.

```sh
bun install
bun run dev
```

## Check a change

```sh
bun run validate
bun run test
bun run check
bun run build
```

Recipes live in `src/content/recipes/`. Each lowercase-kebab-case Markdown
filename is a Recipe identity. The validator enforces the required front matter,
controlled tags, local image paths, Ingredients list, and numbered Method.

## Recipe content license

Canonical Recipe Markdown and project-owned Recipe media are licensed under
[CC BY 4.0](LICENSE-RECIPES.md), attributed to Recipes contributors. Changes
must be indicated. Application code and other material are excluded.
