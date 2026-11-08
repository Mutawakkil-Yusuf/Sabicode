'use strict';

const fs = require('node:fs');
const path = require('node:path');

const TONES = ['street', 'normal'];

function isTone(value) {
  return TONES.includes(value);
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

module.exports = { TONES, findRc, isTone, resolveTone };
