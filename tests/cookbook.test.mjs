import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";
import {
  collectionFiltersFromSearch,
  collectionSearchParams,
  matchingRecipeIndices,
} from "../src/scripts/collection.js";

const run = promisify(execFile);

const recipes = [
  {
    title: "Tarte aux pommes",
    summary: "Un dessert simple",
    ingredients: ["pommes", "farine"],
    tags: ["dessert", "vegetarian"],
  },
  {
    title: "Soupe du soir",
    summary: "Un dîner avec du poivron",
    ingredients: ["lentilles"],
    tags: ["main", "vegetarian"],
  },
  {
    title: "Poulet rôti",
    summary: "Un plat principal",
    ingredients: ["citron"],
    tags: ["main"],
  },
];

test("filters titles, summaries, ingredients, and tags", () => {
  assert.deepEqual(matchingRecipeIndices(recipes, "PÔMME", []), [0]);
  assert.deepEqual(matchingRecipeIndices(recipes, "poivron", []), [1]);
  assert.deepEqual(matchingRecipeIndices(recipes, "citron", []), [2]);
  assert.deepEqual(
    matchingRecipeIndices(recipes, "", ["main", "vegetarian"]),
    [1],
  );
});

test("restores a verbatim query and only distinct controlled URL tags", () => {
  const controlledTags = ["main", "vegetarian", "dessert"];
  assert.deepEqual(
    collectionFiltersFromSearch(
      "?q=P%C3%94MME+%26+citron&tag=main&tag=main&tag=&tag=unknown&tag=main%25",
      controlledTags,
    ),
    { query: "PÔMME & citron", selectedTags: ["main"] },
  );
  assert.equal(
    collectionSearchParams(
      "PÔMME & citron",
      ["main", "main", "unknown", "", "vegetarian"],
      controlledTags,
    ).toString(),
    "q=P%C3%94MME+%26+citron&tag=main&tag=vegetarian",
  );
});

test("builds Collection-to-Recipe navigation with restored context and focus", async () => {
  await run("npm", ["run", "build"]);
  const page = await readFile("dist/index.html", "utf8");
  const source = await readFile("src/pages/index.astro", "utf8");
  const recipe = await readFile("dist/recipe/apple-crumble/index.html", "utf8");
  const recipeSource = await readFile("src/pages/recipe/[id].astro", "utf8");
  const recipeFiles = (await readdir("src/content/recipes"))
    .filter((filename) => filename.endsWith(".md"))
    .sort();
  const titles = await Promise.all(
    recipeFiles.map(async (filename) => {
      const recipe = await readFile(`src/content/recipes/${filename}`, "utf8");
      return recipe.match(/^title: (.+)$/m)?.[1];
    }),
  );

  const cardLinks = [
    ...page.matchAll(
      /<a[^>]*class="recipe-card"[^>]*aria-label="([^"]+)"[^>]*>/g,
    ),
  ];
  assert.equal(cardLinks.length, recipeFiles.length);
  assert.deepEqual(cardLinks.map((link) => link[1]).sort(), [...titles].sort());
  for (const filename of recipeFiles) {
    const id = filename.slice(0, -3);
    assert.match(
      page,
      new RegExp(`href="/recipes/recipe/${id}/#recipe-${id}"`),
    );
  }
  assert.match(
    page,
    /<a id="recipe-apple-crumble" class="recipe-card" data-recipe-card[^>]*>/,
  );
  assert.match(source, /card\.dataset\.recipeUrl/);
  assert.match(source, /#\$\{card\.id\}/);
  assert.match(source, /originCard.*focus\(\)/);
  assert.match(
    recipe,
    /<a id="return-link" class="return-link" data-origin-card="recipe-apple-crumble" href="\/recipes"/,
  );
  assert.match(recipeSource, /collectionFiltersFromSearch\(/);
  assert.match(recipeSource, /collectionSearchParams\(/);
  assert.match(recipeSource, /#recipe-title"\)\.focus\(\)/);
  assert.equal(
    (page.match(/class="image-placeholder" aria-hidden="true"/g) ?? []).length,
    recipeFiles.length,
  );
  const firstCard = page.slice(
    cardLinks[0].index,
    page.indexOf("</a>", cardLinks[0].index),
  );
  assert.ok(firstCard.includes("Photo à venir"));
  assert.ok(
    firstCard.indexOf("image-placeholder") < firstCard.indexOf("card-content"),
  );
  assert.ok(firstCard.indexOf("card-meta") < firstCard.indexOf("<h2"));
  assert.ok(firstCard.indexOf("<h2") < firstCard.indexOf("card-servings"));
  assert.match(source, /history\.replaceState\(/);
  assert.doesNotMatch(
    source,
    /(?:pushState|localStorage|sessionStorage|indexedDB)/,
  );
  assert.match(source, /collectionFiltersFromSearch\(/);
  assert.match(source, /collectionSearchParams\(/);
  assert.match(source, /a:focus-visible/);
  assert.match(
    source,
    /@media \(max-width: 720px\)[\s\S]*?\.recipe-card \{\s*grid-template-columns: 1fr;/,
  );
  assert.match(source, /background: #e9dfd3/);
  assert.ok(page.includes("Aucune Recette ne correspond à votre recherche."));
});
