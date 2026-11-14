'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const {
  collectFindings,
  findEslint,
  parseEslintJson,
  renderFinding,
  scanProject,
  summarize
} = require('../src/eslint');
const { loadEslintRules } = require('../src/dictionary');

const ROOT = path.join(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sabi.js');
const rules = loadEslintRules();

function tempDir(t, prefix = 'sabi-eslint-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function fakeEslint(
  t,
  { status = 1, results = [], stderr = '', version = '9.0.0', dir: providedDir } = {}
) {
  const dir = providedDir || tempDir(t);
  const packageDir = path.join(dir, 'node_modules', 'eslint');
  fs.mkdirSync(path.join(packageDir, 'bin'), { recursive: true });
  fs.writeFileSync(
    path.join(packageDir, 'package.json'),
    JSON.stringify({ name: 'eslint', version, bin: { eslint: './bin/eslint.js' } })
  );
  fs.writeFileSync(
    path.join(packageDir, 'bin', 'eslint.js'),
    `#!/usr/bin/env node
'use strict';
process.stdout.write(${JSON.stringify(JSON.stringify(results))});
process.stderr.write(${JSON.stringify(stderr)});
process.exit(${status});
`
  );
  return { dir, packageDir };
}

function finding(overrides = {}) {
  return {
    filePath: '/project/app.js',
    relativePath: 'app.js',
    line: 2,
    column: 13,
    severity: 2,
    ruleId: 'no-undef',
    message: "'name' is not defined.",
    fatal: false,
    ...overrides
  };
}

test('eslint: finds the project-local ESLint package', (t) => {
  const { dir, packageDir } = fakeEslint(t);
  const found = findEslint({ cwd: dir, env: {} });

  assert.equal(found.version, '9.0.0');
  assert.equal(found.packageDir, packageDir);
  assert.equal(found.binPath, path.join(packageDir, 'bin', 'eslint.js'));
});

test('eslint: returns null when the project has no ESLint', (t) => {
  const dir = tempDir(t);
  assert.equal(findEslint({ cwd: dir, env: {} }), null);
});

test('eslint: SABI_ESLINT accepts a package directory', (t) => {
  const { dir, packageDir } = fakeEslint(t);
  const found = findEslint({ cwd: dir, env: { SABI_ESLINT: packageDir } });

  assert.equal(found.version, '9.0.0');
});

test('eslint: a missing SABI_ESLINT path fails clearly', (t) => {
  const dir = tempDir(t);

  assert.throws(
    () => findEslint({ cwd: dir, env: { SABI_ESLINT: './nope' } }),
    /SABI_ESLINT points to "\.\/nope", but that path does not exist/
  );
});

test('eslint: parses JSON output and rejects bad output', () => {
  assert.deepEqual(parseEslintJson('[{"filePath":"a.js","messages":[]}]'), [
    { filePath: 'a.js', messages: [] }
  ]);
  assert.throws(() => parseEslintJson('not json'), /cannot read ESLint JSON/);
  assert.throws(() => parseEslintJson(''), /returned no JSON/);
  assert.throws(() => parseEslintJson('{}'), /not an array/);
});

test('eslint: maps known rules, parse errors, and unknown rules', () => {
  const results = [
    {
      filePath: '/project/app.js',
      messages: [
        { ruleId: 'no-undef', severity: 2, message: "'name' is not defined.", line: 2, column: 13 },
        { ruleId: null, severity: 2, fatal: true, message: 'Parsing error: Unexpected token ;', line: 1, column: 11 },
        { ruleId: 'no-console', severity: 1, message: 'Unexpected console statement.', line: 4, column: 1 },
        { ruleId: null, severity: 1, message: 'File ignored because of a matching ignore pattern.', line: 0, column: 0 }
      ]
    }
  ];

  const findings = collectFindings(results, rules, { cwd: '/project' });

  assert.equal(findings.length, 3);
  assert.equal(findings[0].ruleId, 'parse-error');
  assert.ok(findings[0].matched);
  assert.equal(findings[0].matched.captures[0], 'Unexpected token ;');
  assert.equal(findings[1].ruleId, 'no-undef');
  assert.equal(findings[1].relativePath, 'app.js');
  assert.equal(findings[1].matched.entry.id, 'no-undef');
  assert.equal(findings[2].ruleId, 'no-console');
  assert.equal(findings[2].matched, null);
  assert.equal(findings[2].severity, 'warning');
});

test('eslint: renders a covered rule with Pidgin and English', () => {
  const [matched] = collectFindings(
    [
      {
        filePath: '/project/app.js',
        messages: [{ ruleId: 'no-undef', severity: 2, message: "'name' is not defined.", line: 2, column: 13 }]
      }
    ],
    rules,
    { cwd: '/project' }
  );
  const output = renderFinding(matched, { tone: 'street', emoji: false });

  assert.match(output, /^app\.js:2:13 {2}error {2}no-undef/m);
  assert.match(output, /\[Polly\] You use `name`, but e no dey defined/);
  assert.match(output, /Wetin happen:/);
  assert.match(output, /English: 'name' is not defined\./);
  assert.doesNotMatch(output, /\[Polly\] Wetin happen:/);
});

test('eslint: unknown rules get a generic Pidgin explanation', () => {
  const output = renderFinding(
    finding({ ruleId: 'no-console', message: 'Unexpected console statement.', severity: 'warning' }),
    { tone: 'normal', emoji: false }
  );

  assert.match(output, /\[Polly\] ESLint flagged this code with `no-console`/);
  assert.match(output, /English: Unexpected console statement\./);
});

test('eslint: summarize limits output and reports counts', () => {
  const findings = Array.from({ length: 12 }, (_, index) =>
    finding({ line: index + 1, ruleId: 'no-undef' })
  );
  const limited = summarize(findings, { all: false, limit: 10 });
  const full = summarize(findings, { all: true });

  assert.match(limited, /Showing first 10/);
  assert.equal((limited.match(/app\.js:\d+:13/g) || []).length, 10);
  assert.doesNotMatch(full, /Showing first/);
  assert.equal((full.match(/app\.js:\d+:13/g) || []).length, 12);
  assert.match(full, /ESLint found 12 problems \(12 errors, 0 warnings\) in 1 file\./);
});

test('eslint: scanProject forwards tone, color, and emoji settings', (t) => {
  const { dir } = fakeEslint(t, {
    status: 1,
    results: [
      {
        filePath: path.join('/project', 'app.js'),
        messages: [{ ruleId: 'no-undef', severity: 2, message: "'name' is not defined.", line: 2, column: 13 }]
      }
    ]
  });

  const normal = scanProject({
    cwd: dir,
    paths: ['app.js'],
    rules,
    tone: 'normal',
    emoji: false,
    color: false
  });

  assert.match(normal.output, /\[Polly\] ESLint no see where `name` dey defined/);
  assert.match(normal.output, /Check the spelling, or define\/import am first/);
});

test('eslint: scanProject preserves the ESLint exit code', (t) => {
  const results = [
    {
      filePath: path.join('/project', 'app.js'),
      messages: [{ ruleId: 'no-undef', severity: 2, message: "'name' is not defined.", line: 2, column: 13 }]
    }
  ];
  const failing = fakeEslint(t, { status: 1, results });
  const warning = fakeEslint(t, {
    status: 0,
    results: [
      {
        filePath: path.join('/project', 'app.js'),
        messages: [{ ruleId: 'no-unused-vars', severity: 1, message: "'x' is defined but never used.", line: 1, column: 7 }]
      }
    ]
  });

  const failResult = scanProject({ cwd: failing.dir, paths: ['app.js'], rules, color: false });
  const warnResult = scanProject({ cwd: warning.dir, paths: ['app.js'], rules, color: false });

  assert.equal(failResult.code, 1);
  assert.match(failResult.output, /no-undef/);
  assert.equal(warnResult.code, 0);
  assert.match(warnResult.output, /1 warning/);
});

test('eslint: scanProject reports missing ESLint and config errors', (t) => {
  const empty = tempDir(t);
  const missing = scanProject({ cwd: empty, rules });
  const broken = fakeEslint(t, { status: 2, stderr: 'ESLint could not find a config file.' });
  const failed = scanProject({ cwd: broken.dir, paths: ['app.js'], rules });
  const badPath = scanProject({ cwd: empty, rules, env: { SABI_ESLINT: './nope' } });

  assert.equal(missing.code, 2);
  assert.match(missing.error, /ESLint is not installed/);
  assert.equal(failed.code, 2);
  assert.match(failed.error, /ESLint could not run/);
  assert.match(failed.error, /could not find a config file/);
  assert.equal(badPath.code, 2);
  assert.match(badPath.error, /SABI_ESLINT points to "\.\/nope"/);
});

test('eslint: the CLI scan command uses SABI_ESLINT and preserves the code', (t) => {
  const dir = tempDir(t);
  const { packageDir } = fakeEslint(t, {
    dir,
    status: 1,
    results: [
      {
        filePath: path.join(dir, 'app.js'),
        messages: [{ ruleId: 'no-undef', severity: 2, message: "'name' is not defined.", line: 2, column: 13 }]
      }
    ]
  });
  fs.writeFileSync(path.join(dir, 'app.js'), 'console.log(name);\n');

  const env = { ...process.env, SABI_ESLINT: packageDir, NO_COLOR: '1' };
  delete env.SABI_MODE;
  delete env.SABI_TONE;

  const result = spawnSync(process.execPath, [BIN, 'scan', 'app.js'], {
    cwd: dir,
    encoding: 'utf8',
    env
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /app\.js:2:13 {2}error {2}no-undef/);
  assert.match(result.stdout, /You use `name`, but e no dey defined/);
  assert.match(result.stdout, /ESLint found 1 problem/);
  assert.equal(result.stderr, '');
});

test('eslint: the CLI scan command accepts flags after paths', (t) => {
  const dir = tempDir(t);
  const messages = Array.from({ length: 12 }, (_, index) => ({
    ruleId: 'no-undef',
    severity: 2,
    message: "'name' is not defined.",
    line: index + 1,
    column: 1
  }));
  const { packageDir } = fakeEslint(t, {
    dir,
    status: 1,
    results: [{ filePath: path.join(dir, 'app.js'), messages }]
  });
  fs.writeFileSync(path.join(dir, 'app.js'), 'console.log(name);\n');

  const env = { ...process.env, SABI_ESLINT: packageDir, NO_COLOR: '1' };
  delete env.SABI_MODE;
  delete env.SABI_TONE;

  const result = spawnSync(
    process.execPath,
    [BIN, 'scan', 'app.js', '--all', '--tone=normal', '--no-emoji'],
    { cwd: dir, encoding: 'utf8', env }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[Polly\] ESLint no see where `name` dey defined/);
  assert.equal((result.stdout.match(/app\.js:\d+:1/g) || []).length, 12);
  assert.doesNotMatch(result.stdout, /Showing first/);
});
