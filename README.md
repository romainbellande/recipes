# Recipes

A static, open Collection of everyday Recipes for home cooks.

## Develop

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
