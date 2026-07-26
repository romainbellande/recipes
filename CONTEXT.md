# Recipes

A static, open recipe collection for home cooks.

## Language

**Recipe**:
A French-language, human-readable Markdown document with YAML front matter that is the canonical source of cooking knowledge.
_Avoid_: recipe page, recipe data

**Collection**:
A curated group of Recipes published together for home cooks.
_Avoid_: catalog, dataset

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
