# Pidgin review guide

Sabicode ships Pidgin copy, not generated text. Every entry stays a draft until
a Pidgin speaker signs it off. The sign-off is tied to the exact content that was
reviewed, so a later edit cannot silently inherit an old approval.

## What a review covers

A review covers the Pidgin strings and the fix that appears with them:

- `tone.street.headline`, `happen`, `todo`, `learn`
- `tone.normal.headline`, `happen`, `todo`, `learn`
- `fix_code`

The English `what` paragraph, the regex, and the samples are context for the
reviewer. They are included in the content hash so that a change to the error
pattern also asks for a fresh look.

## The rubric

Read the English error and the Pidgin out loud. Then ask:

1. Does this sound like how people actually talk, not how a textbook talks?
2. Is the technical term kept in English and in backticks?
3. Is the layout still `Wetin happen`, `Wetin to do`, `Learn am`?
4. Is each sentence short, with one idea?
5. Is the learner respected? Nothing should imply they are dull, lazy, or
   careless.
6. Is the fix correct and safe for a beginner?
7. Does the headline fit on one line and name the thing that broke?

If any answer is no, suggest a change first. Do not sign off on copy you would
not want a learner to read.

## Suggest a change

Open an issue or a pull request that changes only the `tone` strings in the
relevant `dictionary/<id>.json`. Keep the layout, the backticks, and the English
technical terms intact. Then run:

```sh
npm test
```

The style test rejects text-speak and blame phrasing. The schema test rejects a
missing headline or a broken review record.

## Record a sign-off

A maintainer records the review after the copy is agreed:

```sh
npm run review -- list
npm run review -- show ref-not-defined
npm run review -- sign ref-not-defined --reviewer "Ada Obi" --github adaobi
npm run review -- verify
```

The `sign` command writes the reviewer, the date, and a SHA-256 hash of the
reviewed content into the entry. Use `--notes` for anything the next reviewer
should know.

To withdraw a review or start over:

```sh
npm run review -- reset ref-not-defined
```

## Why the hash matters

The review record looks like this:

```json
{
  "review": {
    "status": "reviewed",
    "reviewers": [{ "name": "Ada Obi", "github": "adaobi", "date": "2026-11-13" }],
    "contentHash": "sha256:..."
  }
}
```

If the headline, explanation, fix, regex, or samples change, the hash no longer
matches. `sabi list` shows the entry as `stale`, and `npm run review:verify`
fails. That is intentional: a sign-off is for a specific version of the words,
not for the file name.

## Credits

Reviewers are credited in the entry, in `sabi list`, and on the generated site.
If you review under a different name or handle, say so in the pull request.
