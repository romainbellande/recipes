import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";
import {
  matchingRecipeIndices,
  nextSelection,
  resetCollection,
  scaleIngredient,
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

test("keeps a matching selection or uses the first result", () => {
  assert.equal(nextSelection([1, 2], 2), 2);
  assert.equal(nextSelection([1, 2], 0), 1);
});

test("resets the query and every active filter", () => {
  const search = { value: "pomme" };
  const filters = [{ checked: true }, { checked: false }];
  resetCollection(search, filters);
  assert.equal(search.value, "");
  assert.deepEqual(
    filters.map((filter) => filter.checked),
    [false, false],
  );
});

test("scales leading ingredient quantities with concise French decimals", () => {
  assert.equal(scaleIngredient("400 g de pâtes", 4, 6), "600 g de pâtes");
  assert.equal(scaleIngredient("1,5 l de soupe", 4, 3), "1,13 l de soupe");
  assert.equal(scaleIngredient("1 œuf", 3, 1), "0,33 œuf");
  assert.equal(scaleIngredient("Sel", 4, 6), "Sel");
});

test("builds a Cookbook and dedicated French Recipe URLs", async () => {
  await run("npm", ["run", "build"]);
  const page = await readFile("dist/index.html", "utf8");
  const source = await readFile("src/pages/index.astro", "utf8");
  assert.equal((page.match(/data-recipe="\d+"/g) ?? []).length, 12);
  assert.match(page, /<dt[^>]*>Type de plat<\/dt><dd[^>]*>Dessert<\/dd>/);
  assert.match(
    page,
    /<dt[^>]*>Caractéristiques<\/dt><dd[^>]*>À préparer à l&#39;avance, Du placard<\/dd>/,
  );
  for (const text of [
    "Crumble aux pommes",
    "Des pommes fondantes sous une croûte croustillante à l&#39;avoine.",
    "1 h · pour 6 personnes · Dessert · À préparer à l&#39;avance",
    'aria-controls="recipe-0"',
    'aria-current="true"',
    "Passer en mode cuisine",
    "Quitter le mode cuisine",
    "Étape en cours",
    "Étape suivante",
    "Terminer la Recette",
    "function resetCook()",
    'type="search"',
    "Rechercher une Recette",
    "Filtrer par étiquette",
    "Aucune Recette ne correspond à votre recherche.",
    "Réinitialiser",
    "data-tag-filter",
    "function updateCollection()",
    "Nombre de personnes",
    'type="number"',
    'min="1"',
    'step="1"',
    "function setServings(index, value)",
    "scaleIngredient",
  ]) {
    assert.ok(page.includes(text) || source.includes(text), `expected ${text}`);
  }
  assert.match(
    source,
    /exit-cook["']\)\.addEventListener\(["']click["'], \(\) => \{\s*resetCook\(\);/,
  );
  assert.match(
    source,
    /matchingRecipeIndices\(\s*recipes,\s*search\.value,\s*selectedTags,\s*\)/,
  );
  assert.match(source, /recipeDetail\.hidden = !hasMatches/);
  assert.match(source, /nextSelection\(matches, selected\)/);
  assert.doesNotMatch(page, /\b(?:localStorage|sessionStorage|indexedDB)\b/);

  const recipeFiles = (await readdir("src/content/recipes"))
    .filter((filename) => filename.endsWith(".md"))
    .sort();
  for (const filename of recipeFiles) {
    const id = filename.slice(0, -3);
    const recipe = await readFile(`src/content/recipes/${filename}`, "utf8");
    const title = recipe.match(/^title: (.+)$/m)?.[1];
    const ingredient = recipe.match(/^- (.+)$/m)?.[1];
    const step = recipe.match(/^1\. (.+)$/m)?.[1];
    const published = await readFile(`dist/recipe/${id}/index.html`, "utf8");
    const renderedRecipe = published
      .replaceAll("&#39;", "'")
      .replaceAll("’", "'");
    assert.ok(title, `expected title in ${filename}`);
    assert.ok(ingredient, `expected ingredient in ${filename}`);
    assert.ok(step, `expected preparation step in ${filename}`);
    assert.match(published, new RegExp(`<h1[^>]*>${title}</h1>`));
    assert.ok(renderedRecipe.includes(ingredient));
    assert.ok(renderedRecipe.includes(step));
    assert.match(
      published,
      /<a class="return-link" href="\/recipes"[^>]*>← Retour à la Collection<\/a>/,
    );
    assert.match(published, /<h1[^>]*tabindex="-1"/);
    assert.ok(
      published.includes(
        `<link rel="canonical" href="https://romainbellande.github.io/recipes/recipe/${id}/">`,
      ),
    );
  }
});
