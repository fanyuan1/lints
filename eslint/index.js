import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import noComments from "./rules/no-comments.js";

const EXTENSIONS = "{js,jsx,ts,tsx,mjs,cjs,mts,cts}";
const TYPED_EXTENSIONS = "{ts,tsx,mts,cts}";

const TYPED_IGNORES = ["**/*.config.{ts,mts,cts}", "**/*.d.{ts,mts,cts}"];

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
  meta: { name: "lints", version: "0.4.1" },
  rules: {
    "no-comments": noComments,
    "ban-ts-comment": tsPlugin.rules["ban-ts-comment"],
    "no-floating-promises": tsPlugin.rules["no-floating-promises"],
  },
};

const RULES = {
  "lints/no-comments": "error",
  "lints/ban-ts-comment": [
    "error",
    { "ts-expect-error": false, "ts-ignore": true, "ts-nocheck": true, "ts-check": false },
  ],
};

const TYPED_RULES = {
  "lints/no-floating-promises": "error",
};

function scopeBase(scope) {
  return scope ? `${scope.replace(/^\.\//, "").replace(/\/+$/, "")}/` : "";
}

export function typedConfig({ scope, ignores = [] } = {}) {
  return [
    {
      name: "lints/typed",
      files: [`${scopeBase(scope)}**/*.${TYPED_EXTENSIONS}`],
      ignores: [...TYPED_IGNORES, ...ignores],
      languageOptions: {
        parser: tsParser,
        parserOptions: { projectService: true, tsconfigRootDir: process.cwd() },
      },
      plugins: { lints: plugin },
      rules: TYPED_RULES,
    },
  ];
}

export function noCommentsConfig({ scope, typed = true, typedIgnores = [] } = {}) {
  return [
    { name: "lints/ignores", ignores: IGNORES },
    { name: "lints/directives", linterOptions: { reportUnusedDisableDirectives: "error" } },
    {
      name: "lints/rules",
      files: [`${scopeBase(scope)}**/*.${EXTENSIONS}`],
      languageOptions: {
        parser: tsParser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { lints: plugin },
      rules: RULES,
    },
    ...(typed ? typedConfig({ scope, ignores: typedIgnores }) : []),
  ];
}

plugin.configs = { recommended: noCommentsConfig() };

export default plugin;
