# lints

Shared lint rules that steer coding agents. This repo holds every rule a project or its CI runs: the ESLint plugin, and checks for other languages. It is public, so any build server can install it. Agent skills and instructions live elsewhere.

## Rule: `lints/no-comments`

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

`npx eslint . --suppress-rule lints/no-comments` writes `eslint-suppressions.json`. Existing comments pass. New comments fail. After you remove comments, run `npx eslint . --prune-suppressions` so the baseline shrinks.

## Other languages

- **Godot**: `scripts/gdscript_no_comments.py` is the same rule for GDScript, with a baseline in `gdscript-suppressions.json`. Projects call it from a clone at `~/projects/lints`. See `godot/README.md`.
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
