# Changelog

All notable changes to Sabicode are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-11-14

### Added

- `sabi scan [paths...]`, an optional adapter that runs the ESLint already
  installed in the project and explains each finding in Pidgin. It bundles no
  ESLint, installs nothing, makes no network calls, and does not auto-fix code.
- Pidgin coverage for 13 ESLint rules, including `eqeqeq`, `no-undef`,
  `no-unused-vars`, `no-unreachable`, `no-shadow`, `no-dupe-keys`,
  `no-unsafe-optional-chaining`, and parse errors. Uncovered rules get a generic
  Pidgin explanation plus the exact English message.
- `sabi rules` to list the ESLint catalog, and `sabi scan --all` to show every
  finding instead of the first 10.
- `SABI_ESLINT=/path/to/eslint` for explicit local ESLint discovery.
- Three concepts — `objects`, `operators`, and `control-flow` — for 14 concepts
  across both catalogs.
- A dedicated live demo at `/demo.html`: run real JavaScript in a sandboxed
  worker, paste an error, or replay an ESLint scan with selectable findings.
- A rewritten landing page built around the problem, the dictionary model, a
  before/after comparison, the two commands, and the people it serves.
- `npm run review -- list --eslint` and `--runtime` catalog selection. `verify`
  now reports runtime and ESLint review state separately.

### Changed

- `sabi concepts` counts runtime and ESLint entries together.
- The generated site now builds 19 pages: landing, demo, and 17 runtime error
  pages. The demo data includes both catalogs.
- The npm package includes the `eslint/` catalog and the updated docs.

### Fixed

- Horizontal overflow on the landing page caused by grid tracks growing to the
  min-content width of long code samples.

### Verified

- The adapter was exercised against ESLint 8.57.1 and 9.39.5, including clean
  runs, warnings, errors, parse errors, unknown rules, and missing configs.
- `npm test` passes 221 tests on the development Node version.

## [0.2.1] - 2026-11-14

### Fixed

- Refresh the packaged README so the npm page no longer says Sabicode is
  unpublished. No runtime changes.

## [0.2.0] - 2026-11-13

### Added

- Pidgin-first output is now the default. The Pidgin headline replaces the
  English error line, the code frame and stack trace stay in place, and the
  original English is printed as an `English:` line inside the explanation.
- `--mode=pidgin-first|append|raw`, `--raw`, and `SABI_MODE`. `append` preserves
  the v0.1 behavior; `raw` prints Node's stderr untouched.
- A short `headline` for every dictionary entry and tone.
- Schema v2: `language` and `concept` on every entry, plus a shared concept
  catalog in `concepts/concepts.json`.
- `sabi concepts`, and a concept column in `sabi list`.
- Six new concept-first entries: `json-parse`, `import-outside-module`,
  `await-outside-async`, `max-call-stack`, `enoent`, and `not-iterable`.
- A content-hashed Pidgin review workflow. `npm run review -- sign` records a
  reviewer against the exact reviewed content; later edits mark the entry
  `stale`.
- Contributor scaffolding: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `docs/review.md`, GitHub issue templates, and a pull request template.
- Concept badges on the generated site and review state on every error page.
- A tag-driven release workflow that publishes with npm provenance.

### Changed

- The site, README, product thesis, style guide, and decisions now describe the
  Pidgin-first experience and the concept model.
- The integration test accepts `.js`, `.cjs`, and `.mjs` fixtures and picks the
  matching JSON sample for the running Node version.

## [0.1.0] - 2026-11-08

### Added

- Initial `sabi` / `sabicode` CLI for running JavaScript with Node.
- Pidgin explanations appended under the original English error.
- `street` and `normal` tones, `SABI_TONE`, and `.sabirc`.
- `sabi explain` and `sabi list`.
- 11 dictionary entries, fixtures, schema/style tests, and a generated static
  site.
