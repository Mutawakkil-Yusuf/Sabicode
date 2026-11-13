# Sabicode

**Your errors, finally in your language.**

Sabicode runs a JavaScript file with Node and puts the error in Nigerian Pidgin.
By default the Pidgin headline takes the place of the English error line, the
code frame and stack trace stay where they are, and the original English line is
kept in the explanation. The child's exit code is preserved, and the explanation
teaches the real term along the way.

- Pidgin-first output, with `append` and `raw` modes
- JavaScript on Node 18, 20, or 22
- 17 dictionary entries across 11 concepts
- `street` tone (default) and `normal` tone
- zero runtime dependencies
- no network calls, telemetry, accounts, or AI fallback

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

> Sabicode is not published to npm yet. `npx sabicode app.js` is the command it
> will use once it is. Until then, clone this repository and run
> `node bin/sabi.js app.js`.

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
sabi --help
sabi --version
```

`sabi explain` explains a pasted error without running anything. `sabi list`
shows every covered entry, its concept, and whether a Pidgin speaker has
reviewed it. `sabi concepts` shows the concept catalog and how many errors cover
each idea.

## Covered errors

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

## Help with the Pidgin

The Pidgin here is a draft until a Pidgin speaker signs it off. If a phrase
sounds wrong, too formal, or not like how people actually talk, open an issue or
a pull request that changes only the `tone` strings (including `headline`) in
the relevant dictionary file. Keep the layout and the English technical terms
intact, then run `npm test`.

A sign-off is recorded against a hash of the reviewed content. If the copy
changes, the review becomes stale automatically:

```sh
npm run review -- list
npm run review -- show ref-not-defined
npm run review -- sign ref-not-defined --reviewer "Ada Obi" --github adaobi
npm run review -- verify
```

See `docs/review.md` for the rubric and the full workflow. Reviewer credits
appear in the entry, in `sabi list`, and on the generated error pages.

## Development

```sh
npm test
npm run build
npm run review -- list
```

The site is generated into `site/` from the dictionary. The build command and
output directory are also in `site/DEPLOY.md`. Contributor guidance is in
`CONTRIBUTING.md`.

## Roadmap

`PRODUCT.md` explains the thesis, the learning loop, the open-source model, and
the non-goals. The short version: Node errors in Pidgin first, then more
surfaces and more Nigerian languages.

## License

MIT
