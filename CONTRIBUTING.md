# Contributing to Sabicode

Sabicode is a Pidgin-first developer experience layer. The project needs three
kinds of help: Pidgin review, new dictionary entries, and code for surfaces and
adapters.

## Pidgin speakers

You do not need to write code. The current catalog is signed off; new or edited
entries start as drafts until a reviewer signs them. Read `docs/review.md`, then:

- Open an issue with a better phrase.
- Open a pull request that changes only the `tone` strings in one
  `dictionary/<id>.json` or `eslint/<rule-id>.json`.
- Ask a maintainer to record your sign-off with `npm run review -- sign ...`.

The style rules are in `STYLE.md`. The short version: sound like a person, keep
technical terms in English, never blame the learner.

## Add a dictionary entry

1. Pick the concept first. Reuse an id from `concepts/concepts.json` or add one
   with a title and a one-sentence summary.
2. Pick a real error from a real Node run.
3. Create `dictionary/<id>.json` using the existing entries as the schema. Set
   `"language": "javascript"` and the `concept` id.
4. Add the short `headline` and the `happen`, `todo`, and `learn` copy for both
   tones.
5. Add a `samples` string captured from Node.
6. Add `test/fixtures/<id>.js` that triggers the error. Use `.cjs` or `.mjs`
   when the module mode matters.
7. Add the plain-English `what` paragraph.
8. Start with `"review": { "status": "draft", "reviewers": [], "contentHash": null }`.
9. Run `npm test`.

The tests check the schema, the concept catalog, that samples match only their
own entry, the Pidgin style rules, the renderer, the review hash, and the real
CLI.

## Add an ESLint rule entry

1. Pick a real rule from a project that already uses ESLint.
2. Create `eslint/<rule-id>.json` using the existing entries as the schema.
3. Match the rule's English message with `match`, and add a real `samples`
   string, both tones, the plain-English `what`, and a safe `fix_code` if there
   is one.
4. Run `npm run review -- list --eslint`.
5. Run `npm test`.

Uncovered rules already work through the generic fallback, so an entry can land
without blocking the scan.

## Code

```sh
npm test
npm run build
npm run review -- verify
node bin/sabi.js concepts
node bin/sabi.js rules
node bin/sabi.js scan
```

- Node 18, 20, and 22 are supported.
- There are no runtime dependencies. Use Node built-ins. ESLint is optional and
  is never bundled.
- Keep the English error recoverable. Never translate stack traces, paths, or
  identifiers.
- Add tests for new behavior. The suite is the specification.
- Keep the site generated from both catalogs; do not hand-edit `site/`.

## Pull requests

- Keep one change per pull request.
- For Pidgin-only changes, touch only the relevant dictionary or ESLint strings.
- For a reviewed entry, record the review or reset it. A stale review fails the
  schema test.
- Run `npm test` before opening the pull request.
- Explain the user-visible change in the description.

## Code of conduct

Be respectful. Critique the work, not the person. Harassment, discrimination,
and personal attacks are not welcome. Report concerns to
the maintainer privately on GitHub at <https://github.com/Mutawakkil-Yusuf>.

## Licence

By contributing, you agree that your contribution is licensed under the MIT
licence in `LICENSE`.
