import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "gdscript_no_comments.py"
sys.path.insert(0, str(SCRIPT.parent))
from gdscript_no_comments import violations


def lines(source):
    return [line for line, _ in violations(source)]


class ViolationsTest(unittest.TestCase):
    def test_reports_line_and_trailing_comments(self):
        self.assertEqual(lines("# speed\nvar speed = 1 # px\n"), [1, 2])

    def test_reports_doc_comments(self):
        self.assertEqual(lines("## Player node\nextends Node\n"), [1])

    def test_ignores_hash_in_strings(self):
        src = 'var a = "#fff"\nvar b = \'# no\'\nvar c = """\n# inside\n"""\nvar d = "a\\"#b"\n'
        self.assertEqual(lines(src), [])

    def test_counts_lines_after_multiline_string(self):
        self.assertEqual(lines('var c = """\nx\ny\n"""\n# here\n'), [5])

    def test_allows_gdlint_directives(self):
        self.assertEqual(lines("# gdlint: ignore=max-line-length\nvar a = 1\n# gdlint:disable\n"), [])

    def test_allows_license_header(self):
        src = "# Copyright 2024 Acme\n# All rights reserved.\n\nextends Node\n# stray\n"
        self.assertEqual(lines(src), [5])

    def test_header_without_license_is_reported(self):
        self.assertEqual(lines("# Player script\nextends Node\n"), [1])

    def test_allows_shebang(self):
        self.assertEqual(lines("#!/usr/bin/env -S godot -s\nextends SceneTree\n"), [])


class CliTest(unittest.TestCase):
    def run_cli(self, cwd, *args):
        return subprocess.run([sys.executable, str(SCRIPT), *args], cwd=cwd, capture_output=True, text=True)

    def test_baseline_ratchet(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "player.gd").write_text("# a\n# b\nextends Node\n")
            (root / "addons").mkdir()
            (root / "addons" / "lib.gd").write_text("# third party\n")

            self.assertEqual(self.run_cli(tmp).returncode, 1)

            self.assertEqual(self.run_cli(tmp, "--suppress-all").returncode, 0)
            self.assertEqual(json.loads((root / "gdscript-suppressions.json").read_text()), {"player.gd": 2})
            self.assertEqual(self.run_cli(tmp).returncode, 0)

            (root / "player.gd").write_text("# a\n# b\n# new\nextends Node\n")
            self.assertEqual(self.run_cli(tmp).returncode, 1)

            (root / "player.gd").write_text("# a\nextends Node\n")
            self.assertEqual(self.run_cli(tmp, "--prune-suppressions").returncode, 0)
            self.assertEqual(json.loads((root / "gdscript-suppressions.json").read_text()), {"player.gd": 1})


if __name__ == "__main__":
    unittest.main()
