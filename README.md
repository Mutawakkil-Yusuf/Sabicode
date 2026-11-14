# Sabicode

**Your errors, finally in your language.**

Sabicode runs a JavaScript file with Node and puts the error in Nigerian Pidgin.
By default the Pidgin headline takes the place of the English error line, the
code frame and stack trace stay where they are, and the original English line is
kept in the explanation. The child's exit code is preserved, and the explanation
teaches the real term along the way.

It can also run the ESLint already installed in your project and explain those
findings in Pidgin, so you can meet potential bugs before they crash.

- Pidgin-first output, with `append` and `raw` modes
- JavaScript on Node 18, 20, or 22
- 17 runtime error entries and 13 ESLint rule entries across 14 concepts
- `sabi scan` adapter for the project's local ESLint
- `street` tone (default) and `normal` tone
- zero runtime dependencies
- no network calls, telemetry, accounts, or AI fallback
- site: <https://mutawakkil-yusuf.github.io/Sabicode/>
- live demo: <https://mutawakkil-yusuf.github.io/Sabicode/demo.html>

## Install and run

```sh
npx sabicode app.js
```

The package also installs the short alias:

```sh
sabi app.js
sabi run app.js
```

Everything after the script path goes to your script untouched:

```sh
sabi app.js --port 3000
```

> Sabicode is published on npm as [`sabicode`](https://www.npmjs.com/package/sabicode).
> You can also clone this repository and run `node bin/sabi.js app.js`.

## What it looks like

Street tone:

```text
app.js:1
console.log(name);
            ^

🦜 ReferenceError: You call `name`, but JavaScript no sabi am
    at Object.<anonymous> (app.js:1:13)
    ...

   Wetin happen: You dey call `name` like say JavaScript know am, but e no sabi
                 who be that. You never introduce am o.
   Wetin to do:  Create am first:
                 `let name = "Ada";`
   Learn am:     "not defined" mean say the variable no dey anywhere JavaScript
                 fit see.
   English: ReferenceError: name is not defined

   Polly: Oya, run am again.
```

Normal tone:

```text
app.js:2
console.log(user.name);
                 ^

🦜 TypeError: You try read `name` from `undefined`
    at Object.<anonymous> (app.js:2:18)
    ...

   Wetin happen: You wan collect `name` from something wey no get value. That
                 thing na `undefined`.
   Wetin to do:  Check say the thing dey before you use am:
                 `thing?.name`
   Learn am:     `undefined` mean say nothing dey there.
   English: TypeError: Cannot read properties of undefined (reading 'name')

   Polly: Fix am, then run am again.
```

The code frame and stack trace are never translated. Only the error line gets a
Pidgin headline. The `English:` line keeps the exact original message, so it can
still be searched, pasted into an issue, or compared with the docs.

On a terminal, inline code is cyan and the backticks are hidden. On a
non-terminal or with `--no-color`, the backticks stay. `--no-emoji` swaps the
parrot for `[Polly]`.

## Modes

The first source that exists wins:

1. `--mode=pidgin-first`, `--mode=append`, or `--mode=raw`
2. the `SABI_MODE` environment variable
3. `pidgin-first`

| mode | what happens |
| --- | --- |
| `pidgin-first` | The error line becomes Pidgin. The code frame and stack stay. The English line is kept in the block. |
| `append` | The English error stays untouched and the Pidgin block is added below it. |
| `raw` | Node's stderr is printed untouched. No Pidgin. |

`--raw` is a shortcut for `--mode=raw`. An invalid mode prints a one-line
warning and falls back to `pidgin-first`.

## Tone

The first source that exists wins:

1. `--tone=street` or `--tone=normal`
2. the `SABI_TONE` environment variable
3. the nearest `.sabirc` file, searched from the current directory upward
4. `street`

```json
{
  "tone": "normal"
}
```

An invalid tone prints a one-line warning and falls back to `street`.

## Other commands

```sh
sabi explain "TypeError: x is not a function"
sabi list
sabi concepts
sabi rules
sabi scan [paths...] [--all]
sabi --help
sabi --version
```

`sabi explain` explains a pasted error without running anything. `sabi list`
shows every covered runtime entry, its concept, and whether a Pidgin speaker has
reviewed it. `sabi concepts` shows the concept catalog and how many runtime and
ESLint entries cover each idea. `sabi rules` lists the ESLint rule catalog.

## Scan for potential bugs

`sabi scan` runs the ESLint that is already installed in your project, then
explains each finding in Pidgin. It does not bundle ESLint, install anything, or
make a network call.

```sh
npm install --save-dev eslint   # once, in your project
sabi scan
sabi scan src app.js --all
```

```text
components/UserCard.jsx:6:46  error  eqeqeq
🦜 You use `==`, but `===` dey safer
   Wetin happen: `==` dey compare after e change the values. `===` compare the
                 value and the type, so e no dey do magic conversion.
   Wetin to do:  Change am to:
                 `a === b`
   Learn am:     `==` fit say `1` and `"1"` equal. `===` no go gree.
   English: Expected '===' and instead saw '=='.

   Polly: Oya, fix am.
```

- By default the first 10 findings are shown. `--all` shows every finding.
- The ESLint exit code is preserved: `0` for clean or warnings only, `1` when
  errors were found, and `2` when ESLint could not run.
- Covered rules get specific Pidgin copy. Any other rule gets a generic Pidgin
  explanation plus the exact English message.
- `SABI_ESLINT=/path/to/eslint` points Sabicode at a local ESLint package or
  binary when automatic discovery is not what you want.
- Sabicode does not auto-fix code. It explains the finding and leaves the edit to
  you.

If ESLint is missing, `sabi scan` exits `2` and prints the install command.

## Covered runtime errors

| id | concept | English |
| --- | --- | --- |
| `ref-not-defined` | `scope` | `ReferenceError: x is not defined` |
| `undefined-property` | `undefined-and-null` | `TypeError: Cannot read properties of undefined (reading 'x')` |
| `not-a-function` | `functions` | `TypeError: x is not a function` |
| `unexpected-end` | `syntax` | `SyntaxError: Unexpected end of input` |
| `const-assign` | `bindings` | `TypeError: Assignment to constant variable.` |
| `module-not-found-package` | `modules` | `Error: Cannot find module 'package'` |
| `module-not-found-path` | `modules` | `Error: Cannot find module './file'` |
| `already-declared` | `bindings` | `SyntaxError: Identifier 'x' has already been declared` |
| `unexpected-token` | `syntax` | `SyntaxError: Unexpected token 'x'` |
| `invalid-token` | `syntax` | `SyntaxError: Invalid or unexpected token` |
| `tdz` | `scope` | `ReferenceError: Cannot access 'x' before initialization` |
| `json-parse` | `data-formats` | `SyntaxError: Unexpected token ... in JSON` |
| `import-outside-module` | `modules` | `SyntaxError: Cannot use import statement outside a module` |
| `await-outside-async` | `async` | `SyntaxError: await is only valid in async functions...` |
| `max-call-stack` | `recursion` | `RangeError: Maximum call stack size exceeded` |
| `enoent` | `filesystem` | `Error: ENOENT: no such file or directory, open 'file'` |
| `not-iterable` | `iteration` | `TypeError: x is not iterable` |

## Covered ESLint rules

| rule | concept | English |
| --- | --- | --- |
| `eqeqeq` | `operators` | `Expected '===' and instead saw '=='.` |
| `no-async-promise-executor` | `async` | `Promise executor functions should not be async.` |
| `no-const-assign` | `bindings` | `'value' is constant.` |
| `no-dupe-keys` | `objects` | `Duplicate key 'a'.` |
| `no-func-assign` | `bindings` | `'fn' is a function.` |
| `no-import-assign` | `modules` | `'imported' is read-only.` |
| `no-redeclare` | `bindings` | `'value' is already defined.` |
| `no-shadow` | `scope` | `'inner' is already declared in the upper scope...` |
| `no-undef` | `scope` | `'name' is not defined.` |
| `no-unreachable` | `control-flow` | `Unreachable code.` |
| `no-unsafe-optional-chaining` | `undefined-and-null` | `Unsafe usage of optional chaining...` |
| `no-unused-vars` | `bindings` | `'count' is assigned a value but never used.` |
| `parse-error` | `syntax` | `Parsing error: Unexpected token ;` |

## Add a dictionary entry

1. Pick the concept first. Add or reuse an id from `concepts/concepts.json`.
2. Create `dictionary/<id>.json`. The filename is the id.
3. Follow the schema used by the existing entries. Set `"language": "javascript"`
   and the `concept` id. `match` is a JavaScript regular
   expression. `{1}`, `{2}`, and so on are filled from its captures. Each tone
   needs a short `headline` for the Pidgin-first error line, plus `happen`,
   `todo`, and `learn` for the explanation block.
4. Add at least one `samples` string captured from a real Node run.
5. Add `test/fixtures/<id>.js` that triggers the error. Use `.cjs` or `.mjs`
   when the module mode matters.
6. Start with `"review": { "status": "draft", "reviewers": [], "contentHash": null }`
   and add the plain-English `what` paragraph used by the website.
7. Run `npm test`. It checks the schema, the concept catalog, that every sample
   matches only its own entry, the Pidgin style rules, the renderer, the review
   hash, and the real CLI.

## Add an ESLint rule entry

The ESLint catalog lives in `eslint/<rule-id>.json`. It uses the same schema and
rendering as the runtime dictionary, so an entry looks and reviews the same way.

1. Create `eslint/<rule-id>.json`. The filename is the ESLint rule id.
2. Set `match` to a regular expression that matches the rule's English message
   and captures the parts used by the Pidgin copy.
3. Add at least one real `samples` message from ESLint, the plain-English
   `what`, both tones, and a `fix_code` when a safe fix is obvious.
4. Run `npm run review -- list --eslint` to see the ESLint catalog.
5. Run `npm test`. The schema, samples, style, and collision checks cover both
   catalogs. Uncovered rules still work through the generic Pidgin fallback.

## Help with the Pidgin

The current catalog is signed off by a Pidgin speaker: 17 runtime entries and
13 ESLint entries, reviewed on 2026-11-14 by Mutawakkil Yusuf
([@Mutawakkil-Yusuf](https://github.com/Mutawakkil-Yusuf)). New or edited copy
starts as a draft until a reviewer signs it off.

If a phrase sounds wrong, too formal, or not like how people actually talk, open
an issue or a pull request that changes only the `tone` strings (including
`headline`) in the relevant `dictionary/` or `eslint/` file. Keep the layout and
the English technical terms intact, then run `npm test`.

A sign-off is recorded against a hash of the reviewed content. If the copy
changes, the review becomes stale automatically:

```sh
npm run review -- list
npm run review -- show ref-not-defined
npm run review -- sign ref-not-defined --reviewer "Ada Obi" --github adaobi
npm run review -- verify
npm run review -- list --eslint
npm run review -- show eqeqeq --eslint
npm run review -- sign eqeqeq --reviewer "Ada Obi" --github adaobi --eslint
```

See `docs/review.md` for the rubric and the full workflow. Reviewer credits
appear in the entry, in `sabi list`, in `sabi rules`, and on the generated error
pages.

## Development

```sh
npm test
npm run build
npm run review -- verify
```

The site is generated into `site/` from both catalogs. The build command and
output directory are also in `site/DEPLOY.md`. Contributor guidance is in
`CONTRIBUTING.md`. Maintainers should follow `docs/release.md` for versioning,
tagging, staged npm approval, and the provenance publish workflow. Release notes
live in `CHANGELOG.md`.

## Roadmap

`PRODUCT.md` explains the thesis, the learning loop, the open-source model, and
the non-goals. The short version: Node errors in Pidgin first, then more
surfaces and more Nigerian languages.

## License

MIT
