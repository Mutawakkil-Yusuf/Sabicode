'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { replaceErrorLine } = require('../src/run');

test('run: replaces the matching error line and keeps the stack', () => {
  const raw =
    '/app.js:1\nconsole.log(name);\n            ^\n\n' +
    'ReferenceError: name is not defined\n    at Object.<anonymous> (/app.js:1:13)\n';

  const output = replaceErrorLine(
    raw,
    'ReferenceError: name is not defined',
    '🦜 ReferenceError: You call `name`'
  );

  assert.equal(
    output,
    '/app.js:1\nconsole.log(name);\n            ^\n\n' +
      '🦜 ReferenceError: You call `name`\n    at Object.<anonymous> (/app.js:1:13)\n'
  );
});

test('run: replaces an ANSI-colored error line', () => {
  const raw = '\u001b[31mReferenceError: name is not defined\u001b[39m\n    at x\n';
  const output = replaceErrorLine(
    raw,
    'ReferenceError: name is not defined',
    '🦜 ReferenceError: You call `name`'
  );

  assert.equal(output, '🦜 ReferenceError: You call `name`\n    at x\n');
});

test('run: keeps CRLF line endings', () => {
  const raw = 'file.js:1\r\n\r\nReferenceError: name is not defined\r\n    at x\r\n';
  const output = replaceErrorLine(
    raw,
    'ReferenceError: name is not defined',
    '🦜 ReferenceError: You call `name`'
  );

  assert.equal(output, 'file.js:1\r\n\r\n🦜 ReferenceError: You call `name`\r\n    at x\r\n');
});

test('run: leaves the buffer alone when the line is absent', () => {
  const raw = 'TypeError: greet is not a function\n    at x\n';
  assert.equal(
    replaceErrorLine(raw, 'ReferenceError: name is not defined', 'pidgin'),
    raw
  );
});
