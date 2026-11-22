import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";
import { builtinRules } from "eslint/use-at-your-own-risk";
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

const TOOLING_FILES = ["**/scripts/**", "**/test/**", "**/tests/**", "**/e2e/**", "**/*.{test,spec}.*"];

const TOOLING_RULES = {
  "lints/no-console": "off",
  "lints/max-lines-per-function": "off",
};

const TS_PREFIX = "@typescript-eslint/";

const CORE_RULES = {
  eqeqeq: ["error", "always", { null: "ignore" }],
  "no-implicit-coercion": "error",
  "prefer-const": "error",
  "no-var": "error",
  "no-console": ["error", { allow: ["error", "warn"] }],
  "max-depth": ["error", 4],
  "max-params": ["error", 4],
  "max-lines-per-function": ["error", { max: 80, skipBlankLines: true, skipComments: true }],
};

const PLUGIN_RULES = {
  "cognitive-complexity": ["error", 15],
  "rules-of-hooks": "error",
  "exhaustive-deps": "error",
};

const TYPED_OVERRIDES = {
  "restrict-template-expressions": ["error", { allowNumber: true }],
  "no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
  "switch-exhaustiveness-check": ["error", { considerDefaultExhaustiveForUnions: true }],
};

function strictTypeCheckedRules() {
  const merged = Object.assign({}, ...tsPlugin.configs["flat/strict-type-checked"].map((entry) => entry.rules ?? {}));
  return Object.fromEntries(
    Object.entries(merged)
      .filter(([id]) => id.startsWith(TS_PREFIX) && id !== `${TS_PREFIX}ban-ts-comment`)
      .map(([id, setting]) => [id.slice(TS_PREFIX.length), setting]),
  );
}

const TYPED_SETTINGS = { ...strictTypeCheckedRules(), ...TYPED_OVERRIDES };

const plugin = {
  meta: { name: "lints", version: "0.5.1" },
  rules: {
    "no-comments": noComments,
    ...Object.fromEntries(Object.keys(CORE_RULES).map((id) => [id, builtinRules.get(id)])),
    "cognitive-complexity": sonarjs.rules["cognitive-complexity"],
    "rules-of-hooks": reactHooks.rules["rules-of-hooks"],
    "exhaustive-deps": reactHooks.rules["exhaustive-deps"],
    "ban-ts-comment": tsPlugin.rules["ban-ts-comment"],
    ...Object.fromEntries(Object.keys(TYPED_SETTINGS).map((id) => [id, tsPlugin.rules[id]])),
  },
};

function namespaced(settings) {
  return Object.fromEntries(Object.entries(settings).map(([id, setting]) => [`lints/${id}`, setting]));
}

const RULES = namespaced({
  "no-comments": "error",
  ...CORE_RULES,
  ...PLUGIN_RULES,
  "ban-ts-comment": [
    "error",
    { "ts-expect-error": false, "ts-ignore": true, "ts-nocheck": true, "ts-check": false },
  ],
});

const TYPED_RULES = namespaced(TYPED_SETTINGS);

export const RULE_IDS = [...new Set([...Object.keys(RULES), ...Object.keys(TYPED_RULES)])].sort();

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
    {
      name: "lints/tooling",
      files: TOOLING_FILES.map((glob) => `${scopeBase(scope)}${glob}`),
      rules: TOOLING_RULES,
    },
    ...(typed ? typedConfig({ scope, ignores: typedIgnores }) : []),
  ];
}

plugin.configs = { recommended: noCommentsConfig() };

export default plugin;
