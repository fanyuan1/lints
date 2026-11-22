import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { noCommentsConfig } from "../eslint/index.js";

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "typed");

async function ruleIdsFor(fileName, code) {
  const cwd = process.cwd();
  process.chdir(fixtureDir);
  try {
    const eslint = new ESLint({ cwd: fixtureDir, overrideConfigFile: true, overrideConfig: noCommentsConfig() });
    const filePath = path.join(fixtureDir, fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, code);
    try {
      const [result] = await eslint.lintFiles([filePath]);
      return result.messages.map((message) => message.ruleId ?? message.message);
    } finally {
      fs.rmSync(filePath);
    }
  } finally {
    process.chdir(cwd);
  }
}

describe("recommended config", () => {
  it("reports a floating promise in TypeScript", async () => {
    const ids = await ruleIdsFor("floating.ts", "function load(): Promise<number> { return Promise.resolve(1); }\nload();\n");
    assert.deepEqual(ids, ["lints/no-floating-promises"]);
  });

  it("allows an awaited or voided promise", async () => {
    const ids = await ruleIdsFor(
      "handled.ts",
      "function load(): Promise<number> { return Promise.resolve(1); }\nexport async function run(): Promise<void> { await load(); void load(); }\n",
    );
    assert.deepEqual(ids, []);
  });

  it("bans @ts-ignore and @ts-nocheck", async () => {
    assert.deepEqual(await ruleIdsFor("ignore.ts", "// @ts-ignore\nexport const a: number = 1;\n"), ["lints/ban-ts-comment"]);
    assert.deepEqual(await ruleIdsFor("nocheck.ts", "// @ts-nocheck\nexport const a = 1;\n"), ["lints/ban-ts-comment"]);
  });

  it("allows @ts-expect-error", async () => {
    const ids = await ruleIdsFor("expect.ts", "// @ts-expect-error\nexport const a: number = 'x';\n");
    assert.deepEqual(ids, []);
  });

  it("reports an unused disable directive", async () => {
    const ids = await ruleIdsFor("unused.ts", "// eslint-disable-next-line no-console\nexport const a = 1;\n");
    assert.equal(ids.length, 1);
    assert.match(ids[0], /Unused eslint-disable directive/);
  });

  it("skips typed rules on config and declaration files", async () => {
    assert.deepEqual(await ruleIdsFor("vite.config.ts", "export default {};\n"), []);
    assert.deepEqual(await ruleIdsFor("globals.d.ts", "declare const a: number;\n"), []);
  });

  it("does not run typed rules on JavaScript", async () => {
    const ids = await ruleIdsFor("plain.js", "async function load() { return 1; }\nload();\n");
    assert.deepEqual(ids, []);
  });

  it("reports loose equality but allows == null", async () => {
    assert.deepEqual(await ruleIdsFor("loose.js", "export const f = (a, b) => a == b;\n"), ["lints/eqeqeq"]);
    assert.deepEqual(await ruleIdsFor("nullish.js", "export const f = (a) => a == null;\n"), []);
  });

  it("reports console.log in app code but not in scripts or tests", async () => {
    assert.deepEqual(await ruleIdsFor("app.js", "console.log(1);\nconsole.error(2);\n"), ["lints/no-console"]);
    assert.deepEqual(await ruleIdsFor("scripts/build.js", "console.log(1);\n"), []);
    assert.deepEqual(await ruleIdsFor("app.test.js", "console.log(1);\n"), []);
  });

  it("reports too many parameters", async () => {
    const ids = await ruleIdsFor("params.js", "export function f(a, b, c, d, e) { return a + b + c + d + e; }\n");
    assert.deepEqual(ids, ["lints/max-params"]);
  });

  it("reports a conditional hook call", async () => {
    const ids = await ruleIdsFor("hook.js", "export function useA(x) { if (x) { useState(); } }\n");
    assert.deepEqual(ids, ["lints/rules-of-hooks"]);
  });

  it("reports high cognitive complexity", async () => {
    const nested = "if (a) { if (b) { if (c) { if (d) { return 1; } } } }\n".repeat(2);
    const ids = await ruleIdsFor("complex.js", `export function f(a, b, c, d) {\n${nested}return 0;\n}\n`);
    assert.ok(ids.includes("lints/cognitive-complexity"));
  });

  it("applies strict type-checked rules to TypeScript", async () => {
    const ids = await ruleIdsFor("unsafe.ts", "export function f(x: any): string { return x.name; }\n");
    assert.ok(ids.includes("lints/no-explicit-any"));
    assert.ok(ids.includes("lints/no-unsafe-member-access"));
  });

  it("reports a switch that misses a union member", async () => {
    const code = "export function f(k: 'a' | 'b'): number { switch (k) { case 'a': return 1; } return 0; }\n";
    assert.deepEqual(await ruleIdsFor("switch.ts", code), ["lints/switch-exhaustiveness-check"]);
  });

  it("allows numbers in template literals", async () => {
    assert.deepEqual(await ruleIdsFor("template.ts", "export const f = (n: number): string => `n=${n}`;\n"), []);
  });
});
