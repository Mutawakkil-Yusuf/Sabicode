#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { loadDictionary } = require('../src/dictionary');
const { contentHash } = require('../src/review');

const COMMANDS = ['list', 'show', 'sign', 'reset', 'verify'];

function usage() {
  process.stdout.write(`Sabicode review tool

Usage:
  node scripts/review.js list
  node scripts/review.js show <id>
  node scripts/review.js sign <id> --reviewer "Name" [--github handle] [--date YYYY-MM-DD] [--notes "..."]
  node scripts/review.js reset <id>
  node scripts/review.js verify [--strict]

A review is valid only while its content hash matches the entry. If the Pidgin
changes, the entry shows as stale and must be reviewed again.
`);
}

function findEntry(id) {
  const entry = loadDictionary().find((item) => item.id === id);

  if (!entry) {
    process.stderr.write(`review: unknown entry "${id}".\n`);
    process.exitCode = 1;
    return null;
  }

  return entry;
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

function list() {
  const entries = loadDictionary();
  const width = Math.max(2, ...entries.map((entry) => entry.id.length));

  process.stdout.write(`Covered errors: ${entries.length}\n\n`);
  process.stdout.write(`${'id'.padEnd(width)}  review    reviewers\n`);
  process.stdout.write(`${'-'.repeat(width)}  --------  ---------\n`);

  for (const entry of entries) {
    const reviewers = entry.review.reviewers.map((reviewer) => reviewer.name).join(', ') || '-';
    process.stdout.write(
      `${entry.id.padEnd(width)}  ${entry.reviewStatus.padEnd(8)}  ${reviewers}\n`
    );
  }
}

function show(id) {
  const entry = findEntry(id);
  if (!entry) return;

  process.stdout.write(`${entry.id}\n`);
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
  const entry = findEntry(id);
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

function reset(id) {
  const entry = findEntry(id);
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
  const entries = loadDictionary();
  const counts = { reviewed: 0, draft: 0, stale: 0 };

  for (const entry of entries) {
    counts[entry.reviewStatus] += 1;
    if (entry.reviewStatus === 'stale') {
      process.stderr.write(`review: ${entry.id} is stale; re-review it or reset it.\n`);
    }
  }

  process.stdout.write(
    `Reviewed: ${counts.reviewed}  Draft: ${counts.draft}  Stale: ${counts.stale}\n`
  );

  if (counts.stale > 0) {
    process.exitCode = 1;
  }

  if (args.includes('--strict') && counts.draft > 0) {
    process.stderr.write('review: --strict requires every entry to be reviewed.\n');
    process.exitCode = 1;
  }
}

const [command, ...args] = process.argv.slice(2);

if (!command || command === '--help' || command === '-h') {
  usage();
} else if (!COMMANDS.includes(command)) {
  process.stderr.write(`review: unknown command "${command}".\n`);
  process.exitCode = 1;
} else if (command === 'list') {
  list();
} else if (command === 'verify') {
  verify(args);
} else {
  const [id] = args;
  if (!id) {
    process.stderr.write(`review: ${command} needs an entry id.\n`);
    process.exitCode = 1;
  } else if (command === 'show') {
    show(id);
  } else if (command === 'sign') {
    sign(id, args.slice(1));
  } else if (command === 'reset') {
    reset(id);
  }
}
