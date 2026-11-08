'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadDictionary } = require('../src/dictionary');
const { matchError } = require('../src/match');
const { renderBlock, renderUnknown } = require('../src/render');

const ROOT = path.join(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sabi.js');
const entries = loadDictionary();

function run(args) {
  const env = { ...process.env };
  delete env.SABI_TONE;
  delete env.NO_COLOR;

  return spawnSync(process.execPath, [BIN, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env
  });
}

for (const entry of entries) {
  test(`explain: ${entry.id}`, () => {
    const matched = matchError(entry.samples[0], entries);
    const expected = renderBlock(entry, matched.captures, { tone: 'street' }).replace(/^\n/, '');
    const result = run(['--tone=street', 'explain', entry.samples[0]]);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, expected);
    assert.equal(result.stderr, '');
  });
}

test('explain: tone flag works', () => {
  const entry = entries.find((item) => item.id === 'not-a-function');
  const matched = matchError(entry.samples[0], entries);
  const expected = renderBlock(entry, matched.captures, { tone: 'normal' }).replace(/^\n/, '');
  const result = run(['explain', '--tone=normal', entry.samples[0]]);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, expected);
});

test('explain: unknown error prints the unknown line and exits 1', () => {
  const result = run(['explain', 'RangeError: boom']);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, renderUnknown('street').replace(/^\n/, ''));
});

test('explain: no error line is a usage failure', () => {
  const result = run(['explain', 'just some text']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /no JavaScript error line found/);
});

test('explain: missing message is a usage failure', () => {
  const result = run(['explain']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /explain needs an error message/);
});
