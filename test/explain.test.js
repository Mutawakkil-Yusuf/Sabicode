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
  delete env.SABI_MODE;
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
    const result = run(['--mode=append', '--tone=street', 'explain', entry.samples[0]]);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, expected);
    assert.equal(result.stderr, '');
  });
}

test('explain: tone flag works', () => {
  const entry = entries.find((item) => item.id === 'not-a-function');
  const matched = matchError(entry.samples[0], entries);
  const expected = renderBlock(entry, matched.captures, { tone: 'normal' }).replace(/^\n/, '');
  const result = run(['explain', '--mode=append', '--tone=normal', entry.samples[0]]);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, expected);
});

test('explain: unknown error prints the unknown line and exits 1', () => {
  const result = run(['--mode=append', 'explain', 'RangeError: boom']);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, renderUnknown('street').replace(/^\n/, ''));
});

test('explain: pidgin-first is the default and keeps the English line', () => {
  const entry = entries.find((item) => item.id === 'ref-not-defined');
  const result = run(['explain', entry.samples[0]]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /🦜 ReferenceError: You call `name`, but JavaScript no sabi am/);
  assert.match(result.stdout, /English: ReferenceError: name is not defined/);
  assert.match(result.stdout, /Wetin happen:/);
});

test('explain: pidgin-first handles an unknown error', () => {
  const result = run(['explain', 'RangeError: boom']);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /🦜 RangeError: This one na new to me/);
  assert.match(result.stdout, /English: RangeError: boom/);
  assert.match(result.stdout, /Wetin happen:/);
});

test('explain: raw mode prints the pasted message', () => {
  const entry = entries.find((item) => item.id === 'ref-not-defined');
  const result = run(['explain', '--mode=raw', entry.samples[0]]);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, `${entry.samples[0]}\n`);
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
