'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadEslintRules } = require('./dictionary');
const { renderBlock, renderHeadline } = require('./render');

const DEFAULT_LIMIT = 10;
const MAX_BUFFER = 64 * 1024 * 1024;

const SCAN_CLOSERS = {
  street: 'Oya, fix am.',
  normal: 'Fix am, then run `sabi scan` again.'
};

const GENERIC_RULE = {
  id: 'eslint-generic',
  language: 'javascript',
  fix_code: null,
  tone: {
    street: {
      headline: 'ESLint catch one problem: `{1}`',
      happen:
        'ESLint rule `{1}` flag this code. Sabicode never get a full Pidgin explanation for this rule yet, so check the English message below.',
      todo: 'Fix the code, or read the rule docs. Run `sabi rules` to see the rules wey get Pidgin.',
      learn: 'The rule id na the English name for the check wey ESLint run.'
    },
    normal: {
      headline: 'ESLint flagged this code with `{1}`',
      happen:
        'ESLint rule `{1}` flagged this code. Sabicode does not have a full Pidgin explanation for this rule yet, so check the English message below.',
      todo: 'Fix the code, or read the rule docs. Run `sabi rules` to see the rules wey get Pidgin.',
      learn: 'The rule id na the English name for the check wey ESLint run.'
    }
  }
};

function readPackageBin(packageJsonPath) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const bin = pkg && pkg.bin;

  let relative = null;
  if (typeof bin === 'string') {
    relative = bin;
  } else if (bin && typeof bin === 'object') {
    relative = bin.eslint;
  }

  if (typeof relative !== 'string' || relative.trim() === '') {
    throw new Error(`cannot find the eslint binary in ${packageJsonPath}`);
  }

  return {
    binPath: path.resolve(path.dirname(packageJsonPath), relative),
    packageDir: path.dirname(packageJsonPath),
    version: typeof pkg.version === 'string' ? pkg.version : null
  };
}

function fromExplicitPath(value, cwd) {
  const target = path.resolve(cwd, value);

  if (!fs.existsSync(target)) {
    throw new Error(`SABI_ESLINT points to "${value}", but that path does not exist`);
  }

  const stats = fs.statSync(target);
  if (stats.isDirectory()) {
    return readPackageBin(path.join(target, 'package.json'));
  }

  if (path.basename(target) === 'package.json') {
    return readPackageBin(target);
  }

  return { binPath: target, packageDir: path.dirname(target), version: null };
}

// Finds the ESLint already installed for the project. Sabicode never installs
// or bundles ESLint, and it never reaches the network.
function findEslint({ cwd = process.cwd(), env = process.env } = {}) {
  if (env.SABI_ESLINT) {
    return fromExplicitPath(env.SABI_ESLINT, cwd);
  }

  let packageJsonPath;
  try {
    packageJsonPath = require.resolve('eslint/package.json', { paths: [cwd] });
  } catch {
    return null;
  }

  const found = readPackageBin(packageJsonPath);
  if (!fs.existsSync(found.binPath)) {
    throw new Error(`ESLint is installed, but its binary is missing at ${found.binPath}`);
  }

  return found;
}

function parseEslintJson(stdout, stderr = '') {
  const text = String(stdout || '').trim();
  if (text === '') {
    throw new Error(`ESLint returned no JSON.${stderr ? `\n${stderr.trim()}` : ''}`);
  }

  let results;
  try {
    results = JSON.parse(text);
  } catch (error) {
    throw new Error(`cannot read ESLint JSON: ${error.message}`);
  }

  if (!Array.isArray(results)) {
    throw new Error('ESLint JSON was not an array of file results');
  }

  return results;
}

function displayPath(cwd, filePath) {
  const relative = path.relative(cwd, filePath);
  if (relative === '') return path.basename(filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return filePath;
  return relative;
}

function collectFindings(results, rules, { cwd = process.cwd() } = {}) {
  const byId = new Map(rules.map((entry) => [entry.id, entry]));
  const findings = [];

  for (const file of results) {
    if (!file || typeof file !== 'object') continue;

    for (const message of file.messages || []) {
      if (!message || typeof message !== 'object') continue;

      const ruleId = message.ruleId || (message.fatal ? 'parse-error' : null);
      // ESLint also reports non-rule notices such as ignored-file warnings.
      if (!ruleId) continue;

      const entry = byId.get(ruleId) || null;
      let matched = null;

      if (entry) {
        const match = entry.regex.exec(message.message);
        if (match) {
          matched = {
            entry,
            captures: match.slice(1).map((value) => (value === undefined ? '' : value))
          };
        }
      }

      findings.push({
        filePath: file.filePath,
        relativePath: displayPath(cwd, file.filePath),
        line: Number(message.line) || 0,
        column: Number(message.column) || 0,
        severity: message.severity === 1 ? 'warning' : 'error',
        ruleId,
        message: String(message.message || ''),
        fatal: Boolean(message.fatal),
        matched
      });
    }
  }

  findings.sort(
    (a, b) =>
      a.relativePath.localeCompare(b.relativePath) ||
      a.line - b.line ||
      a.column - b.column ||
      a.ruleId.localeCompare(b.ruleId)
  );

  return findings;
}

function plural(count, word) {
  return count === 1 ? word : `${word}s`;
}

function severityLabel(finding) {
  return finding.severity === 1 || finding.severity === 'warning' ? 'warning' : 'error';
}

function renderFinding(finding, { tone = 'street', color = false, emoji = true } = {}) {
  const source = finding.matched ? finding.matched.entry : GENERIC_RULE;
  const captures = finding.matched ? finding.matched.captures : [finding.ruleId];
  const headline = renderHeadline(source, captures, { tone, color, emoji });
  const block = renderBlock(source, captures, {
    tone,
    color,
    emoji,
    showMascot: false,
    english: finding.message,
    closer: SCAN_CLOSERS[tone === 'normal' ? 'normal' : 'street']
  });
  const location = `${finding.relativePath}:${finding.line}:${finding.column}`;
  const label = `${location}  ${severityLabel(finding)}  ${finding.ruleId}`;

  return `${label}\n${headline}\n${block.replace(/^\n/, '')}`;
}

function summarize(
  findings,
  { all = false, limit = DEFAULT_LIMIT, tone = 'street', color = false, emoji = true } = {}
) {
  if (findings.length === 0) return 'ESLint found no problems.\n';

  const shown = all ? findings : findings.slice(0, limit);
  const errors = findings.filter((finding) => severityLabel(finding) === 'error').length;
  const warnings = findings.length - errors;
  const files = new Set(findings.map((finding) => finding.filePath)).size;
  const lines = shown.map((finding) => renderFinding(finding, { tone, color, emoji }));

  lines.push('');
  lines.push(
    `ESLint found ${findings.length} ${plural(findings.length, 'problem')} ` +
      `(${errors} ${plural(errors, 'error')}, ${warnings} ${plural(warnings, 'warning')}) ` +
      `in ${files} ${plural(files, 'file')}.`
  );

  if (!all && findings.length > shown.length) {
    lines.push(`Showing first ${shown.length}. Run "sabi scan --all" to see the rest.`);
  }

  return `${lines.join('\n')}\n`;
}

function runEslint({ eslint, cwd, paths, env = process.env }) {
  const args = [eslint.binPath, '--format', 'json', '--no-color', ...paths];
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    env: { ...env, FORCE_COLOR: '0' },
    maxBuffer: MAX_BUFFER
  });

  if (result.error) throw result.error;
  return result;
}

function scanProject({
  cwd = process.cwd(),
  env = process.env,
  paths = ['.'],
  rules = loadEslintRules(),
  all = false,
  limit = DEFAULT_LIMIT,
  tone = 'street',
  color = false,
  emoji = true
} = {}) {
  let eslint;
  try {
    eslint = findEslint({ cwd, env });
  } catch (error) {
    return { code: 2, output: '', error: `${error.message}\n` };
  }

  if (!eslint) {
    return {
      code: 2,
      output: '',
      error:
        'ESLint is not installed for this project. Install it with ' +
        '"npm install --save-dev eslint", or point Sabicode at a local copy ' +
        'with SABI_ESLINT=/path/to/eslint.\n'
    };
  }

  const result = runEslint({ eslint, cwd, paths, env });

  if (result.status === 2) {
    return {
      code: 2,
      output: '',
      error:
        `ESLint could not run.\n${(result.stderr || result.stdout || '').trim()}\n`.trimEnd() + '\n'
    };
  }

  let results;
  try {
    results = parseEslintJson(result.stdout, result.stderr);
  } catch (error) {
    return { code: 2, output: '', error: `${error.message}\n` };
  }

  const findings = collectFindings(results, rules, { cwd });
  const output = summarize(findings, { all, limit, tone, color, emoji });

  return { code: result.status === 1 ? 1 : 0, output, error: '', findings, eslint };
}

module.exports = {
  DEFAULT_LIMIT,
  GENERIC_RULE,
  SCAN_CLOSERS,
  collectFindings,
  findEslint,
  parseEslintJson,
  renderFinding,
  runEslint,
  scanProject,
  summarize
};
