import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import rule from "../eslint/rules/no-comments.js";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const error = { messageId: "noComment" };

ruleTester.run("no-comments", rule, {
  valid: [
    "const a = 1;",
    "const url = 'http://example.com // not a comment';",
    "const s = `/* not a comment */`;",
    "/* eslint-disable no-console */\nconsole.log(1);",
    "/* eslint-enable */",
    "console.log(1); // eslint-disable-line no-console",
    "// eslint-disable-next-line no-console\nconsole.log(1);",
    "/* eslint no-console: off */",
    "/* global window */",
    "/* globals window, document */",
    "/* exported foo */",
    "// @ts-expect-error wrong type\nconst a: number = 'x';",
    "// @ts-ignore\nconst a: number = 'x';",
    "// @ts-nocheck\nconst a = 1;",
    "// @ts-check\nconst a = 1;",
    '/// <reference types="node" />\nconst a = 1;',
    '/// <reference path="./globals.d.ts" />',
    "#!/usr/bin/env node\nconsole.log(1);",
    "/*!\n * Copyright 2024 Acme Inc.\n */\nconst a = 1;",
    "/**\n * @license MIT\n */\nconst a = 1;",
    "// Copyright (c) 2024 Acme\n// Licensed under the Apache License, Version 2.0\nconst a = 1;",
    "// SPDX-License-Identifier: MIT\nconst a = 1;",
    "#!/usr/bin/env node\n// Copyright 2024 Acme\nconsole.log(1);",
    "\n\n/* Copyright 2024 Acme */\nconst a = 1;",
    "const el = <div className=\"a\">text</div>;",
  ],
  invalid: [
    { code: "// add one\nconst a = 1;", errors: [error] },
    { code: "const a = 1; // trailing", errors: [error] },
    { code: "/* block */\nconst a = 1;", errors: [error] },
    { code: "/**\n * JSDoc for f\n */\nfunction f() {}", errors: [error] },
    { code: "// TODO: fix this hack\nconst a = 1;", errors: [error] },
    { code: "const a = 1;\n// Copyright 2024 Acme", errors: [error] },
    { code: "const a = 1;\n/* @license MIT */", errors: [error] },
    {
      code: "// Copyright 2024 Acme\nconst a = 1;\n// stray",
      errors: [{ ...error, line: 3 }],
    },
    { code: "// first\n// second\nconst a = 1;", errors: [error, error] },
    { code: "const el = <div>{/* hidden */}</div>;", errors: [error] },
    { code: "type A = string; // alias", errors: [error] },
    { code: "interface A {\n  // field\n  b: string;\n}", errors: [error] },
    { code: "// ts-ignore without at sign\nconst a = 1;", errors: [error] },
    { code: "// eslintrc mention\nconst a = 1;", errors: [error] },
    { code: "// global state is bad\nconst a = 1;", errors: [error] },
    { code: "#!/usr/bin/env node\n// run it\nconsole.log(1);", errors: [error] },
  ],
});
