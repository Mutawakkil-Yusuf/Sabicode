'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { findErrorLine, stripAnsi } = require('../src/parse');
const { matchError } = require('../src/match');
const { loadDictionary } = require('../src/dictionary');

const stderrDir = path.join(__dirname, 'fixtures', 'stderr');
const read = (name) => fs.readFileSync(path.join(stderrDir, name), 'utf8');
const entries = loadDictionary();

test('parser: runtime error', () => {
  const found = findErrorLine(read('runtime.txt'));
  assert.ok(found);
  assert.equal(found.name, 'ReferenceError');
  assert.equal(found.code, null);
  assert.equal(found.normalized, 'ReferenceError: name is not defined');
});

test('parser: syntax error with caret output', () => {
  const found = findErrorLine(read('syntax-caret.txt'));
  assert.ok(found);
  assert.equal(found.normalized, "SyntaxError: Unexpected token ';'");
});

test('parser: ERR_MODULE_NOT_FOUND keeps the message and drops the code', () => {
  const found = findErrorLine(read('esm-module-not-found.txt'));
  assert.ok(found);
  assert.equal(found.name, 'Error');
  assert.equal(found.code, 'ERR_MODULE_NOT_FOUND');
  assert.equal(
    found.normalized,
    "Error: Cannot find package 'left-pad' imported from test/fixtures/esm-package.mjs"
  );

  const result = matchError(found.normalized, entries);
  assert.equal(result.entry.id, 'module-not-found-package');
  assert.deepEqual(result.captures, ['left-pad']);
});

test('parser: multi-line stack', () => {
  const found = findErrorLine(read('multiline-stack.txt'));
  assert.ok(found);
  assert.equal(found.normalized, 'TypeError: greet is not a function');
});

test('parser: ANSI-colored text', () => {
  const raw = read('ansi.txt');
  assert.match(raw, /\u001b\[31m/);
  const found = findErrorLine(raw);
  assert.ok(found);
  assert.equal(
    found.normalized,
    "TypeError: Cannot read properties of undefined (reading 'name')"
  );
  assert.doesNotMatch(stripAnsi(raw), /\u001b/);
});

test('parser: no error line', () => {
  const found = findErrorLine(read('clean.txt'));
  assert.equal(found, null);
});

test('parser: takes the first matching error line', () => {
  const found = findErrorLine(
    'noise\nReferenceError: first is not defined\nReferenceError: second is not defined\n'
  );
  assert.equal(found.normalized, 'ReferenceError: first is not defined');
});
