---
name: recipe-authoring
description: "Recipe authoring for creating or revising a Recipe: use when the user requests Recipe ingredients, preparation, timers, or nutrition."
---

# Recipe authoring

Use a **sequence**: every timed cooking action becomes an explicit Timer definition.

1. **Grill the brief.** Load and follow the `grilling` and `domain-modeling` skills. Inspect `CONTEXT.md` and existing Recipes for facts before asking. Ask one decision at a time and wait for the answer. Resolve title, Servings, ingredients, flavour, method, constraints, and desired texture; summarize the agreed Recipe and get confirmation before editing.
   - Done when the user has confirmed a Recipe brief. Update `CONTEXT.md` only when a durable domain term is resolved; create an ADR only for a hard-to-reverse, surprising trade-off.

2. **Draft the Recipe.** Inspect `src/content.config.ts`, `scripts/validate-recipes.mjs`, and a comparable Recipe. Use the established French Markdown structure, lowercase-kebab-case Recipe ID, controlled tags, weighed ingredients, and numbered preparation steps.
   - Done when each ingredient is used by the method and every stated cook time has a corresponding step.

3. **Map the sequence to Timers.** For every explicit duration or duration range in a preparation step, add a front-matter Timer definition with that 1-based `step`, an actionable French title, and a valid fixed duration. A range uses its upper bound. Split consecutive timed actions into separate Timer definitions even when they share the same step: `faites revenir les oignons 5 min, puis torréfiez les aromates 1 min` requires two Timers. Timed additions inside a longer cook also receive their own Timer.
   - Done when every explicit timed action is represented once, no Timer exceeds the number of preparation steps, and every Timer duration matches the validator format.

4. **Mise en place.** Load and follow the `mise-en-place` skill: revise the Recipe so prep is a dedicated step that readies every ingredient before the first cook step. Apply this whenever reducing, adding to, or optimizing the Recipe.
   - Done when there is one dedicated prep step and every ingredient is readied before the first cook step.

5. **Estimate nutrition.** Load and follow `recipe-nutrition-estimation`. Treat the Recipe's required `nutrition` front matter as a nutrition-estimation request: use USDA FoodData Central records, record assumptions and edible weights, reconcile the finished yield, and publish the Collection's per-100-g values.
   - Done when every published nutrition field is auditable and reconciles to `weight_g`.

6. **Verify.** Run `bun run validate`, `bun run test`, and `bun run check`. Report the Recipe path, checks run, and the nutrition estimate with its assumptions.
   - Done when all three commands pass.

7. **Check all steps** to add missing timers if any.
