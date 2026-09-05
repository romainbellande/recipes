import { METHOD_VALUES, PROTEIN_VALUES, TAG_VALUES } from "./taxonomy.js";

export const durationInSeconds = (duration) => {
  const [hours, minutes] = [
    Number(duration.match(/(\d+) h/)?.[1] ?? 0),
    Number(duration.match(/(\d+) min/)?.[1] ?? 0),
  ];
  return hours * 3600 + minutes * 60;
};

export const normalizeText = (value) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replaceAll("œ", "oe")
    .replaceAll("æ", "ae");

const invariantIngredientWords = new Set(["mais", "noix", "pois", "radis"]);

const ingredientTokens = (value) =>
  (normalizeText(value).match(/\p{L}+/gu) ?? []).map((word) =>
    invariantIngredientWords.has(word) ? word : word.replace(/(?:s|x)$/u, ""),
  );

export const ingredientTerms = (query) => {
  const terms = new Map();
  for (const term of query.split(",").map((term) => term.trim())) {
    const key = ingredientTokens(term).join(" ");
    if (key && !terms.has(key)) terms.set(key, term);
  }
  return [...terms.values()];
};

const includesTerm = (text, term) => {
  const tokens = ingredientTokens(text);
  const termTokens = ingredientTokens(term);
  return (
    termTokens.length > 0 &&
    tokens.some((_, index) =>
      termTokens.every((token, offset) => tokens[index + offset] === token),
    )
  );
};

export const matchingRecipes = (recipes, query, filters = {}) => {
  const terms = ingredientTerms(query);
  const { tags = [], protein = "", method = [] } = filters;
  return recipes
    .map((recipe, index) => ({
      recipe,
      index,
      matchedIngredients: recipe.ingredients.filter((ingredient) =>
        terms.some((term) => includesTerm(ingredient, term)),
      ),
    }))
    .filter(({ recipe, matchedIngredients }) => {
      const matchesTerm = (term) =>
        matchedIngredients.some((ingredient) =>
          includesTerm(ingredient, term),
        ) || includesTerm(recipe.title, term);
      return (
        (!terms.length || terms.every(matchesTerm)) &&
        tags.every((tag) => recipe.tags.includes(tag)) &&
        (!protein || recipe.protein === protein) &&
        method.every((value) => (recipe.method ?? []).includes(value))
      );
    });
};

const vulgarFractions = {
  "¼": 1 / 4,
  "½": 1 / 2,
  "¾": 3 / 4,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8,
};

export const parseInlineRecipeMarkup = (value) => {
  if (/!?(?:\[[^\]]*\]\([^)]*\))|`|~~|<[^>]*>|(?<!\*)\*(?!\*)/.test(value))
    throw new Error("unsupported Markdown");

  const parse = (index, closing) => {
    const nodes = [];
    let text = "";
    const flush = () => {
      if (text) nodes.push(text);
      text = "";
    };
    while (index < value.length) {
      if (closing && value.startsWith(closing, index)) {
        if (!nodes.length && !text) throw new Error("empty emphasis");
        flush();
        return [nodes, index + closing.length];
      }
      const delimiter = value.startsWith("**", index)
        ? "**"
        : value[index] === "_"
          ? "_"
          : undefined;
      if (!delimiter) {
        text += value[index++];
        continue;
      }
      flush();
      const [children, nextIndex] = parse(index + delimiter.length, delimiter);
      nodes.push({ tag: delimiter === "**" ? "strong" : "em", children });
      index = nextIndex;
    }
    if (closing) throw new Error("unmatched emphasis delimiter");
    flush();
    return [nodes, index];
  };

  return parse(0)[0];
};

export const appendInlineRecipeMarkup = (parent, value) => {
  const append = (nodes, target) => {
    for (const node of nodes) {
      if (typeof node === "string") target.append(node);
      else {
        const element = globalThis.document.createElement(node.tag);
        append(node.children, element);
        target.append(element);
      }
    }
  };
  append(parseInlineRecipeMarkup(value), parent);
};

export const setInlineRecipeMarkup = (element, value) => {
  element.replaceChildren();
  appendInlineRecipeMarkup(element, value);
};

export const scaleIngredient = (
  ingredient,
  canonicalServings,
  selectedServings,
) => {
  const prefix = ingredient.match(/^(?:(?:\*\*)|_)*/)?.[0] ?? "";
  const match = ingredient
    .slice(prefix.length)
    .match(/^(?:(\d+(?:[.,]\d+)?)?([¼½¾⅓⅔⅛⅜⅝⅞])|(\d+(?:[.,]\d+)?))/);
  if (!match) return ingredient;

  const quantity = match[3]
    ? Number(match[3].replace(",", "."))
    : Number(match[1]?.replace(",", ".") ?? 0) + vulgarFractions[match[2]];
  const scaled = (quantity * selectedServings) / canonicalServings;
  if (!Number.isFinite(scaled)) return ingredient;

  return `${ingredient.slice(0, prefix.length)}${new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits: 2,
      useGrouping: false,
    },
  ).format(scaled)}${ingredient.slice(prefix.length + match[0].length)}`;
};

export const collectionFiltersFromSearch = (search) => {
  const parameters = new URLSearchParams(search);
  const protein = parameters.get("protein") ?? "";
  const tags = [];
  const method = [];
  for (const value of parameters.getAll("tag")) {
    if (TAG_VALUES.has(value) && !tags.includes(value)) tags.push(value);
    if (METHOD_VALUES.has(value) && !method.includes(value)) method.push(value);
  }
  return {
    query: parameters.get("q") ?? "",
    protein: PROTEIN_VALUES.has(protein) ? protein : "",
    tags,
    method,
  };
};

export const collectionSearchParams = (filters) => {
  const parameters = new URLSearchParams();
  if (filters.query) parameters.set("q", filters.query);
  if (PROTEIN_VALUES.has(filters.protein))
    parameters.set("protein", filters.protein);
  for (const tag of new Set(filters.tags ?? []))
    if (TAG_VALUES.has(tag)) parameters.append("tag", tag);
  for (const value of new Set(filters.method ?? []))
    if (METHOD_VALUES.has(value)) parameters.append("tag", value);
  return parameters;
};
