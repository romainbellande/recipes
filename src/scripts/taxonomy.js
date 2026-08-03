// Single source of truth for the controlled Recipe attributes and their
// French filter labels. Used by the Collection/Recipe pages and the
// collection validator so the taxonomy never forks between them.
//
// Tags carry two implicit groups historically (a course and lifestyle
// qualifiers); Protein and Method are dedicated facets and do not mix into
// tags. See docs/adr/0001.

export const COURSES = {
  breakfast: "Petit-déjeuner",
  main: "Plat principal",
  side: "Accompagnement",
  dessert: "Dessert",
};

export const QUALIFIERS = {
  weeknight: "Rapide en semaine",
  "make-ahead": "À préparer à l'avance",
  pantry: "Du placard",
  healthy: "Équilibré",
};

export const PROTEINS = {
  fish: "Poisson",
  meat: "Viande",
  vegetarian: "Végétarien",
};

export const METHODS = {
  "one-pot": "Une seule casserole",
  oven: "Au four",
};

// Recognized values for the shared ?tag= URL channel: the course and
// lifestyle qualifiers. Method values share that channel at the URL level
// (see appending/reading below) but are distinguished here by METHOD_VALUES.
export const TAG_VALUES = new Set([
  ...Object.keys(COURSES),
  ...Object.keys(QUALIFIERS),
]);

export const METHOD_VALUES = new Set(Object.keys(METHODS));

export const PROTEIN_VALUES = new Set(Object.keys(PROTEINS));
