# Sabicode product thesis

**Your errors, finally in your language.**

Sabicode is a Pidgin-first developer experience layer. It starts with JavaScript
errors on Node, but the long-term idea is bigger: the tools a Nigerian developer
uses should be able to speak the language that developer thinks in.

## The problem

A beginner can write a program and still be stopped by the error. The terminal
prints English jargon, the learner cannot tell which part matters, and the
lesson hidden inside the error is lost. Searching the exact message helps, but
it assumes the learner already knows what to search for.

This is not only a language problem. It is a feedback problem. The error arrives
at the exact moment the learner is most willing to learn, and it is written for
someone who already knows the answer.

## What Sabicode is

Sabicode runs the learner's real code, keeps the code frame and stack trace,
and replaces the error line with a short Pidgin headline. The detailed
explanation follows in Pidgin, and the exact English line is kept in the output.

The English is not a fallback. It is part of the lesson:

- It keeps the error searchable.
- It teaches the term the learner will meet at work.
- It makes the tool safe to use in real debugging.

Sabicode is:

- **Pidgin-first**, not English-first with a translation bolted on.
- **Deterministic**, not AI-generated. Every explanation is reviewed copy.
- **Local-first**, not cloud-first. No code leaves the machine.
- **Concept-aware**, not just string matching. Every entry maps to a real idea.
- **Open**, not a closed dictionary. The language pack is the contribution.

Sabicode is not:

- An AI debugger.
- A code-quality gate.
- A replacement for Node, a compiler, or an editor.
- A translation of stack traces, file paths, or identifiers.
- A promise that every error is covered on day one.

## The experience

```text
app.js:1
console.log(name);
            ^

🦜 ReferenceError: You call `name`, but JavaScript no sabi am
    at Object.<anonymous> (app.js:1:13)

   Wetin happen: You dey call `name` like say JavaScript know am, but e no sabi
                 who be that. You never introduce am o.
   Wetin to do:  Create am first:
                 `let name = "Ada";`
   Learn am:     "not defined" mean say the variable no dey anywhere JavaScript
                 fit see.
   English: ReferenceError: name is not defined

   Polly: Oya, run am again.
```

Modes:

- `pidgin-first` (default): Pidgin replaces the error line; English is kept in
  the block.
- `append`: the original v0.1 behavior; English first, Pidgin below.
- `raw`: the original stderr, untouched.

Tone:

- `street` (default): how people actually talk.
- `normal`: calmer, for classrooms and documentation.

## Principles

1. **The learner is never the joke.** The error is the problem, not the person.
2. **Keep the real term.** Pidgin carries the explanation; English keeps the
   vocabulary.
3. **Never lose the original.** The exact error must always be recoverable.
4. **Short sentences, one idea each.** The terminal is not a textbook.
5. **Human review beats generated copy.** A language pack is only as good as
   the people who signed it off.
6. **Offline by default.** The tool should work on a cheap laptop with no data.
7. **One dictionary, many surfaces.** CLI, site, editor, and reports must not
   drift apart.
8. **Make the first contribution obvious.** One JSON file, one sample, one
   fixture, one review.

## Who it is for

- **Learners** in universities, polytechnics, bootcamps, and self-study.
- **Teachers** who need to see which concepts a class is stuck on.
- **Pidgin speakers** who want to make developer tools feel natural.
- **Developers** who want to add adapters, surfaces, and language packs.

## The long-term loop

The CLI is the wedge. The learning loop is the product:

1. **Run** the learner's real code.
2. **Understand** the error in reviewed Pidgin.
3. **Fix** it with a concrete suggestion.
4. **Map** the concept behind the error.
5. **Report** what the learner or class keeps getting wrong.

The map and report are deliberately local. A student can run `sabi map` and see
which concepts they have met and fixed. A teacher can run `sabi report` and get
a static file to share, with no server, account, or student code leaving the
machine.

## Open source model

The dictionary is the contribution unit. A language pack is a folder of JSON
entries, samples, and review records. That gives three kinds of contributors a
place to work:

- **Developers** add adapters, surfaces, and tests.
- **Pidgin speakers** review headlines, explanations, and tone.
- **Educators** report what learners actually hit and help shape concepts.

The reviewer workflow is the quality gate. A review records who signed off,
when, and against which content hash. If the Pidgin changes, the hash changes
and the review is invalidated. Credits live on the site and in the repository.

## Roadmap

### v0.2 — Pidgin-first

- Pidgin-first default, with `append` and `raw` modes.
- Short `headline` for every entry and tone.
- English line preserved in the output.
- Schema v2: `concept`, `language`, and a `review` record.
- Concept catalog and `sabi concepts`.
- First concept-first expansion: 17 entries across 11 concepts, including JSON,
  async, recursion, filesystem, and iteration errors.
- Reviewer workflow and credits.
- Open-source scaffolding: contributing guide, code of conduct, issue
  templates, roadmap, good first issues.
- First real npm publish with provenance.

### v0.3 — Learning loop

- `sabi map`: local concept progress.
- `sabi report`: static class report.
- Classroom kit: portable Node, CLI, lessons, exercises, and reports.

### v0.4 — Surfaces

- VS Code extension.
- Web playground.
- Shareable error cards.

### Later

- Python tracebacks, browser console, TypeScript, ESLint, Git.
- Yoruba, Igbo, and Hausa language packs.
- MCP server so agents can use reviewed Pidgin without Sabicode itself using
  AI.

## Non-goals

- Chasing IrisCode's code-quality feature list.
- Translating stack traces, paths, or identifiers.
- Sending code to a model or a server.
- Supporting ten languages before one language is excellent.
- Building a school dashboard before a static report proves useful.

## Success metrics

- A learner can explain an error in their own words after using Sabicode.
- A teacher can name the concept their class needs reteaching.
- A Pidgin speaker can review an entry in under five minutes.
- A developer can add an adapter without touching the dictionary.
- The package installs and runs offline with zero runtime dependencies.

## Decisions

`DECISIONS.md` records the implementation choices. This document records the
product direction. When they disagree, this document wins, and `DECISIONS.md`
should be updated.
