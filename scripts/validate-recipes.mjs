import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { basename, join } from "node:path";
import { parseInlineRecipeMarkup } from "../src/scripts/collection.js";
import {
  COURSES,
  METHOD_VALUES,
  PROTEIN_VALUES,
  QUALIFIERS,
} from "../src/scripts/taxonomy.js";

const requiredFields = [
  "title",
  "icon",
  "summary",
  "prep_time",
  "cook_time",
  "servings",
  "nutrition",
  "tags",
  "protein",
];
const allowedFields = new Set([
  ...requiredFields,
  "method",
  "aliases",
  "timers",
]);
const recipeId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const courses = new Set(Object.keys(COURSES));
const qualifiers = new Set(Object.keys(QUALIFIERS));
const duration = /^(?:(?:[1-9]\d*) h(?: [1-9]\d* min)?|[1-9]\d* min)$/;
const servings = /^[1-9]\d*(?:\s*[–-]\s*[1-9]\d*)?$/;
const localPath = /^\/[^\s](?:[^\s]|\s+[^\s])*\/[^\s]+$/;

function parseRecipe(source) {
  const errors = [];
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match)
    return {
      fields: {},
      body: "",
      errors: ["must start with YAML front matter"],
    };
  const fields = {};
  let currentList;
  let currentTimer;
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const field = line.match(/^([A-Za-z_]+):(?:\s*(.*))?$/);
    if (field) {
      currentList = field[1];
      currentTimer = undefined;
      fields[currentList] = field[2] ?? "";
      if (/^(?:\[|\{|[|>])/.test(fields[currentList]))
        errors.push(
          `front-matter field ${currentList} must be a scalar or block list`,
        );
      continue;
    }
    const timerItem = line.match(/^ {2}- step:\s*(.+)$/);
    if (currentList === "timers" && timerItem) {
      if (!Array.isArray(fields.timers)) fields.timers = [];
      currentTimer = { step: timerItem[1] };
      fields.timers.push(currentTimer);
      continue;
    }
    const timerField = line.match(/^ {4}(title|duration):\s*(.+)$/);
    if (currentList === "timers" && currentTimer && timerField) {
      currentTimer[timerField[1]] = timerField[2];
      continue;
    }
    const nutritionField = line.match(/^ {2}([a-z_]+):\s*(.+)$/);
    if (currentList === "nutrition" && nutritionField) {
      if (
        typeof fields.nutrition !== "object" ||
        Array.isArray(fields.nutrition)
      )
        fields.nutrition = {};
      fields.nutrition[nutritionField[1]] = nutritionField[2];
      continue;
    }
    const item = line.match(/^\s+-\s+(.+)$/);
    if (item && currentList) {
      if (!Array.isArray(fields[currentList])) fields[currentList] = [];
      fields[currentList].push(item[1]);
      continue;
    }
    errors.push(`invalid front-matter syntax: ${line}`);
  }
  return { fields, body: match[2], errors };
}

function validateRecipe(filename, source) {
  const errors = [];
  const fail = (rule) => errors.push(`${filename}: ${rule}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(filename))
    fail("use a lowercase-kebab-case filename");
  const { fields, body, errors: parseErrors } = parseRecipe(source);
  for (const error of parseErrors) fail(error);
  for (const field of Object.keys(fields))
    if (!allowedFields.has(field)) fail(`unknown front-matter field: ${field}`);
  for (const field of requiredFields)
    if (!(field in fields))
      fail(`missing required front-matter field: ${field}`);
  for (const field of [
    "title",
    "icon",
    "summary",
    "prep_time",
    "cook_time",
    "servings",
  ]) {
    if (typeof fields[field] !== "string" || !fields[field].trim())
      fail(`${field} must be a non-empty string`);
  }
  if (typeof fields.icon === "string" && !localPath.test(fields.icon))
    fail("icon must be a repository-local path beginning with /");
  for (const field of ["prep_time", "cook_time"])
    if (typeof fields[field] === "string" && !duration.test(fields[field]))
      fail(`${field} must be a duration such as "20 min" or "1 h 15 min"`);
  if (typeof fields.servings === "string" && !servings.test(fields.servings))
    fail('servings must be a number or range such as "4" or "2-4"');
  const nutritionFields = [
    "weight_g",
    "energy_kj",
    "energy_kcal",
    "fat_g",
    "saturates_g",
    "carbohydrates_g",
    "sugars_g",
    "fibre_g",
    "protein_g",
    "salt_g",
  ];
  if (typeof fields.nutrition !== "object" || Array.isArray(fields.nutrition))
    fail("nutrition must be a block of numeric estimates");
  else
    for (const field of nutritionFields) {
      const value = fields.nutrition[field] ?? "";
      if (!/^\d+(?:\.\d+)?$/.test(value))
        fail(`nutrition ${field} must be a non-negative number`);
      else if (field === "weight_g" && Number(value) === 0)
        fail("nutrition weight_g must be greater than zero");
    }
  if (!Array.isArray(fields.tags) || !fields.tags.length)
    fail("tags must be a non-empty list");
  else {
    const tags = fields.tags;
    if (new Set(tags).size !== tags.length) fail("tags must be distinct");
    const courseTags = tags.filter((tag) => courses.has(tag));
    if (courseTags.length !== 1)
      fail("tags must include exactly one course tag");
    for (const tag of tags)
      if (!courses.has(tag) && !qualifiers.has(tag))
        fail(`controlled tag required; found "${tag}"`);
  }
  if (!PROTEIN_VALUES.has(fields.protein))
    fail(`protein must be one of ${[...PROTEIN_VALUES].join(", ")}`);
  if ("method" in fields) {
    if (!Array.isArray(fields.method) || !fields.method.length)
      fail("method must be a non-empty list");
    else {
      const method = fields.method;
      if (new Set(method).size !== method.length)
        fail("method must be distinct");
      for (const value of method)
        if (!METHOD_VALUES.has(value))
          fail(`controlled method required; found "${value}"`);
    }
  }
  const aliases = Array.isArray(fields.aliases) ? fields.aliases : [];
  if ("aliases" in fields && !Array.isArray(fields.aliases))
    fail("aliases must be a list");
  for (const alias of aliases)
    if (!recipeId.test(alias))
      fail(`alias must be a Recipe ID; found "${alias}"`);
  const ingredientSections = [...body.matchAll(/^## Ingrédients\s*$/gm)];
  const methodSections = [...body.matchAll(/^## Préparation\s*$/gm)];
  if (ingredientSections.length !== 1)
    fail("require exactly one ## Ingrédients section");
  if (methodSections.length !== 1)
    fail("require exactly one ## Préparation section");
  if (ingredientSections.length === 1 && methodSections.length === 1) {
    const ingredients = body
      .slice(
        ingredientSections[0].index + ingredientSections[0][0].length,
        methodSections[0].index,
      )
      .trim();
    const method = body
      .slice(methodSections[0].index + methodSections[0][0].length)
      .trim();
    const ingredientItems = ingredients.match(/^\s*-\s+(.+)$/gm) ?? [];
    const steps = method.match(/^\s*\d+\.\s+(.+)$/gm) ?? [];
    if (!ingredientItems.length) fail("Ingrédients must contain bullet items");
    if (!steps.some((step) => /^\s*1\.\s+/.test(step)))
      fail("Préparation must contain numbered steps");
    try {
      parseInlineRecipeMarkup(body);
    } catch ({ message }) {
      fail(`invalid Inline Recipe markup: ${message}`);
    }
    if (/⏱/.test(method))
      fail("Timer markers are not allowed; use timers front-matter metadata");
    if ("timers" in fields && !Array.isArray(fields.timers))
      fail("timers must be a list");
    for (const timer of fields.timers ?? []) {
      if (!/^[1-9]\d*$/.test(timer.step ?? ""))
        fail("Timer step must be a positive integer");
      else if (Number(timer.step) > steps.length)
        fail(
          `Timer step must refer to one of the ${steps.length} preparation steps`,
        );
      if (!timer.title?.trim()) fail("Timer title must be a non-empty string");
      if (!duration.test(timer.duration ?? ""))
        fail(
          'Timer duration must be a duration such as "20 min" or "1 h 15 min"',
        );
    }
  }
  if (/^# /m.test(body)) fail("Recipe body must not contain an H1");
  return { aliases, errors };
}

export async function validateCollection(directory) {
  const directoryEntries = await readdir(directory, { withFileTypes: true });
  const files = directoryEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  const recipes = await Promise.all(
    files.map(async (filename) => ({
      filename,
      ...validateRecipe(
        filename,
        await readFile(join(directory, filename), "utf8"),
      ),
    })),
  );
  const errors = recipes.flatMap((recipe) => recipe.errors);
  const canonicalIds = new Map(
    files.map((filename) => [basename(filename, ".md"), filename]),
  );
  const aliases = new Map();
  for (const recipe of recipes)
    for (const alias of recipe.aliases) {
      const canonicalFilename = canonicalIds.get(alias);
      if (canonicalFilename)
        errors.push(
          `${recipe.filename}: alias "${alias}" conflicts with canonical Recipe ID in ${canonicalFilename}`,
        );
      const firstAliasFilename = aliases.get(alias);
      if (firstAliasFilename)
        errors.push(
          `${recipe.filename}: alias "${alias}" is already an alias in ${firstAliasFilename}`,
        );
      else aliases.set(alias, recipe.filename);
    }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = join(process.cwd(), "src/content/recipes");
  const errors = await validateCollection(directory);
  if (errors.length) {
    process.stderr.write(`${errors.join("\n")}\n`);
    process.exitCode = 1;
  } else process.stdout.write(`Validated ${basename(directory)} collection.\n`);
}
