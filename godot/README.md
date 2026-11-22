# godot

How Godot projects use lints. Nothing is installed. Each project's Makefile downloads the check from this public repo at a pinned commit (`LINTS_REF`) into `.cache/`. That works on any computer and in CI, with no local clone.

## The plan

1. **Comments check**: `scripts/gdscript_no_comments.py` reports `#` comments in `.gd` files. It needs only Python 3.
   - It allows `# gdlint:` directives, a license header at the top of a file, and a shebang on line 1.
   - It skips `.godot/`, `addons/` (third-party code), `build/` and `dist/`.
   - It keeps a baseline in `gdscript-suppressions.json`, like ESLint: `--suppress-all` records today's comments, `--prune-suppressions` shrinks the baseline.
2. **Style lint**: a shared `gdlintrc` for [gdtoolkit](https://github.com/Scony/godot-gdscript-toolkit) (`pip install gdtoolkit`) will live in this folder. Projects will download it the same way as the comments check. Not added yet.
3. **Makefile**: each project gets a `check` target. `/lints-init` creates it:

   ```make
   LINTS_REF ?= <full lints commit sha>
   GD_CHECK := .cache/lints/$(LINTS_REF)/gdscript_no_comments.py

   $(GD_CHECK):
   	mkdir -p $(dir $@)
   	curl -fsSL https://raw.githubusercontent.com/fanyuan1/lints/$(LINTS_REF)/scripts/gdscript_no_comments.py -o $@

   check: $(GD_CHECK)
   	python3 $(GD_CHECK) .
   ```

   To pick up rule changes, bump `LINTS_REF` (`/lints-update` does this).

Run `make check` before you finish a task.
