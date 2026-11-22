import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

describe("lints-baseline", () => {
  it("runs eslint with every lints rule suppressed", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lints-baseline-"));
    const result = spawnSync(
      process.execPath,
      [path.join(root, "bin", "lints-baseline.js"), "--suppressions-location", path.join(dir, "suppressions.json")],
      { cwd: root, encoding: "utf8" },
    );
    fs.rmSync(dir, { recursive: true, force: true });
    assert.equal(result.status, 0, result.stderr);
  });
});
