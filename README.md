# Sabicode

**Your errors, finally in your language.**

Sabicode runs a JavaScript file with Node and explains the error in Nigerian
Pidgin, printed under the original English error. The English never changes, the
child's exit code is preserved, and the explanation teaches the real term along
the way.

- JavaScript on Node 18, 20, or 22
- 11 dictionary entries covering 10 common errors
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
ReferenceError: name is not defined

🦜 Wetin happen: You dey call `name` like say JavaScript know am, but e no sabi
                 who be that. You never introduce am o.
   Wetin to do:  Create am first:
                 `let name = "Ada";`
   Learn am:     "not defined" mean say the variable no dey anywhere JavaScript
                 fit see.

   Polly: Oya, run am again.
```

Normal tone:

```text
TypeError: Cannot read properties of undefined (reading 'name')

🦜 Wetin happen: You wan collect `name` from something wey no get value. That
                 thing na `undefined`.
   Wetin to do:  Check say the thing dey before you use am:
                 `thing?.name`
   Learn am:     `undefined` mean say nothing dey there.

   Polly: Fix am, then run am again.
```

On a terminal, inline code is cyan and the backticks are hidden. On a
non-terminal or with `--no-color`, the backticks stay. `--no-emoji` swaps the
parrot for `[Polly]`.

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
sabi --help
sabi --version
```

`sabi explain` explains a pasted error without running anything. `sabi list`
shows every covered entry and whether a Pidgin speaker has reviewed it.

## Covered errors

| id | English |
| --- | --- |
| `ref-not-defined` | `ReferenceError: x is not defined` |
| `undefined-property` | `TypeError: Cannot read properties of undefined (reading 'x')` |
| `not-a-function` | `TypeError: x is not a function` |
| `unexpected-end` | `SyntaxError: Unexpected end of input` |
| `const-assign` | `TypeError: Assignment to constant variable.` |
| `module-not-found-package` | `Error: Cannot find module 'package'` |
| `module-not-found-path` | `Error: Cannot find module './file'` |
| `already-declared` | `SyntaxError: Identifier 'x' has already been declared` |
| `unexpected-token` | `SyntaxError: Unexpected token 'x'` |
| `invalid-token` | `SyntaxError: Invalid or unexpected token` |
| `tdz` | `ReferenceError: Cannot access 'x' before initialization` |

## Add a dictionary entry

1. Create `dictionary/<id>.json`. The filename is the id.
2. Follow the schema used by the existing entries. `match` is a JavaScript
   regular expression. `{1}`, `{2}`, and so on are filled from its captures.
3. Add at least one `samples` string captured from a real Node run.
4. Add `test/fixtures/<id>.js` that triggers the error.
5. Set `"reviewed": false` and add the plain-English `what` paragraph used by
   the website.
6. Run `npm test`. It checks the schema, that every sample matches only its own
   entry, the Pidgin style rules, the renderer, and the real CLI.

## Help with the Pidgin

The Pidgin here is a first draft. Pidgin speakers will review every entry before
it is treated as final. If a phrase sounds wrong, too formal, or not like how
people actually talk, open an issue or a pull request that changes only the
`tone` strings in the relevant dictionary file. Keep the layout and the English
technical terms intact, then run `npm test`.

Reviewer credits will live in the site footer once the first review round is
done.

## Development

```sh
npm test
node scripts/build-site.js
```

The site is generated into `site/` from the dictionary. The build command and
output directory are also in `site/DEPLOY.md`.

## License

MIT
