import tsParser from "@typescript-eslint/parser";
import noComments from "./rules/no-comments.js";

const EXTENSIONS = "{js,jsx,ts,tsx,mjs,cjs,mts,cts}";

const IGNORES = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.firebase/**",
  "**/coverage/**",
  "**/*.min.js",
  "**/*.min.cjs",
  "**/*.min.mjs",
  "**/*.bundle.js",
  "**/*.generated.*",
  "**/generated/**",
  "**/__generated__/**",
];

const plugin = {
  meta: { name: "lints", version: "0.1.0" },
  rules: { "no-comments": noComments },
};

export function noCommentsConfig({ scope } = {}) {
  const base = scope ? `${scope.replace(/^\.\//, "").replace(/\/+$/, "")}/` : "";
  return [
    { name: "lints/ignores", ignores: IGNORES },
    {
      name: "lints/no-comments",
      files: [`${base}**/*.${EXTENSIONS}`],
      languageOptions: {
        parser: tsParser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { "lints": plugin },
      rules: { "lints/no-comments": "error" },
    },
  ];
}

plugin.configs = { recommended: noCommentsConfig() };

export default plugin;
