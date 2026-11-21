# godot

How Godot projects use lints. Nothing here is installed into a project. Projects call `scripts/` from a clone of this repo at `~/projects/lints`. CI can clone it too, because the repo is public.

## The plan

1. **Comments check**: `scripts/gdscript_no_comments.py` reports `#` comments in `.gd` files. It needs only Python 3.
   - It allows `# gdlint:` directives, a license header at the top of a file, and a shebang on line 1.
   - It skips `.godot/`, `addons/` (third-party code), `build/` and `dist/`.
   - It keeps a baseline in `gdscript-suppressions.json`, like ESLint: `--suppress-all` records today's comments, `--prune-suppressions` shrinks the baseline.
2. **Style lint**: a shared `gdlintrc` for [gdtoolkit](https://github.com/Scony/godot-gdscript-toolkit) (`pip install gdtoolkit`) will live in this folder. Projects will run `gdlint --config ~/projects/lints/godot/gdlintrc .`. Not added yet.
3. **Makefile**: each project gets a `check` target. `/delete-comments` creates it:

   ```make
   LINTS ?= $(HOME)/projects/lints

   check:
   	python3 $(LINTS)/scripts/gdscript_no_comments.py .
   ```

Run `make check` before you finish a task.
