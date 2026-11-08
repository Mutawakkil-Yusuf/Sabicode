# Decisions

Choices made while building Sabicode, including the places where the brief left
room for interpretation.

## Product and packaging

- Package version starts at `0.1.0`. The package is not published during this
  build.
- The CLI is CommonJS and uses only Node built-ins. There are no runtime
  dependencies.
- Node 18, 20, and 22 are the supported and tested versions.

## CLI

- The Pidgin block from `sabi run` is written to stderr, directly after the
  child's untouched stderr. This keeps the explanation attached to the original
  error and lets stdout stay clean for the program's own output.
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

## Dictionary

- Extra fields beyond the required schema are allowed. Each entry has a `what`
  field with a plain-English paragraph used by the generated error pages. The
  tone copy remains the approved Pidgin.
- The fake package `left-pad` is used in the missing-package fixture so the
  captured sample is realistic. The fixture relies on the project having no
  installed copy of that package.
- `reviewed` is `false` on every entry until a Pidgin speaker signs off.

## Site

- The editable page source is `scripts/landing.template.html`; the build writes
  `site/index.html`. Generated site files are committed so the static host can
  deploy the repository output directly.
- The canonical base URL is the placeholder `https://sabicode.dev`. Change
  `SITE_URL` in `scripts/build-site.js` when the real domain is chosen.
- The schools form uses a `mailto:` form action built from the single
  `SCHOOLS_EMAIL` constant at the top of `scripts/build-site.js`. There is no
  backend and no data is stored.
- The mascot is an early placeholder drawing. `site/assets/polly.svg` is the
  favicon version. Final art can replace the shape without changing the
  animation hooks (`.crest`, `.beak`, `.lid`).
- The share image is generated as `site/assets/og.svg` because the build has no
  image dependencies. Some social networks prefer PNG; generate one from the
  SVG if required.
- The page loads Poppins and JetBrains Mono from Google Fonts and keeps full
  local fallback stacks.
