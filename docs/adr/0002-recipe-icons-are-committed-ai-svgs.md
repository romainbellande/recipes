# Recipe icons are AI-generated committed SVGs, photoless

Recipe iconography was a single emoji shown as a placeholder, with an optional `image` photo that would win over it. We replaced every Recipe icon with an AI-generated SVG and dropped the `image` field entirely.

Calling a live model during a static build would be non-deterministic and network-dependent, so the SVGs are generated once and committed under `public/icons/recipes/<id>.svg`, referenced by a repository-local `icon` path. Because a recipe's visual identity is now always its AI SVG, the separate photo `image` field was removed — there is no photo path left. `icon`'s front-matter validation changed from a single emoji to a repository-local path.
