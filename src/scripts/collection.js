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

export const nextSelection = (matches, selected) =>
  matches.includes(selected) ? selected : matches[0];

export const resetCollection = (search, filters) => {
  search.value = "";
  filters.forEach((filter) => {
    filter.checked = false;
  });
};

export const scaleIngredient = (
  ingredient,
  canonicalServings,
  selectedServings,
) => {
  const match = ingredient.match(/^(\d+(?:[.,]\d+)?)/);
  if (!match) return ingredient;

  const quantity = Number(match[1].replace(",", "."));
  const scaled = (quantity * selectedServings) / canonicalServings;
  if (!Number.isFinite(scaled)) return ingredient;

  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(scaled);
  return `${formatted}${ingredient.slice(match[1].length)}`;
};
