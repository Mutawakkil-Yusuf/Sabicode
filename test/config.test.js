'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DEFAULT_MODE, resolveMode, resolveTone } = require('../src/config');

function tempProject(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sabi-config-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('config: flag beats env and .sabirc', (t) => {
  const dir = tempProject(t);
  fs.writeFileSync(path.join(dir, '.sabirc'), JSON.stringify({ tone: 'street' }));

  assert.equal(
    resolveTone({ flag: 'normal', env: { SABI_TONE: 'street' }, cwd: dir }),
    'normal'
  );
});

test('config: env beats .sabirc', (t) => {
  const dir = tempProject(t);
  fs.writeFileSync(path.join(dir, '.sabirc'), JSON.stringify({ tone: 'street' }));

  assert.equal(resolveTone({ env: { SABI_TONE: 'normal' }, cwd: dir }), 'normal');
});

test('config: .sabirc is found in a parent directory', (t) => {
  const dir = tempProject(t);
  const deep = path.join(dir, 'one', 'two', 'three');
  fs.mkdirSync(deep, { recursive: true });
  fs.writeFileSync(path.join(dir, '.sabirc'), JSON.stringify({ tone: 'normal' }));

  assert.equal(resolveTone({ env: {}, cwd: deep }), 'normal');
});

test('config: invalid tone warns once and falls back to street', (t) => {
  const dir = tempProject(t);
  fs.writeFileSync(path.join(dir, '.sabirc'), JSON.stringify({ tone: 'normal' }));
  const warnings = [];

  const tone = resolveTone({
    flag: 'loud',
    env: { SABI_TONE: 'normal' },
    cwd: dir,
    warn: (message) => warnings.push(message)
  });

  assert.equal(tone, 'street');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /invalid tone/);
  assert.match(warnings[0], /street/);
});

test('config: invalid env falls back to street without checking .sabirc', (t) => {
  const dir = tempProject(t);
  fs.writeFileSync(path.join(dir, '.sabirc'), JSON.stringify({ tone: 'normal' }));
  const warnings = [];

  assert.equal(
    resolveTone({ env: { SABI_TONE: 'loud' }, cwd: dir, warn: (m) => warnings.push(m) }),
    'street'
  );
  assert.equal(warnings.length, 1);
});

test('config: missing config defaults to street', (t) => {
  const dir = tempProject(t);
  assert.equal(resolveTone({ env: {}, cwd: dir }), 'street');
});

test('config: mode defaults to pidgin-first', () => {
  assert.equal(DEFAULT_MODE, 'pidgin-first');
  assert.equal(resolveMode({ env: {} }), 'pidgin-first');
});

test('config: mode flag beats env', () => {
  assert.equal(resolveMode({ flag: 'raw', env: { SABI_MODE: 'append' } }), 'raw');
});

test('config: SABI_MODE is used when no flag is given', () => {
  assert.equal(resolveMode({ env: { SABI_MODE: 'append' } }), 'append');
});

test('config: invalid mode warns and falls back to pidgin-first', () => {
  const warnings = [];
  const mode = resolveMode({
    flag: 'loud',
    env: { SABI_MODE: 'raw' },
    warn: (message) => warnings.push(message)
  });

  assert.equal(mode, 'pidgin-first');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /invalid mode "loud"/);
  assert.match(warnings[0], /pidgin-first/);
});

test('config: malformed .sabirc warns and defaults to street', (t) => {
  const dir = tempProject(t);
  fs.writeFileSync(path.join(dir, '.sabirc'), '{ not json');
  const warnings = [];

  assert.equal(resolveTone({ env: {}, cwd: dir, warn: (m) => warnings.push(m) }), 'street');
  assert.equal(warnings.length, 1);
});
