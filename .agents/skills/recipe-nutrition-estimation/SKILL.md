---
name: recipe-nutrition-estimation
description: Auditable nutrition estimates for Recipes. Use when the user asks to calculate, estimate, correct, or add nutrition values.
---

# Auditable nutrition estimates

Make every published number auditable from a weighed ingredient, an edible state, and a cited food record. Use the `usda_fooddata_central_get_ingredient_nutrition` MCP tool as the default source; it selects a USDA Foundation or SR Legacy record and returns nutrients per 100 g edible portion.

1. Establish the representation before calculating. Read the complete Recipe, `servings`, nutrition schema, every nutrition consumer, and collection/domain guidance. Record whether metadata is per 100 g or per Serving, its rounding, and `weight_g` semantics. Track: ingredient as written; purchased grams where relevant; edible grams; preparation/state; food-record ID and URL; and assumption.
   - Done when every ingredient, stock, condiment, cooking fat, water, and salt source has documented values or an explicit negligible rationale.
2. Choose records and quantities. Prefer: supplied exact product label; matching USDA FoodData Central edible form via `usda_fooddata_central_get_ingredient_nutrition`; retailer label; another official composition database. Record the returned FDC ID and URL. Match raw/cooked, drained, sweetened, and fat-level states. Use a raw record for a raw weighed ingredient unless a stated cooking yield supports a cooked record. For bone-in or shelled food, record purchased, inedible, and edible grams separately. Convert counts, spoons, packets, pots, fillets, and sachets from a named package or labelled standard assumption. Resolve a material ambiguous quantity with the user; otherwise state the literal or standard interpretation.
   - Done when another agent can select the same record and grams without guessing.
3. Complete numeric coverage. Treat a missing USDA value as unknown, not zero. For every required field lacking a usable number, cite a compatible numeric source for that field and retain the original limitation. Keep an unquantified “selon le goût” salt addition separate from naturally occurring salt; include it only when a mass is supplied or assumed explicitly.
   - Done when every published nutrient is traceable to documented numeric values, including any per-field substitution.
4. Calculate unrounded totals: `grams × value_per_100_g ÷ 100`. Use recorded energy where available; otherwise derive kJ from kcal with `kcal × 4.184`. Use salt directly, or convert sodium with `sodium × 2.5` only when salt is absent. Count retained water as nutrient-free. Apply draining, discarded fat, and evaporation only when the Recipe states them.
   - Done when totals, per-Serving values, and required per-100-g values reconcile to the same unrounded calculation.
5. Estimate finished yield from retained edible inputs plus retained water, minus stated losses; exclude inedible bones, shells, and packaging. Round only for publication—whole kcal/kJ and the Collection’s existing precision. Update only the Recipe’s existing nutrition metadata. Report a compact audit table (source, grams, contribution), every assumption, and uncertainty; call it a nutrition estimate. Run the repository validator and relevant checks.
   - Done when `per 100 g × finished_weight_g / 100` and `per Serving × servings` reproduce each unrounded total within rounding, and front matter validates.

Document reusable assumptions in the recipe change: standard edible weights for counts or packages when no label is supplied, ingredient state, retained water, and whether optional or discretionary ingredients are excluded. Explicitly label small herbs, spices, or seasonings as negligible when omitted; never silently omit a quantified or material ingredient. Preserve naturally occurring sodium from stocks, sauces, cheeses, cured foods, and canned foods even when discretionary salt is excluded. Use `https://fdc.nal.usda.gov/food-details/<FDC_ID>/nutrients` for USDA record links.
