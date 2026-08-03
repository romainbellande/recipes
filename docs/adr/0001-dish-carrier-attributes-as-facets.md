# Dish attributes are typed facets, not flat tags

Recipes previously carried every filter attribute in one flat `tags` list with two implicit groups: a course (exactly one of breakfast/main/side/dessert) and lifestyle qualifiers (weeknight, make-ahead, vegetarian, pantry, healthy). The new fish/meat (protein) and one-pot/oven (cooking method) filters don't fit those buckets, so they are modeled as dedicated, validated front-matter facets instead of ad-hoc tags.

`protein` is a single-select of fish | meat | vegetarian present on every Recipe; the `vegetarian` qualifier tag was removed from tags, its meaning now owned by the protein facet. `method` is an optional multi-select from one-pot | oven. Both are rendered in the Collection filter UI and threaded through the URL state like tags, but kept out of the flat `tags` field so their cardinality and semantics stay enforceable.

A single-select protein on an inherently mixed dish (paella has chorizo and shrimp) forces a choice reality doesn't cleanly make; we chose `meat` for it.
