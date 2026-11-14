'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { reviewState } = require('./review');

const DICTIONARY_DIR = path.join(__dirname, '..', 'dictionary');
const ESLINT_DIR = path.join(__dirname, '..', 'eslint');

// Presentation order for the demo and `sabi list`. Unknown ids sort after these.
const ENTRY_ORDER = [
  'ref-not-defined',
  'undefined-property',
  'not-a-function',
  'unexpected-end',
  'const-assign',
  'module-not-found-package',
  'module-not-found-path',
  'import-outside-module',
  'already-declared',
  'unexpected-token',
  'invalid-token',
  'tdz',
  'await-outside-async',
  'max-call-stack',
  'not-iterable',
  'json-parse',
  'enoent'
];

function loadEntries(dir, order = []) {
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort();

  return files
    .map((file) => {
      const fullPath = path.join(dir, file);
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const state = reviewState(data);
      return {
        ...data,
        file,
        fullPath,
        regex: new RegExp(data.match),
        currentHash: state.currentHash,
        reviewed: state.reviewed,
        reviewStatus: state.status
      };
    })
    .sort((a, b) => {
      const aIndex = order.indexOf(a.id);
      const bIndex = order.indexOf(b.id);
      const aRank = aIndex === -1 ? order.length : aIndex;
      const bRank = bIndex === -1 ? order.length : bIndex;
      return aRank - bRank || a.id.localeCompare(b.id);
    });
}

function loadDictionary(dir = DICTIONARY_DIR) {
  return loadEntries(dir, ENTRY_ORDER);
}

function loadEslintRules(dir = ESLINT_DIR) {
  return loadEntries(dir);
}

module.exports = { DICTIONARY_DIR, ESLINT_DIR, loadDictionary, loadEslintRules };
