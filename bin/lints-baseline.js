#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { RULE_IDS } from "../eslint/index.js";

const eslintBin = createRequire(`${process.cwd()}/`).resolve("eslint/bin/eslint.js");
const suppressions = RULE_IDS.flatMap((id) => ["--suppress-rule", id]);
const result = spawnSync(process.execPath, [eslintBin, ".", ...suppressions, ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
