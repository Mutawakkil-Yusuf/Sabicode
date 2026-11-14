#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { loadDictionary, loadEslintRules } = require('../src/dictionary');
const { contentHash } = require('../src/review');

const COMMANDS = ['list', 'show', 'sign', 'reset', 'verify'];

function usage() {
  process.stdout.write(`Sabicode review tool

Usage:
  node scripts/review.js list [--eslint|--runtime]
  node scripts/review.js show <id> [--eslint|--runtime]
  node scripts/review.js sign <id> --reviewer "Name" [--github handle] [--date YYYY-MM-DD] [--notes "..."] [--eslint|--runtime]
  node scripts/review.js reset <id> [--eslint|--runtime]
  node scripts/review.js verify [--eslint|--runtime] [--strict]

Without a catalog flag, list and verify cover both the runtime dictionary and
the ESLint rule catalog. A review is valid only while its content hash matches
the entry. If the Pidgin changes, the entry shows as stale and must be reviewed
again.
`);
}

function stripCatalogFlags(args) {
  return args.filter((arg) => arg !== '--eslint' && arg !== '--runtime');
}

function selectedCatalogs(args) {
  const onlyEslint = args.includes('--eslint');
  const onlyRuntime = args.includes('--runtime');

  if (onlyEslint && onlyRuntime) {
    process.stderr.write('review: use --eslint or --runtime, not both.\n');
    process.exitCode = 1;
    return [];
  }

  if (onlyEslint) return [{ name: 'ESLint', entries: loadEslintRules() }];
  if (onlyRuntime) return [{ name: 'Runtime', entries: loadDictionary() }];

  return [
    { name: 'Runtime', entries: loadDictionary() },
    { name: 'ESLint', entries: loadEslintRules() }
  ];
}

function findEntry(id, args) {
  for (const catalog of selectedCatalogs(args)) {
    const entry = catalog.entries.find((item) => item.id === id);
    if (entry) return { ...entry, catalog: catalog.name };
  }

  process.stderr.write(`review: unknown entry "${id}".\n`);
  process.exitCode = 1;
  return null;
}

function readRaw(entry) {
  return JSON.parse(fs.readFileSync(entry.fullPath, 'utf8'));
}

function writeRaw(entry, data) {
  fs.writeFileSync(entry.fullPath, `${JSON.stringify(data, null, 2)}\n`);
}

function option(args, name) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return args[index + 1];
}

function list(args) {
  const catalogs = selectedCatalogs(args);
  if (catalogs.length === 0) return;

  catalogs.forEach((catalog, catalogIndex) => {
    const { name, entries } = catalog;
    const width = Math.max(2, ...entries.map((entry) => entry.id.length));
    const heading = name === 'ESLint' ? 'ESLint rules' : 'Covered errors';

    if (catalogIndex > 0) process.stdout.write('\n');
    process.stdout.write(`${heading}: ${entries.length}\n\n`);
    process.stdout.write(`${'id'.padEnd(width)}  review    reviewers\n`);
    process.stdout.write(`${'-'.repeat(width)}  --------  ---------\n`);

    for (const entry of entries) {
      const reviewers =
        entry.review.reviewers.map((reviewer) => reviewer.name).join(', ') || '-';
      process.stdout.write(
        `${entry.id.padEnd(width)}  ${entry.reviewStatus.padEnd(8)}  ${reviewers}\n`
      );
    }
  });
}

function show(id, args) {
  const entry = findEntry(id, args);
  if (!entry) return;

  process.stdout.write(`${entry.id}\n`);
  process.stdout.write(`Catalog: ${entry.catalog}\n`);
  process.stdout.write(`English: ${entry.samples[0]}\n`);
  process.stdout.write(`Review:  ${entry.reviewStatus} (${entry.currentHash})\n`);

  for (const tone of ['street', 'normal']) {
    const copy = entry.tone[tone];
    process.stdout.write(`\n${tone}:\n`);
    process.stdout.write(`  ${copy.headline}\n`);
    process.stdout.write(`  Wetin happen: ${copy.happen}\n`);
    process.stdout.write(`  Wetin to do:  ${copy.todo}\n`);
    if (entry.fix_code) process.stdout.write(`                ${entry.fix_code}\n`);
    process.stdout.write(`  Learn am:     ${copy.learn}\n`);
  }
}

function sign(id, args) {
  const entry = findEntry(id, args);
  if (!entry) return;

  const name = option(args, 'reviewer');
  if (!name || !name.trim()) {
    process.stderr.write('review: sign needs --reviewer "Name".\n');
    process.exitCode = 1;
    return;
  }

  const github = option(args, 'github');
  const date = option(args, 'date') || new Date().toISOString().slice(0, 10);
  const notes = option(args, 'notes');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    process.stderr.write('review: --date must be YYYY-MM-DD.\n');
    process.exitCode = 1;
    return;
  }

  const data = readRaw(entry);
  const hash = contentHash(data);
  const previous = data.review && data.review.status === 'reviewed' ? data.review : null;
  const keep = previous && previous.contentHash === hash ? previous.reviewers || [] : [];
  const reviewer = {
    name: name.trim(),
    ...(github ? { github: github.replace(/^@/, '') } : {}),
    date
  };
  const duplicate = keep.some(
    (item) => item.name === reviewer.name && item.github === reviewer.github
  );
  const reviewers = duplicate ? keep : [...keep, reviewer];

  data.review = {
    status: 'reviewed',
    reviewers,
    contentHash: hash,
    ...(notes ? { notes } : {})
  };

  writeRaw(entry, data);
  process.stdout.write(`Signed ${id} by ${reviewer.name} for ${hash.slice(0, 19)}…\n`);
}

function reset(id, args) {
  const entry = findEntry(id, args);
  if (!entry) return;

  const data = readRaw(entry);
  data.review = {
    status: 'draft',
    reviewers: [],
    contentHash: null
  };

  writeRaw(entry, data);
  process.stdout.write(`Reset ${id} to draft.\n`);
}

function verify(args) {
  const catalogs = selectedCatalogs(args);
  if (catalogs.length === 0) return;

  let totalDrafts = 0;
  let totalStale = 0;

  for (const catalog of catalogs) {
    const counts = { reviewed: 0, draft: 0, stale: 0 };

    for (const entry of catalog.entries) {
      counts[entry.reviewStatus] += 1;
      if (entry.reviewStatus === 'stale') {
        process.stderr.write(`review: ${entry.id} is stale; re-review it or reset it.\n`);
      }
    }

    totalDrafts += counts.draft;
    totalStale += counts.stale;

    process.stdout.write(
      `${catalog.name}: Reviewed: ${counts.reviewed}  Draft: ${counts.draft}  Stale: ${counts.stale}\n`
    );
  }

  if (totalStale > 0) {
    process.exitCode = 1;
  }

  if (args.includes('--strict') && totalDrafts > 0) {
    process.stderr.write('review: --strict requires every entry to be reviewed.\n');
    process.exitCode = 1;
  }
}

const [command, ...args] = process.argv.slice(2);
const positionals = stripCatalogFlags(args);

if (!command || command === '--help' || command === '-h') {
  usage();
} else if (!COMMANDS.includes(command)) {
  process.stderr.write(`review: unknown command "${command}".\n`);
  process.exitCode = 1;
} else if (command === 'list') {
  list(args);
} else if (command === 'verify') {
  verify(args);
} else {
  const [id] = positionals;
  if (!id) {
    process.stderr.write(`review: ${command} needs an entry id.\n`);
    process.exitCode = 1;
  } else if (command === 'show') {
    show(id, args);
  } else if (command === 'sign') {
    sign(id, args);
  } else if (command === 'reset') {
    reset(id, args);
  }
}
