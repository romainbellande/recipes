---
name: mise-en-place
description: "Revise a Recipe so prep is mise en place: one dedicated step that readies every ingredient before the first cook step. Use when reducing a Recipe, adding to a Recipe, or asked to optimize/prepare a Recipe efficiently."
---

# Mise en place

Mise en place is **everything ready before anything cooks**: every chop, mince, measure, portion, and mise-out done in the prep step, so each cook step is pure execution. The test of the skill: an ingredient is never _prepared-and-cooked in the same step_.

1. **Audit the current split.** Read the Recipe's ingredient list and preparation steps. Mark every ingredient that must be transformed before cooking (chopped, minced, diced, measured, drained, divided, prepped into stock) and note the step where that transformation currently happens.
   - Done when you have a complete prep ledger: every non-whole ingredient accounted for, with its current step.

2. **Draft the prep step.** Write or revise the first preparation step ("Préparez les ingrédients :") to perform **all** mise en place up front: stock prepared, aromatics minced, vegetables diced to the stated size, proteins dried/portioned, finishing garnish chopped, liquids and spices measured. Add a prep step when the Recipe starts directly on the heat.
   - Done when every transformation from the step-1 ledger appears in the prep step and no cook step still contains a chopping/measuring action.

3. **Strip the cook steps.** Remove each now-relocated action from its later step, leaving that step to reference the ready item ("Ajoutez les courgettes en dés" instead of re-dicing them). Keep seasoning and gauges in the cook steps where they belong — mise en place is readiness, not doing the cook's thinking for it.
   - Done when no cook step performs a transformation that belongs in prep, and every cook step still reads correctly on its own.

4. **Sync the timers and front matter.** Adjust `prep_time` if the prep step's work is comparable, and add or update a Timer for the prep step when the Recipe uses Timers. Reconcile `prep_time` + `cook_time` if slicing is more favourable than the flow-simulated values.
   - Done when `prep_time` and the prep-step Timer (if any) both cover the full mise en place, and `cook_time` still matches the actual cooking steps.

5. **Re-read the Recipe.** Verify the later steps still make culinary sense with the prep happening up front, and that an ingredient moved to prep is not double-stated as a re-prep in a cook step.
   - Done when the Recipe flows as mise en place end to end and no step self-contradicts.

Lazy rule: this is a re-ordering pass, not a rewrite. Do not change ingredient amounts, cook times, or method — only _where_ each transformation happens.

`ponytail:` the precondition is behavioural, not a hard build check — compliance is verified by re-reading the Recipe, so run `bun run validate` only if you also edited front matter.
