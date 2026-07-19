# Research: static Recipe route and Collection state

## Summary

Use one prerendered dynamic Astro page, `src/pages/recipe/[id].astro`, generated from `getCollection("recipes")`. It creates a stable dedicated URL for every current content filename (`/recipes/recipe/apple-crumble/`, etc.) without adding a server adapter or a routing layer. Preserve Collection state in the query string as `?q=<search>&tag=<tag>&tag=<tag>`; because this site is static, parse and apply it in the existing browser script, not with `Astro.url.searchParams` during page generation.

## Findings

1. **A single dynamic page is the smallest static route.** Astro is file-routed: a `src/pages/recipe/[id].astro` page defines an `id` parameter, and in default static output it must export `getStaticPaths()` with every generated `params.id`. `getStaticPaths()` can also provide the full recipe as `props`, avoiding a second lookup in the page. The project already loads all recipe content using `getCollection("recipes")`; its `glob` loader is restricted to `src/content/recipes/*.md`, whose current filename-derived IDs are lowercase hyphenated names (for example `apple-crumble`, `chickpea-salad`). Reuse `recipe.id` as the initial public identifier rather than adding a `slug` field or dependency. [Astro Routing](https://docs.astro.build/en/guides/routing/) [Astro Routing reference](https://docs.astro.build/en/reference/routing-reference/)

2. **Do not use SSR, redirects, rewrites, or a route per source file.** The project has default static Astro configuration and deploys under `base: "/recipes"`. Astro prerenders routes by default, and static dynamic paths are exactly what `getStaticPaths()` is for. A per-recipe `.astro` file duplicates templates; `prerender = false` requires on-demand infrastructure; a rewrite/redirect does not make dedicated recipe HTML. Astro documents that ordinary `<a>` links must include a configured base path, so route construction should use the configured base (for example `import.meta.env.BASE_URL`) rather than hardcoding an origin or omitting `/recipes/`. [Project `astro.config.mjs`](../../../../../../../../home/naimor/.pi/agent/AGENTS.md) (local inspection; configured `site` and `base`) [Astro Routing: navigation with `base`](https://docs.astro.build/en/guides/routing/) [Astro Routing reference: prerender and static paths](https://docs.astro.build/en/reference/routing-reference/)

3. **Query state must be applied on the client in this static site.** Astro’s render context says prerendered URLs are based on `site` and `base` at build time; the request query belongs to the browser navigation, not to one of the built HTML variants. Consequently, static Collection initialization should read `window.location.search`, set the existing `#recipe-search` input and existing `[data-tag-filter]` checkboxes, then call the existing `updateCollection()`. Do not create static pages for query permutations or use `Astro.url.searchParams` to select server-rendered content. [Astro render context: `Astro.url`](https://docs.astro.build/en/reference/api-reference/) [Astro Routing: static mode](https://docs.astro.build/en/guides/routing/)

4. **Use one scalar query and repeated tag keys.** Canonical state format: `q` is at most one search string; every selected filter is an individual `tag` value, e.g. `/recipes/?q=lemon&tag=main&tag=weeknight`. Native `URLSearchParams.get("q")` and `getAll("tag")` retain that distinction; `getAll()` returns an array (or empty array) for repeated names. On restore, accept only tags present in the rendered filter set (silently discard unknown/duplicate tag values), and set the query string directly as the input value—the existing matching code normalizes text. This prevents invalid old/shared URLs from checking nonexistent filters while retaining spaces, accents, and URL encoding correctly. [MDN: `URLSearchParams.getAll()`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/getAll) [Project `src/scripts/collection.js`](../../../../../../../../tmp/recipes-research-static-recipe-route/src/scripts/collection.js) (local inspection)

5. **Carry only the supported state across the two pages.** On a Collection result, build the dedicated recipe link from the selected recipe id plus a freshly constructed `URLSearchParams` containing non-empty `q` and selected valid `tag` values. On the recipe page, its “Back to Collection” link copies only those same allowed keys from `window.location.search` to `${import.meta.env.BASE_URL}`. This supports deep links, reload, browser sharing, and back navigation, and deliberately does not serialize selected recipe, servings, cook-mode step, or ingredient checkmarks—those are not Collection search/filter state. Use an actual `<a>` for these navigations, as Astro recommends standard HTML anchors. [Astro Routing: navigating between pages](https://docs.astro.build/en/guides/routing/) [Issue #34](https://github.com/romainbellande/recipes/issues/34)

## Recommended minimal shape

- Add exactly one template: `src/pages/recipe/[id].astro`.
  - `getStaticPaths()` calls `getCollection("recipes")`, returns `{ params: { id: recipe.id }, props: { recipe } }` for each entry.
  - Render the recipe’s existing details from the passed entry and a normal Collection backlink. No adapter, SSR, redirect, client router, or slug migration.
- In the existing Collection client script:
  - Before its initial `updateCollection()`, read `new URLSearchParams(window.location.search)`; assign `q` and check valid `tag` values; call `updateCollection()` once.
  - When creating/navigating a recipe link, serialize the current `q`/`tag` state using `URLSearchParams`; omit empty `q`.
- In the recipe-page client script, derive its backlink from the same whitelisted `q` and repeated `tag` parameters. This tiny client-side step is required because the static HTML cannot know a visitor’s query string at build time.
- Treat filename IDs as stable public URLs for now. Renaming a content file changes its URL; do not add legacy redirects until URLs are published or the product requires rename durability.

Example contract (not an implementation commitment):

```text
Collection: /recipes/?q=lemon&tag=main&tag=weeknight
Recipe:     /recipes/recipe/lemony-chicken/?q=lemon&tag=main&tag=weeknight
Back:       /recipes/?q=lemon&tag=main&tag=weeknight
```

## Sources

- Kept: [Astro Routing](https://docs.astro.build/en/guides/routing/) — primary documentation for file routes, SSG `getStaticPaths()`, anchors, route precedence, and base-aware links.
- Kept: [Astro Routing reference](https://docs.astro.build/en/reference/routing-reference/) — primary reference for prerender defaults, `getStaticPaths()` params, and props.
- Kept: [Astro render context](https://docs.astro.build/en/reference/api-reference/) — primary documentation for build-time `Astro.url` behavior.
- Kept: [MDN `URLSearchParams.getAll()`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/getAll) — standards-backed browser API behavior for repeated `tag` keys.
- Kept: [Issue #34](https://github.com/romainbellande/recipes/issues/34) — exact question and scope.
- Kept: local `astro.config.mjs`, `src/content.config.ts`, `src/pages/index.astro`, and `src/scripts/collection.js` — establish static deployment, existing recipe IDs/data, and current filter behavior.
- Dropped: generic Astro/blog routing tutorials — redundant with official Astro documentation.

## Gaps / remaining product decisions

1. **Public URL contract:** approve `recipe/<content-id>/` versus a shorter `/<content-id>/`; the former avoids collision with the Collection root and leaves route space, but is one segment longer.
2. **Identifier longevity:** filename IDs are sufficient now, but decide whether published recipe URL renames need permanent redirects. If yes, add a stable explicit slug/legacy-ID policy when that need exists.
3. **State synchronization policy:** this recommendation restores state and carries it when navigating to/from a recipe. Decide separately whether typing/changing filters should also call `history.replaceState()` so the Collection URL updates live; it is not necessary to satisfy restoration and adds history/URL behavior to test.
4. **No-JavaScript expectation:** dedicated recipe pages can be fully static and readable without JS. A shared Collection URL will only restore filtering after JS runs; server-rendered query filtering is incompatible with the current static-only deployment unless an adapter/SSR is intentionally introduced.

## Acceptance evidence

- **Changed file:** this research artifact only; no application code or tracker issue was modified.
- **Research validation:** inspected current route/config/content/client-filter files and corroborated the route/query recommendation with Astro primary docs and MDN API documentation.
- **Tests:** none added or run; task is explicitly research-only.
