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
