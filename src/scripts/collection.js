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
