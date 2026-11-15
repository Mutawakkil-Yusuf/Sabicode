# Decisions

Choices made while building Sabicode, including the places where the brief left
room for interpretation.

## Product and packaging

- Package version starts at `0.1.0`; `0.2.0` adds Pidgin-first output, the
  concept schema, the review workflow, and the first concept-first dictionary
  expansion. `0.2.1` refreshes the packaged README. `0.3.0` adds the optional
  ESLint scan adapter, the ESLint rule catalog, and the live browser demo.
  Versions through `0.3.1` are published on npm as `sabicode`.
- The CLI is CommonJS and uses only Node built-ins. There are no runtime
  dependencies.
- Node 18, 20, and 22 are the supported and tested versions.

## CLI

- In `append` mode, the Pidgin block from `sabi run` is written to stderr,
  directly after the child's untouched stderr. In `pidgin-first` mode, the
  error line is rewritten in place and the block follows the stack. In both
  modes stdout stays clean for the program's own output.
- `sabi explain` writes its explanation to stdout and exits `0` when it matches,
  `1` when it does not. This makes it usable in a pipe.
- When an error line is found but no dictionary entry matches, the unknown line
  is rendered as the `Wetin happen` value, with no closer line.
- `fix_code` is rendered on its own line under `Wetin to do`, indented to the
  same column, and formatted as inline code.
- `--tone`, `--no-color`, and `--no-emoji` are read only before the script path
  (or before the `explain` message). Everything after the script path is passed
  to the child untouched.
- An invalid tone anywhere in the chain warns once on stderr and falls back to
  `street`; it does not fall through to the next source.
- A malformed `.sabirc` warns and falls back to `street`. A `.sabirc` without a
  `tone` key is treated as the end of the search and defaults to `street`.
- `sabi explain` scans the pasted text for the first line matching the same
  error-line pattern used by the runner, so stack traces and `[CODE]` suffixes
  work.
- The child is spawned as `process.execPath` with an argument array and no
  shell, so paths with spaces work on Windows and Unix. Script arguments after
  the path are never re-parsed by Sabicode.
- `npm test` uses `scripts/test.js` to pass only `test/*.test.js` files to
  `node --test`. The fixture programs under `test/fixtures/` are data, not test
  files, so they must not be auto-discovered and executed.

## Pidgin-first (v0.2)

- The default mode is `pidgin-first`: the first error line is replaced by a
  short Pidgin headline, the code frame and stack trace are kept, and the
  original English line is printed as `English: ...` inside the block.
- `--mode=append` preserves the v0.1 behavior. `--mode=raw` prints the child's
  stderr untouched. `--raw` is an alias for `--mode=raw`.
- Pidgin-first buffers stderr until the child exits so the error line can be
  rewritten. Append and raw stream live.
- The original English line is never lost; it is always available in the output.
- Each dictionary entry has a `headline` for each tone. The headline is short,
  includes the error class, and uses the same backtick convention as the rest of
  the copy.
- The renderer hides the block mascot when a headline already carries it, so the
  output has one parrot, not two.
- `SABI_MODE` and `--mode` are resolved before the script path, like tone. An
  invalid mode warns once and falls back to `pidgin-first`.

## ESLint adapter (v0.3)

- `sabi scan` is optional and uses the ESLint already installed for the project.
  Sabicode does not bundle, install, or download ESLint, and it makes no network
  calls.
- Discovery first resolves `eslint/package.json` from the current working
  directory, then reads the package's `bin` entry. `SABI_ESLINT` overrides this
  and accepts a package directory, a `package.json`, or an executable path.
- The adapter spawns `node <eslint-bin> --format json --no-color <paths>` with
  `process.execPath` and an argument array, never a shell. It sets
  `FORCE_COLOR=0` so the JSON is clean.
- The ESLint exit code is preserved: `0` for clean or warnings only, `1` for
  errors, and `2` when ESLint could not run. A missing ESLint, a missing config,
  or unreadable JSON returns `2` with a short Pidgin-friendly next step.
- Findings are sorted by file path, line, column, and rule id. The default output
  shows the first 10; `--all` shows every finding.
- A finding is matched by rule id first, then by the entry's message regex. Parse
  errors with no rule id map to the `parse-error` entry. Any other rule gets a
  generic Pidgin explanation plus the exact English message.
- The ESLint catalog lives in `eslint/` and uses the same schema, renderer, and
  content-hash review model as the runtime dictionary. Runtime and ESLint
  entries are loaded separately so `sabi scan` never matches a runtime error
  pattern against an ESLint message.
- `sabi rules` lists the ESLint catalog. `sabi concepts` counts both catalogs
  together. `scripts/review.js` accepts `--eslint` and `--runtime`; without
  either flag, `list` and `verify` cover both.
- Sabicode does not auto-fix code. `sabi scan` explains the finding and leaves
  the edit to the developer.

## Dictionary

- Schema v2 adds `language` and `concept` to every entry. `language` is
  `javascript` for the current pack. `concept` points at an id in
  `concepts/concepts.json`.
- Concepts are the expansion unit. New entries are chosen to cover a concept
  that has no entry, not to chase a raw error count. The catalog also carries a
  human title and summary for `sabi concepts` and the site.
- `concepts/concepts.json` is shipped with the package because `sabi concepts`
  reads it at runtime. The schema test rejects an entry with an unknown concept
  and a concept with no entries.
- Extra fields beyond the required schema are allowed. Each entry has a `what`
  field with a plain-English paragraph used by the generated error pages. The
  tone copy remains the approved Pidgin.
- The fake package `left-pad` is used in the missing-package fixture so the
  captured sample is realistic. The fixture relies on the project having no
  installed copy of that package.
- Each entry has a `review` record: `status`, `reviewers`, `contentHash`, and an
  optional `notes` string.
- The initial 30-entry catalog was signed off on 2026-11-14 by Mutawakkil Yusuf.
  New or edited entries start as drafts, and any later edit to a signed entry
  marks it stale automatically.
- `reviewed` is computed from the record and the current content hash; it is not
  stored as a boolean.
- The hash covers the id, match, samples, `fix_code`, and both tone objects. Any
  change to those fields invalidates the sign-off. `language`, `concept`, and
  `what` are metadata and are not hashed.
- `sabi list` shows the concept and `yes`, `no`, or `stale`. `sabi concepts`
  shows how many entries cover each concept. `npm run review:verify` fails when
  a reviewed entry is stale.
- `scripts/review.js` is a maintainer tool and is not included in the npm
  package. Reviewer credits appear in the entry, in `sabi list`, and on the
  generated error pages.
- The demo and `sabi list` use the order the entries appear in the brief, not
  alphabetical order, so the most familiar error appears first. Unknown future
  ids sort alphabetically after that list.
- Error entries can use a `.cjs` or `.mjs` fixture when Node's module detection
  would otherwise change the error. The integration test accepts all three
  fixture extensions.
- The JSON parse entry has samples for both the Node 18 message and the newer
  Node 20/22 message. The integration test picks whichever sample the running
  Node version actually produced.

## Site

- The editable page sources are `scripts/landing.template.html`,
  `scripts/demo.template.html`, and `scripts/site.css`; the build writes
  `site/index.html`, `site/demo.html`, and `site/errors/<id>.html`. Generated
  site files are committed so the static host can deploy the repository output
  directly. `SABI_SITE_OUT` can redirect the build to another directory for
  tests.
- The landing page tells the problem → how it works → why the dictionary model
  is different → before/after → two commands → audience → open dictionary →
  coverage → schools → free story. The hero switches between English and Pidgin
  and cycles through four errors.
- The demo page has three tabs. Run mode executes JavaScript in a Web Worker
  created from a Blob URL, with a fake `console`, a 3 second timeout, and no DOM,
  `require`, or filesystem access. Explain mode matches the same dictionary
  patterns as `sabi explain`. Scan mode replays a recorded ESLint result and
  lets the reader select a finding.
- The demo is a preview, not Node. The page says so, and the real CLI remains
  the supported path for runtime errors.
- Both pages use `minmax(0, 1fr)` grid tracks so long `<pre>` samples scroll
  inside their cards instead of widening the page. The overflow check runs from
  360 px to 1280 px.
- The canonical base URL is `https://mutawakkil-yusuf.github.io/Sabicode`.
  `SITE_URL` can be changed in `scripts/build-site.js`, or overridden with
  `SABI_SITE_URL` for a custom domain.
- School pilot requests and Pidgin suggestions link to prefilled GitHub issues
  built from `SCHOOLS_URL` and `PIDGIN_URL` at the top of
  `scripts/build-site.js`. There is no backend, form endpoint, or stored data.
- The mascot is an early placeholder drawing. `site/assets/polly.svg` is the
  favicon version. Final art can replace the shape without changing the
  animation hooks (`.crest`, `.beak`, `.lid`). The beak is currently one shape
  that tilts; if final art splits it into upper and lower parts, only `.beak`
  and the `flap` keyframes need to change.
- The share image is generated as `site/assets/og.svg` because the build has no
  image dependencies. Some social networks prefer PNG; generate one from the
  SVG if required.
- The page loads Poppins and JetBrains Mono from Google Fonts and keeps full
  local fallback stacks.

## Verification

- `npm test` passes 221 tests on the development Node version. The suite covers
  Pidgin-first, modes, line rewriting, review hashes, concepts, the ESLint
  adapter, both catalogs, the generated site, and all 17 runtime fixtures.
- The integration test runs every fixture and checks that the original English
  error is still in stderr, that the Pidgin block follows it, and that the
  child's exit code is preserved.
- The ESLint adapter was exercised against ESLint 8.57.1 and 9.39.5 with clean
  files, warnings, errors, parse errors, unknown rules, and a missing config.
- `npm pack --dry-run` contains 47 files, about 26.9 kB packed, with `bin/`,
  `src/`, both catalogs, the licence, README, style guide, changelog, and
  package metadata.
- The release workflow stages the package from a `v*` tag with npm provenance.
  It needs the `NPM_TOKEN` repository secret and `id-token: write` permission.
  A maintainer approves the staged version with 2FA on npmjs.com.
- The site is checked with static HTML parsing, link checks, inline script
  syntax checks, page-size checks, and the automated site test. A Playwright
  pass exercised the run, explain, and scan demo tabs, the hero English/Pidgin
  switch, tone switching, the timeout path, and the scan replay at 360–1280 px
  with no console errors or horizontal overflow.
- Lighthouse has not been run in this environment, so performance and
  accessibility scores still need a separate pass.
