# lints

Shared lint rules that steer coding agents. This repo holds every rule a project or its CI runs: the ESLint plugin, and checks for other languages. It is public, so any build server can install it. Agent skills and instructions live elsewhere.

## Rules

Every rule is exposed under the `lints/` prefix, so a project's own config cannot collide with it, and one baseline covers them all. `RULE_IDS` (exported) lists them.

| Rule | What it catches | Files |
|---|---|---|
| `lints/no-comments` | Every code comment, except directives, license headers and shebangs | JS and TS |
| `lints/ban-ts-comment` | `@ts-ignore` and `@ts-nocheck`. `@ts-expect-error` is allowed. | JS and TS |
| `lints/eqeqeq` | `==` and `!=`, except `== null` | JS and TS |
| `lints/no-implicit-coercion`, `lints/prefer-const`, `lints/no-var` | `!!x` and `+x`, a `let` never reassigned, `var` | JS and TS |
| `lints/no-console` | `console.log` and friends. `console.error` and `console.warn` are allowed. | JS and TS, except tooling files |
| `lints/max-depth` (4), `lints/max-params` (4), `lints/max-lines-per-function` (80) | Functions too big to read | JS and TS. The line limit skips tooling files. |
| `lints/cognitive-complexity` (15) | Functions too tangled to read (SonarJS) | JS and TS |
| `lints/rules-of-hooks`, `lints/exhaustive-deps` | React hook misuse | JS and TS |
| typescript-eslint `strict-type-checked`, as `lints/<rule>` | Floating and misused promises, `any` leaking, needless conditions, non-null assertions, and more | TS in a tsconfig |
| `lints/switch-exhaustiveness-check` | A `switch` on a union that misses a member | TS in a tsconfig |
| unused `eslint-disable` | A disable line that no longer suppresses anything (reported as an error) | all |

Tooling files are `scripts/`, `test/`, `tests/`, `e2e/`, and `*.test.*` or `*.spec.*` files.

Two strict rules are relaxed: `restrict-template-expressions` allows numbers, and `no-confusing-void-expression` allows arrow shorthand.

Typed rules run only on TypeScript files that a `tsconfig.json` includes. They skip `*.config.ts` and `.d.ts` files. Skip other files no tsconfig covers with `noCommentsConfig({ typedIgnores: ["test/**"] })`, or turn typed rules off with `typed: false`.

## Shared tsconfig

```json
{ "extends": "lints/tsconfig.json" }
```

It turns on `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `noImplicitOverride`. These are compiler errors, so they have no baseline. Fix the code.

## Unused code

ESLint lints one file at a time, so it cannot see unused files, exports or dependencies. Projects run [Knip](https://knip.dev) for that, as `knip` in the `check` script.

## `lints/no-comments` in detail

Reports every code comment. Comments hide workarounds that agents copy, and they go stale. Code explains itself through names and types. Non-obvious decisions go in `docs/decisions/` as ADRs.

Allowed:

- ESLint directives (`/* eslint-disable ... */`, `// eslint-disable-next-line`, `/* global ... */`)
- TypeScript directives (`// @ts-expect-error`, `// @ts-ignore`, `// @ts-nocheck`, `/// <reference ... />`)
- A license or copyright header at the very top of a file
- Shebang lines

Checks `.js .jsx .ts .tsx .mjs .cjs .mts .cts`. Skips `node_modules`, `dist`, `build`, `.firebase`, `coverage`, and minified or generated files.

## Install

```bash
npm i -D github:fanyuan1/lints eslint
```

```js
import lints from "lints";

export default lints.configs.recommended;
```

In an existing flat config, put `...lints.configs.recommended` at the end of the array. To lint one folder only, use `noCommentsConfig({ scope: "src" })` from `lints`.

## The ratchet

`npx lints-baseline` writes `eslint-suppressions.json` for every lints rule. The project's own rules stay visible. Existing violations pass. New ones fail. After you remove comments, run `npx eslint . --prune-suppressions` so the baseline shrinks.

## Other languages

- **Godot**: `scripts/gdscript_no_comments.py` is the same rule for GDScript, with a baseline in `gdscript-suppressions.json`. Projects download it at a pinned commit; no clone needed. See `godot/README.md`.
- **Dart / Flutter**: planned. See `dart/README.md`.

## Add a rule

1. Add `eslint/rules/<name>.js` and `test/<name>.test.js` (ESLint `RuleTester`, bad and good cases).
2. Add it to `plugin.rules` and to `RULES` in `eslint/index.js`. Every config gets it.
3. Run `npm run check`. Code in this repo has no comments either.

## Update

```bash
npm update lints
```

## Develop

```bash
npm install
npm run check
```
