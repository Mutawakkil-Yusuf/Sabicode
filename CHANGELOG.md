# Changelog

All notable changes to Sabicode are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
