'use strict';

const fs = require('node:fs');
const path = require('node:path');

const TONES = ['street', 'normal'];
const MODES = ['pidgin-first', 'append', 'raw'];
const DEFAULT_MODE = 'pidgin-first';

function isTone(value) {
  return TONES.includes(value);
}

function isMode(value) {
  return MODES.includes(value);
}

function findRc(startDir) {
  let dir = path.resolve(startDir || process.cwd());

  while (true) {
    const candidate = path.join(dir, '.sabirc');
    if (fs.existsSync(candidate)) return candidate;

    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function validateTone(value, source, warn) {
  if (isTone(value)) return value;

  warn(
    `sabi: invalid tone ${JSON.stringify(value)} from ${source}; ` +
      'expected "street" or "normal". Using "street".'
  );
  return 'street';
}

function validateMode(value, source, warn) {
  if (isMode(value)) return value;

  warn(
    `sabi: invalid mode ${JSON.stringify(value)} from ${source}; ` +
      `expected "pidgin-first", "append", or "raw". Using "${DEFAULT_MODE}".`
  );
  return DEFAULT_MODE;
}

function resolveMode({ flag, env = process.env, warn = () => {} } = {}) {
  if (flag !== undefined) {
    return validateMode(flag, '--mode', warn);
  }

  if (env.SABI_MODE !== undefined) {
    return validateMode(env.SABI_MODE, 'SABI_MODE', warn);
  }

  return DEFAULT_MODE;
}

function resolveTone({ flag, env = process.env, cwd = process.cwd(), warn = () => {} } = {}) {
  if (flag !== undefined) {
    return validateTone(flag, '--tone', warn);
  }

  if (env.SABI_TONE !== undefined) {
    return validateTone(env.SABI_TONE, 'SABI_TONE', warn);
  }

  const rcPath = findRc(cwd);
  if (rcPath) {
    let config;

    try {
      config = JSON.parse(fs.readFileSync(rcPath, 'utf8'));
    } catch (error) {
      warn(`sabi: could not read ${rcPath}: ${error.message}. Using "street".`);
      return 'street';
    }

    if (config && typeof config === 'object' && config.tone !== undefined) {
      return validateTone(config.tone, rcPath, warn);
    }
  }

  return 'street';
}

module.exports = {
  DEFAULT_MODE,
  MODES,
  TONES,
  findRc,
  isMode,
  isTone,
  resolveMode,
  resolveTone
};
