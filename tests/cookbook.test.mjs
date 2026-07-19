import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);

test("builds a Cookbook with French Recipes and cook mode", async () => {
  await run("npm", ["run", "build"]);
  const page = await readFile("dist/index.html", "utf8");
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
  ]) {
    assert.ok(page.includes(text), `expected ${text}`);
  }
  assert.match(
    page,
    /exit-cook["']\)\.addEventListener\(["']click["'], \(\) => \{\s*resetCook\(\);/,
  );
  assert.doesNotMatch(page, /\b(?:localStorage|sessionStorage|indexedDB)\b/);
});
