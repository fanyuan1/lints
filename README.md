# lints

Shared ESLint rules that steer coding agents. Public, so any build server can install it. Skills and agent instructions live in the private `dev-kit` repo.

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

## Update

```bash
npm update lints
```

## Develop

```bash
npm install
npm run check
```
