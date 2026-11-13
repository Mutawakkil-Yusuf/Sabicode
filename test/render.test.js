'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadDictionary } = require('../src/dictionary');
const { matchError } = require('../src/match');
const {
  renderBlock,
  renderHeadline,
  renderPidginFirst,
  renderUnknown,
  renderUnknownHeadline,
  renderUnknownPidginFirst,
  resolveColor,
  wrapText
} = require('../src/render');

const goldenDir = path.join(__dirname, 'golden');
const golden = (name) =>
  fs.readFileSync(path.join(goldenDir, name), 'utf8').replace(/\r\n/g, '\n');
const entries = loadDictionary();
const entry = entries.find((item) => item.id === 'ref-not-defined');
const result = matchError(entry.samples[0], entries);

test('renderer: street tone, non-TTY (golden)', () => {
  assert.equal(renderBlock(entry, result.captures, { tone: 'street' }), golden('ref-street-nocolor.txt'));
});

test('renderer: street tone, TTY color (golden)', () => {
  assert.equal(
    renderBlock(entry, result.captures, { tone: 'street', color: true }),
    golden('ref-street-color.txt')
  );
});

test('renderer: normal tone, non-TTY (golden)', () => {
  assert.equal(renderBlock(entry, result.captures, { tone: 'normal' }), golden('ref-normal-nocolor.txt'));
});

test('renderer: normal tone, TTY color (golden)', () => {
  assert.equal(
    renderBlock(entry, result.captures, { tone: 'normal', color: true }),
    golden('ref-normal-color.txt')
  );
});

test('renderer: no emoji (golden)', () => {
  assert.equal(
    renderBlock(entry, result.captures, { tone: 'street', emoji: false }),
    golden('ref-street-noemoji.txt')
  );
});

test('renderer: unknown error line uses the selected tone', () => {
  assert.equal(renderUnknown('street'), golden('unknown-street-nocolor.txt'));
  assert.equal(renderUnknown('normal'), golden('unknown-normal-nocolor.txt'));
});

test('renderer: pidgin-first headline includes the error name', () => {
  assert.equal(
    renderHeadline(entry, result.captures, {
      tone: 'street',
      errorLabel: 'ReferenceError'
    }),
    '🦜 ReferenceError: You call `name`, but JavaScript no sabi am'
  );
});

test('renderer: headline uses [Polly] without emoji', () => {
  assert.match(
    renderHeadline(entry, result.captures, {
      tone: 'street',
      emoji: false,
      errorLabel: 'ReferenceError'
    }),
    /^\[Polly\] ReferenceError: /
  );
});

test('renderer: block keeps the English line before the closer', () => {
  const output = renderBlock(entry, result.captures, {
    tone: 'street',
    english: 'ReferenceError: name is not defined'
  });

  assert.match(output, /English: ReferenceError: name is not defined/);
  assert.ok(output.indexOf('English:') < output.indexOf('Polly:'));
});

test('renderer: pidgin-first composes headline and block without a second mascot', () => {
  const output = renderPidginFirst(entry, result.captures, {
    tone: 'street',
    errorLabel: 'ReferenceError',
    english: 'ReferenceError: name is not defined'
  });

  assert.match(output, /^🦜 ReferenceError: You call `name`/);
  assert.match(output, /   Wetin happen:/);
  assert.doesNotMatch(output, /🦜 Wetin happen:/);
  assert.match(output, /English: ReferenceError: name is not defined/);
});

test('renderer: unknown pidgin-first uses a generic headline', () => {
  const output = renderUnknownPidginFirst('street', {
    errorLabel: 'RangeError',
    english: 'RangeError: boom'
  });

  assert.match(output, /^🦜 RangeError: This one na new to me/);
  assert.match(output, /English: RangeError: boom/);
  assert.match(renderUnknownHeadline('normal', { errorLabel: 'RangeError' }), /^🦜 RangeError: /);
});

test('renderer: NO_COLOR and --no-color disable color on a TTY', () => {
  assert.equal(resolveColor({ env: { NO_COLOR: '1' }, isTTY: true }), false);
  assert.equal(resolveColor({ env: { NO_COLOR: '' }, isTTY: true }), false);
  assert.equal(resolveColor({ noColor: true, env: {}, isTTY: true }), false);
  assert.equal(resolveColor({ env: {}, isTTY: false }), false);
  assert.equal(resolveColor({ env: {}, isTTY: true }), true);
});

test('renderer: every line wraps within 80 columns', () => {
  for (const item of entries) {
    const matched = matchError(item.samples[0], entries);
    for (const tone of ['street', 'normal']) {
      const output = renderBlock(item, matched.captures, { tone });
      for (const line of output.split('\n')) {
        assert.ok(line.length <= 80, `${item.id} ${tone} line is ${line.length} characters: ${line}`);
      }
    }
  }
});

test('renderer: wrapText keeps inline code together', () => {
  const lines = wrapText('Use `let name = "Ada";` here', 20, 20);
  assert.ok(lines.join(' ').includes('`let name = "Ada";`'));
  assert.ok(lines.every((line) => line.length <= 20));
});
