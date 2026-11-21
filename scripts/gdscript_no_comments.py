#!/usr/bin/env python3
"""Report GDScript `#` comments, with a baseline file that works like eslint-suppressions.json.

Usage:
  python3 gdscript_no_comments.py [PATH ...] [--baseline FILE] [--suppress-all | --prune-suppressions]

Exit code 1 when a file has more comments than its baseline count.
"""

import argparse
import json
import re
import sys
from pathlib import Path

DEFAULT_BASELINE = "gdscript-suppressions.json"
SKIP_DIRS = {".godot", ".import", "addons", "node_modules", ".git", "build", "dist"}
LINT_DIRECTIVE = re.compile(r"^#\s*gdlint\s*:")
LICENSE_WORDS = re.compile(r"copyright|license|licence|spdx-|\(c\)|©", re.IGNORECASE)


def find_comments(source):
    comments = []
    line_no = 1
    i = 0
    n = len(source)
    while i < n:
        ch = source[i]
        if ch == "\n":
            line_no += 1
            i += 1
        elif ch in "\"'":
            quote = source[i : i + 3] if source[i : i + 3] in ('"""', "'''") else ch
            i += len(quote)
            while i < n and not source.startswith(quote, i):
                c = source[i]
                if c == "\\":
                    if source[i + 1 : i + 2] == "\n":
                        line_no += 1
                    i += 2
                    continue
                if c == "\n":
                    if len(quote) == 1:
                        break
                    line_no += 1
                i += 1
            if source.startswith(quote, i):
                i += len(quote)
        elif ch == "#":
            end = source.find("\n", i)
            end = n if end == -1 else end
            comments.append((line_no, source[i:end].rstrip("\r")))
            i = end
        else:
            i += 1
    return comments


def header_lines(source, comments):
    lines = source.splitlines()
    header = []
    for line_no, _ in comments:
        before = lines[: line_no - 1]
        if all(l.strip() == "" or l.lstrip().startswith("#") for l in before) and lines[line_no - 1].lstrip().startswith("#"):
            header.append(line_no)
        else:
            break
    texts = [text for line_no, text in comments if line_no in header]
    return set(header) if any(LICENSE_WORDS.search(t) for t in texts) else set()


def violations(source):
    comments = find_comments(source)
    allowed = header_lines(source, comments)
    result = []
    for line_no, text in comments:
        if line_no in allowed or LINT_DIRECTIVE.match(text):
            continue
        if line_no == 1 and text.startswith("#!"):
            continue
        result.append((line_no, text))
    return result


def gd_files(paths):
    for root in paths:
        root = Path(root)
        if root.is_file():
            yield root
            continue
        for path in sorted(root.rglob("*.gd")):
            if not SKIP_DIRS.intersection(path.relative_to(root).parts[:-1]):
                yield path


def load_baseline(path):
    if not path.exists():
        return {}
    return json.loads(path.read_text())


def save_baseline(path, data):
    path.write_text(json.dumps(dict(sorted(data.items())), indent=2) + "\n")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("paths", nargs="*", default=["."])
    parser.add_argument("--baseline", default=DEFAULT_BASELINE)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--suppress-all", action="store_true", help="record every current comment in the baseline")
    mode.add_argument("--prune-suppressions", action="store_true", help="lower baseline counts that are no longer reached")
    args = parser.parse_args(argv)

    baseline_path = Path(args.baseline)
    baseline = load_baseline(baseline_path)
    found = {}
    for path in gd_files(args.paths):
        hits = violations(path.read_text(encoding="utf-8"))
        if hits:
            found[path.as_posix()] = hits

    if args.suppress_all:
        save_baseline(baseline_path, {f: len(h) for f, h in found.items()})
        print(f"Recorded {sum(len(h) for h in found.values())} comments in {baseline_path}.")
        return 0

    if args.prune_suppressions:
        pruned = {f: min(c, len(found.get(f, []))) for f, c in baseline.items()}
        save_baseline(baseline_path, {f: c for f, c in pruned.items() if c > 0})
        print(f"Pruned {baseline_path}.")

    failed = 0
    for file, hits in found.items():
        allowed = baseline.get(file, 0)
        if len(hits) <= allowed:
            continue
        failed += len(hits)
        for line_no, text in hits:
            print(f"{file}:{line_no}: no-comments: {text}")
        if allowed:
            print(f"{file}: {len(hits)} comments, baseline allows {allowed}.")

    stale = [f for f, c in baseline.items() if len(found.get(f, [])) < c]
    if stale and not args.prune_suppressions:
        print("Baseline has unused entries. Run with --prune-suppressions to shrink it.")

    if failed:
        print(f"{failed} GDScript comment(s) found. Remove them or record decisions in docs/decisions/.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
