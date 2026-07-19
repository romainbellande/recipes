import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default [
  { ignores: ["dist/", ".astro/", "node_modules/"] },
  js.configs.recommended,
  {
    files: ["**/*.{cjs,js,mjs}"],
    languageOptions: { globals: globals.node },
  },
  ...astro.configs["flat/recommended"],
];
