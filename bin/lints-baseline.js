#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { RULE_IDS } from "../eslint/index.js";

const eslintPackage = createRequire(`${process.cwd()}/`).resolve("eslint/package.json");
const eslintBin = path.join(path.dirname(eslintPackage), "bin", "eslint.js");
const suppressions = RULE_IDS.flatMap((id) => ["--suppress-rule", id]);
const result = spawnSync(process.execPath, [eslintBin, ".", ...suppressions, ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
