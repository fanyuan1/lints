# dart

How Dart and Flutter projects will use lints. Not built yet. Build it the first time a Dart project needs a shared rule (run `/encode-correction`).

## The plan

- An analyzer plugin package in this folder, for example `dart/lints_dart/`. It uses the new analyzer plugin system, which needs Dart 3.10+ (Flutter 3.38+).
- The first rule is `no_comments`, the same as the ESLint rule: report every comment except analyzer directives (`// ignore:`, `// ignore_for_file:`) and a license header. Skip generated files (`*.g.dart`, `*.freezed.dart`).
- Projects turn the plugin on in the `plugins:` section of `analysis_options.yaml`, pointing at this repo (git or local path). Confirm the exact syntax against the Dart docs when you build it.
- Each project gets a Makefile `check` target that runs `dart analyze` (or `flutter analyze`) and the tests.

Until then, `/lints-init` creates the Makefile `check` target without a comments check, and tells you so.
