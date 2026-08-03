# Recipes

A static, open recipe collection for home cooks.

## Language

**Ingredient search**:
A Collection search for Recipes by their ingredient lists.
_Avoid_: full-text search, recipe-content search

**Matched ingredient**:
An ingredient list entry shown on a Recipe card to explain an Ingredient search result.
_Avoid_: search hit, highlighted query

**Recipe**:
A French-language, human-readable Markdown document with YAML front matter that is the canonical source of cooking knowledge.
_Avoid_: recipe page, recipe data

**Collection**:
A curated group of Recipes published together for home cooks.
_Avoid_: catalog, dataset

**Installed Collection**:
The Collection installed through a supporting browser as a standalone, online-first web application. It does not retain Recipes for offline use.
_Avoid_: native app, offline app, PWA

**Servings**:
The number of people for whom a Recipe's ingredient quantities are calculated.
_Avoid_: portions, people count

**Scaled ingredient quantity**:
An ingredient quantity recalculated from a Recipe's Servings for a chosen number of Servings.
_Avoid_: adjusted ingredient, converted amount

**Recipe ID**:
The canonical identifier derived from a Recipe filename and used in its URL.

**Recipe alias**:
A former published Recipe ID in that Recipe's front matter; its legacy URL redirects to
its canonical Recipe URL.

**Recipe share link**:
The canonical Recipe URL copied for sharing; it identifies the Recipe by its Recipe ID and excludes Collection state.
_Avoid_: deep link, filtered URL

**Recipe icon**:
An AI-generated SVG, committed as a repository-local asset and referenced by the Recipe's front matter, that serves as the Recipe's visual identity in both the Collection and the Recipe view. It is always shown; there is no photo field.
_Avoid_: title icon, emoji title, image, photo

**Healthy tag**:
A controlled Recipe qualifier for a balanced, plant-rich meal with a protein source. It is editorial guidance, not a medical or nutritional claim.
_Avoid_: health claim, diet label

**Protein**:
A singleton facet describing the main protein source of a Recipe, with exactly one of three values: `fish`, `meat`, or `vegetarian`. It is a filterable attribute, not a nutritional claim.
_Avoid_: protein type, meat/fish category, main ingredient

**Method**:
An optional, repeatable facet describing how a Recipe is prepared, choosing independently from `one-pot` and `oven`. A Recipe carries a Method value only when the description genuinely applies; it is absent otherwise.
_Avoid_: cooking method, preparation type, technique

**Nutrition estimate**:
An AI-generated, Recipe-specific approximation stored with a Recipe and expressed per Serving and per 100 g. It is not a medical or nutritional claim.
_Avoid_: nutrition facts, nutritional claim

**Shopping List**:
A Recipe-scoped checklist of the ingredients needed to make that Recipe.
_Avoid_: basket, cart

**Acquired ingredient**:
An ingredient marked as obtained on a Shopping List.
_Avoid_: completed ingredient, used ingredient

**Timer**:
A manually started countdown associated with a Recipe preparation step and shown in cooking mode. Multiple active Timers may run concurrently, finish with an alarm and visual notice, and are discarded when cooking mode is exited.
_Avoid_: duration, alarm

**Timer definition**:
Recipe front-matter metadata that associates a 1-based preparation step with a Timer title and default duration.
_Avoid_: timer marker, countdown tag

**Timer run**:
An independently active instance created when a cook starts a Timer definition; any number of runs of the same definition may overlap.
_Avoid_: timer instance, timer copy

**Inline Recipe markup**:
Markdown bold, italic, and combined emphasis in Recipe body ingredients and preparation steps that remains formatted in every Recipe view.
_Avoid_: plain text, display markup

**Recipe print export**:
A browser print flow, started from a Recipe-view button, for a Recipe using the cook’s selected Servings and Scaled ingredient quantities; the cook may save the rendered Recipe as a PDF.
_Avoid_: PDF download, generated PDF

**Printable Recipe**:
The title, summary, selected Servings, ingredients, and preparation steps from a Recipe, without Collection navigation or interactive controls.
_Avoid_: page printout, full-page export
