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
