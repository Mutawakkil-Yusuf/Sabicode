'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sabi.js');

function run(args, options = {}) {
  const env = { ...process.env };
  delete env.SABI_TONE;
  delete env.NO_COLOR;
  Object.assign(env, options.env || {});

  return spawnSync(process.execPath, [BIN, ...args], {
    cwd: options.cwd || ROOT,
    encoding: 'utf8',
    env
  });
}

test('CLI: --help', () => {
  const result = run(['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--tone=street\|normal/);
});

test('CLI: --version', () => {
  const result = run(['--version']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), require('../package.json').version);
});

test('CLI: unknown option fails clearly', () => {
  const result = run(['--wat', 'app.js']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown option "--wat"/);
  assert.match(result.stderr, /sabi --help/);
});

test('CLI: missing script fails clearly', () => {
  const result = run([]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no script given/);
});

test('CLI: missing file fails clearly', () => {
  const result = run(['test/fixtures/not-here.js']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /cannot find "test\/fixtures\/not-here\.js"/);
});

test('CLI: list shows every entry and reviewed flag', () => {
  const result = run(['list']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Covered errors: 11/);
  assert.match(result.stdout, /ref-not-defined\s+no/);
  assert.match(result.stdout, /tdz\s+no/);
  assert.equal(result.stderr, '');
});

test('CLI: invalid tone warns and falls back to street', () => {
  const result = run(['--tone=loud', 'test/fixtures/ref-not-defined.js']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid tone "loud"/);
  assert.match(result.stderr, /You dey call `name`/);
});

test('CLI: SABI_TONE is used when no flag is given', () => {
  const result = run(['test/fixtures/ref-not-defined.js'], { env: { SABI_TONE: 'normal' } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /You dey use `name`/);
});

test('CLI: .sabirc in a parent directory sets the tone', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sabi-cli-'));
  const deep = path.join(dir, 'nested', 'dir');
  fs.mkdirSync(deep, { recursive: true });
  fs.writeFileSync(path.join(dir, '.sabirc'), JSON.stringify({ tone: 'normal' }));

  const result = run([path.join(ROOT, 'test', 'fixtures', 'ref-not-defined.js')], { cwd: deep });
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  assert.equal(result.status, 1);
  assert.match(result.stderr, /You dey use `name`/);
});

test('CLI: script paths with spaces work', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sabi space '));
  const script = path.join(dir, 'my script.js');
  fs.copyFileSync(path.join(ROOT, 'test', 'fixtures', 'passing.js'), script);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const result = run([script]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /sabicode: all good/);
});
