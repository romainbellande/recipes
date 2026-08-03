import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateCollection } from "../scripts/validate-recipes.mjs";

const valid = `---
title: Pâtes rapides
icon: /icons/recipes/quick-pasta.svg
summary: Un dîner fiable.
prep_time: 10 min
cook_time: 20 min
servings: 4
protein: vegetarian
nutrition:
  weight_g: 1000
  energy_kj: 500
  energy_kcal: 120
  fat_g: 2
  saturates_g: 0.5
  carbohydrates_g: 20
  sugars_g: 3
  fibre_g: 2
  protein_g: 4
  salt_g: 0.5
method:
  - one-pot
tags:
  - main
  - weeknight
---

## Ingrédients

- 400 g de pâtes

## Préparation

1. Faites cuire les pâtes.
`;

async function collection(recipe = valid, name = "quick-pasta.md") {
  const directory = await mkdtemp(join(tmpdir(), "recipes-"));
  await writeFile(join(directory, name), recipe);
  return directory;
}

async function recipeCollection(recipes) {
  const directory = await mkdtemp(join(tmpdir(), "recipes-"));
  await Promise.all(
    Object.entries(recipes).map(([filename, recipe]) =>
      writeFile(join(directory, filename), recipe),
    ),
  );
  return directory;
}

const withAliases = (...aliases) =>
  valid.replace(
    "tags:",
    `aliases:\n${aliases.map((alias) => `  - ${alias}`).join("\n")}\ntags:`,
  );

test("accepts a valid Recipe", async () => {
  assert.deepEqual(await validateCollection(await collection()), []);
});

test("accepts the healthy qualifier", async () => {
  assert.deepEqual(
    await validateCollection(
      await collection(
        valid.replace("  - weeknight", "  - weeknight\n  - healthy"),
      ),
    ),
    [],
  );
});

test("accepts each Protein value", async () => {
  for (const protein of ["fish", "meat", "vegetarian"]) {
    const recipe = valid.replace(/protein: .*/, `protein: ${protein}`);
    assert.deepEqual(await validateCollection(await collection(recipe)), []);
  }
});

test("accepts a multi-select Method and omitting it", async () => {
  const both = valid.replace("  - one-pot", "  - one-pot\n  - oven");
  assert.deepEqual(await validateCollection(await collection(both)), []);
  const none = valid.replace("method:\n  - one-pot\n", "");
  assert.deepEqual(await validateCollection(await collection(none)), []);
});

test("accepts Timer definitions in front matter", async () => {
  assert.deepEqual(
    await validateCollection(
      await collection(
        valid.replace(
          "tags:",
          "timers:\n  - step: 1\n    title: Cuisez les pâtes\n    duration: 10 min\ntags:",
        ),
      ),
    ),
    [],
  );
});

test("accepts former Recipe IDs as aliases", async () => {
  assert.deepEqual(
    await validateCollection(
      await collection(withAliases("pasta-rapide", "pasta-du-soir")),
    ),
    [],
  );
});

test("rejects an alias that matches a canonical Recipe ID", async () => {
  assert.deepEqual(
    await validateCollection(
      await recipeCollection({
        "quick-pasta.md": valid,
        "tomato-pasta.md": withAliases("quick-pasta"),
      }),
    ),
    [
      'tomato-pasta.md: alias "quick-pasta" conflicts with canonical Recipe ID in quick-pasta.md',
    ],
  );
});

test("rejects an alias that matches its own canonical Recipe ID", async () => {
  assert.deepEqual(
    await validateCollection(await collection(withAliases("quick-pasta"))),
    [
      'quick-pasta.md: alias "quick-pasta" conflicts with canonical Recipe ID in quick-pasta.md',
    ],
  );
});

test("rejects aliases shared by two Recipes", async () => {
  assert.deepEqual(
    await validateCollection(
      await recipeCollection({
        "quick-pasta.md": withAliases("pasta-rapide"),
        "tomato-pasta.md": withAliases("pasta-rapide"),
      }),
    ),
    [
      'tomato-pasta.md: alias "pasta-rapide" is already an alias in quick-pasta.md',
    ],
  );
});

for (const [name, recipe, filename, rule] of [
  ["filename", valid, "Quick Pasta.md", "lowercase-kebab-case filename"],
  [
    "non-Markdown filename",
    valid,
    "quick-pasta.mdx",
    "lowercase-kebab-case filename",
  ],
  [
    "unknown field",
    valid.replace("title:", "Author: Me\ntitle:"),
    "quick-pasta.md",
    "unknown front-matter field",
  ],
  [
    "array field",
    valid.replace("title: Pâtes rapides", "title: [Pâtes rapides]"),
    "quick-pasta.md",
    "title must be a scalar or block list",
  ],
  [
    "missing field",
    valid.replace("summary: Un dîner fiable.\n", ""),
    "quick-pasta.md",
    "missing required front-matter field: summary",
  ],
  [
    "empty title",
    valid.replace("title: Pâtes rapides", "title:"),
    "quick-pasta.md",
    "title must be a non-empty string",
  ],
  [
    "missing icon",
    valid.replace("icon: /icons/recipes/quick-pasta.svg\n", ""),
    "quick-pasta.md",
    "missing required front-matter field: icon",
  ],
  [
    "invalid icon",
    valid.replace("icon: /icons/recipes/quick-pasta.svg", "icon: pâtes.svg"),
    "quick-pasta.md",
    "icon must be a repository-local path",
  ],
  [
    "missing protein",
    valid.replace("protein: vegetarian\n", ""),
    "quick-pasta.md",
    "missing required front-matter field: protein",
  ],
  [
    "invalid protein",
    valid.replace("protein: vegetarian", "protein: lapin"),
    "quick-pasta.md",
    "protein must be one of fish, meat, vegetarian",
  ],
  [
    "invalid method",
    valid.replace("  - one-pot", "  - microwave"),
    "quick-pasta.md",
    "controlled method required",
  ],
  [
    "duplicate method",
    valid.replace("  - one-pot", "  - one-pot\n  - one-pot"),
    "quick-pasta.md",
    "method must be distinct",
  ],
  [
    "empty method",
    valid.replace("method:\n  - one-pot\n", "method:\n"),
    "quick-pasta.md",
    "method must be a non-empty list",
  ],
  [
    "vegetarian tag removed",
    valid.replace("  - weeknight", "  - weeknight\n  - vegetarian"),
    "quick-pasta.md",
    "controlled tag required",
  ],
  [
    "dropped image field",
    valid.replace(
      "protein: vegetarian\n",
      "image: https://example.com/pasta.jpg\nprotein: vegetarian\n",
    ),
    "quick-pasta.md",
    "unknown front-matter field: image",
  ],
  [
    "duration",
    valid.replace("prep_time: 10 min", "prep_time: bientôt"),
    "quick-pasta.md",
    "prep_time must be a duration",
  ],
  [
    "servings",
    valid.replace("servings: 4", "servings: beaucoup"),
    "quick-pasta.md",
    "servings must be a number or range",
  ],
  [
    "nutrition",
    valid.replace("  protein_g: 4\n", ""),
    "quick-pasta.md",
    "nutrition protein_g must be a non-negative number",
  ],
  [
    "tags",
    valid.replace("  - weeknight", "  - speedy"),
    "quick-pasta.md",
    "controlled tag",
  ],
  [
    "duplicate tags",
    valid.replace("  - weeknight", "  - main"),
    "quick-pasta.md",
    "tags must be distinct",
  ],
  [
    "course tags",
    valid.replace("  - weeknight", "  - side"),
    "quick-pasta.md",
    "exactly one course tag",
  ],
  [
    "ingredients",
    valid.replace("## Ingrédients", "## Courses"),
    "quick-pasta.md",
    "exactly one ## Ingrédients section",
  ],
  [
    "method",
    valid.replace("1. Faites cuire les pâtes.", "- Faites cuire les pâtes."),
    "quick-pasta.md",
    "numbered steps",
  ],
  [
    "body H1",
    valid.replace("## Ingrédients", "# Pâtes rapides\n\n## Ingrédients"),
    "quick-pasta.md",
    "body must not contain an H1",
  ],
  [
    "inline Timer marker",
    valid.replace(
      "Faites cuire les pâtes.",
      "Faites cuire les pâtes. ⏱ 10 min",
    ),
    "quick-pasta.md",
    "Timer markers are not allowed",
  ],
  [
    "unsupported Markdown",
    valid.replace(
      "Faites cuire les pâtes.",
      "[Voir la source](https://example.com)",
    ),
    "quick-pasta.md",
    "invalid Inline Recipe markup: unsupported Markdown",
  ],
  [
    "malformed Inline Recipe markup",
    valid.replace("Faites cuire les pâtes.", "**Faites cuire les pâtes."),
    "quick-pasta.md",
    "invalid Inline Recipe markup: unmatched emphasis delimiter",
  ],
  [
    "Timer step",
    valid.replace(
      "tags:",
      "timers:\n  - step: 2\n    title: Cuisez les pâtes\n    duration: 10 min\ntags:",
    ),
    "quick-pasta.md",
    "Timer step must refer",
  ],
  [
    "Timer duration",
    valid.replace(
      "tags:",
      "timers:\n  - step: 1\n    title: Cuisez les pâtes\n    duration: bientôt\ntags:",
    ),
    "quick-pasta.md",
    "Timer duration must be a duration",
  ],
]) {
  test(`rejects ${name}`, async () => {
    const errors = await validateCollection(await collection(recipe, filename));
    assert.ok(
      errors.some((error) => error.includes(filename) && error.includes(rule)),
      errors.join("\n"),
    );
  });
}
