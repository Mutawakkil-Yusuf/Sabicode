# Decisions

Choices made while building Sabicode, including the places where the brief left
room for interpretation.

## Product and packaging

- Package version starts at `0.1.0`; `0.2.0` adds Pidgin-first output, the
  concept schema, the review workflow, and the first concept-first dictionary
  expansion. The package is not published during this build.
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

- The editable page source is `scripts/landing.template.html` and
  `scripts/site.css`; the build writes `site/index.html` and
  `site/errors/<id>.html`. Generated site files are committed so the static
  host can deploy the repository output directly. `SABI_SITE_OUT` can redirect
  the build to another directory for tests.
- The canonical base URL is the placeholder `https://sabicode.dev`. Change
  `SITE_URL` or set `SABI_SITE_URL` when the real domain is chosen.
- The schools form uses a `mailto:` form action built from the single
  `SCHOOLS_EMAIL` constant at the top of `scripts/build-site.js`. `PIDGIN_EMAIL`
  handles Pidgin suggestions. There is no backend and no data is stored.
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

- `npm test` passed on Node 18.20.8, 20.20.2, and 22.23.5 (165 tests each) at
  v0.2.0. The suite covers Pidgin-first, modes, line rewriting, review hashes,
  concepts, and all 17 fixtures.
- The integration test runs every fixture and checks that the original English
  error is still in stderr, that the Pidgin block follows it, and that the
  child's exit code is preserved.
- `npm pack --dry-run` contains 32 files, 17.5 kB packed, with `bin/`, `src/`,
  `dictionary/`, `concepts/`, the licence, README, style guide, and package
  metadata.
- `npm view sabicode` returned `E404` on 2026-11-08, so the public package name
  was free at that moment. Nothing was published.
- The site was checked with static HTML parsing, link checks, inline script
  syntax checks, page-size checks, and the automated site test. A browser and
  Lighthouse were not available in the build environment, so the animation and
  Lighthouse scores still need a visual pass.
