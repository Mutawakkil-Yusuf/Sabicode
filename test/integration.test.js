'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadDictionary } = require('../src/dictionary');
const { matchError } = require('../src/match');
const { renderBlock } = require('../src/render');

const ROOT = path.join(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sabi.js');
const entries = loadDictionary();

function run(args) {
  const env = { ...process.env };
  delete env.SABI_MODE;
  delete env.SABI_TONE;
  delete env.NO_COLOR;

  return spawnSync(process.execPath, [BIN, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env
  });
}

function fixtureFor(entry) {
  for (const extension of ['.js', '.cjs', '.mjs']) {
    const relative = path.join('test', 'fixtures', `${entry.id}${extension}`);
    if (fs.existsSync(path.join(ROOT, relative))) return relative;
  }
  return null;
}

for (const entry of entries) {
  test(`integration: ${entry.id}`, () => {
    const fixture = fixtureFor(entry);
    assert.ok(fixture, `fixture exists for ${entry.id}`);

    const result = run(['--mode=append', '--tone=street', fixture]);
    const sample = entry.samples.find((value) => result.stderr.includes(value));

    assert.equal(result.status, 1, 'child exit code is preserved');
    assert.ok(sample, `stderr includes a sample for ${entry.id}`);

    const matched = matchError(sample, entries);
    const expected = renderBlock(entry, matched.captures, { tone: 'street' });

    assert.ok(result.stderr.includes(expected), 'Pidgin block follows the original error');
    assert.ok(
      result.stderr.indexOf(expected.trim()) > result.stderr.indexOf(sample),
      'Pidgin block comes after the English error'
    );
  });
}

test('integration: passing script prints nothing extra', () => {
  const result = run(['test/fixtures/passing.js']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /sabicode: all good/);
  assert.doesNotMatch(result.stderr, /Wetin happen/);
});

test('integration: unknown error shows the unknown line', () => {
  const result = run(['--tone=street', 'test/fixtures/unknown.js']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /RangeError: boom/);
  assert.match(result.stderr, /This one na new to me\./);
  assert.doesNotMatch(result.stderr, /Wetin to do:/);
});

test('integration: --tone=normal uses the normal copy', () => {
  const entry = entries.find((item) => item.id === 'ref-not-defined');
  const matched = matchError(entry.samples[0], entries);
  const expected = renderBlock(entry, matched.captures, { tone: 'normal' });
  const result = run([
    '--mode=append',
    '--tone=normal',
    'test/fixtures/ref-not-defined.js'
  ]);

  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes(expected));
  assert.match(result.stderr, /Fix am, then run am again\./);
});

test('integration: --no-emoji uses [Polly]', () => {
  const result = run([
    '--mode=append',
    '--no-emoji',
    '--tone=street',
    'test/fixtures/ref-not-defined.js'
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[Polly\] Wetin happen:/);
  assert.doesNotMatch(result.stderr, /\u{1F99C}/u);
});

test('integration: pidgin-first is the default and keeps the English line', () => {
  const result = run(['test/fixtures/ref-not-defined.js']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /🦜 ReferenceError: You call `name`, but JavaScript no sabi am/);
  assert.match(result.stderr, /English: ReferenceError: name is not defined/);
  assert.ok(
    result.stderr.indexOf('🦜 ReferenceError:') < result.stderr.indexOf('English:'),
    'Pidgin headline comes before the English line'
  );
  assert.match(result.stderr, /at Object\.<anonymous>/);
  assert.doesNotMatch(result.stderr, /(^|\n)ReferenceError: name is not defined(\n|$)/);
});

test('integration: --mode=raw prints the child stderr untouched', () => {
  const result = run(['--mode=raw', 'test/fixtures/ref-not-defined.js']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /ReferenceError: name is not defined/);
  assert.doesNotMatch(result.stderr, /Wetin happen/);
  assert.doesNotMatch(result.stderr, /English:/);
});

test('integration: --raw is a shortcut for --mode=raw', () => {
  const result = run(['--raw', 'test/fixtures/ref-not-defined.js']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /ReferenceError: name is not defined/);
  assert.doesNotMatch(result.stderr, /Wetin happen/);
});

test('integration: pidgin-first uses [Polly] without the emoji', () => {
  const result = run(['--no-emoji', 'test/fixtures/ref-not-defined.js']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[Polly\] ReferenceError:/);
  assert.doesNotMatch(result.stderr, /\u{1F99C}/u);
});

test('integration: --no-color keeps ANSI out of output', () => {
  const result = run(['--no-color', '--tone=street', 'test/fixtures/ref-not-defined.js']);

  assert.equal(result.status, 1);
  assert.doesNotMatch(result.stderr, /\u001b\[/);
});

test('integration: arguments after the script are untouched', () => {
  const args = ['--tone=normal', '--no-color', 'hello world'];
  const result = run(['test/fixtures/args.js', ...args]);

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), JSON.stringify(args));
});

test('integration: run subcommand accepts flags before the script', () => {
  const result = run([
    'run',
    '--mode=append',
    '--tone=normal',
    'test/fixtures/ref-not-defined.js'
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /You dey use `name`, but JavaScript no sabi am\./);
});

test('integration: non-1 exit codes are preserved', () => {
  const result = run(['--tone=street', 'test/fixtures/exit-code.js']);

  assert.equal(result.status, 7);
  assert.match(result.stderr, /Wetin happen:/);
});
