export const normalizeText = (value) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export const matchingRecipeIndices = (recipes, query, selectedTags) => {
  const normalizedQuery = normalizeText(query);
  return recipes
    .map((recipe, index) => ({ recipe, index }))
    .filter(
      ({ recipe }) =>
        (!normalizedQuery ||
          normalizeText(
            [recipe.title, recipe.summary, ...recipe.ingredients].join(" "),
          ).includes(normalizedQuery)) &&
        selectedTags.every((tag) => recipe.tags.includes(tag)),
    )
    .map(({ index }) => index);
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

export const scaleIngredient = (
  ingredient,
  canonicalServings,
  selectedServings,
) => {
  const match = ingredient.match(
    /^(?:(\d+(?:[.,]\d+)?)?([¼½¾⅓⅔⅛⅜⅝⅞])|(\d+(?:[.,]\d+)?))/,
  );
  if (!match) return ingredient;

  const quantity = match[3]
    ? Number(match[3].replace(",", "."))
    : Number(match[1]?.replace(",", ".") ?? 0) + vulgarFractions[match[2]];
  const scaled = (quantity * selectedServings) / canonicalServings;
  if (!Number.isFinite(scaled)) return ingredient;

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(scaled)}${ingredient.slice(match[0].length)}`;
};

export const collectionFiltersFromSearch = (search, controlledTags) => {
  const parameters = new URLSearchParams(search);
  const recognizedTags = new Set(controlledTags);
  return {
    query: parameters.get("q") ?? "",
    selectedTags: [
      ...new Set(
        parameters.getAll("tag").filter((tag) => recognizedTags.has(tag)),
      ),
    ],
  };
};

export const collectionSearchParams = (query, selectedTags, controlledTags) => {
  const parameters = new URLSearchParams();
  if (query) parameters.set("q", query);
  const recognizedTags = new Set(controlledTags);
  for (const tag of new Set(selectedTags))
    if (recognizedTags.has(tag)) parameters.append("tag", tag);
  return parameters;
};
