'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DICTIONARY_DIR = path.join(__dirname, '..', 'dictionary');

// Presentation order for the demo and `sabi list`. Unknown ids sort after these.
const ENTRY_ORDER = [
  'ref-not-defined',
  'undefined-property',
  'not-a-function',
  'unexpected-end',
  'const-assign',
  'module-not-found-package',
  'module-not-found-path',
  'already-declared',
  'unexpected-token',
  'invalid-token',
  'tdz'
];

function loadDictionary(dir = DICTIONARY_DIR) {
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort();

  return files
    .map((file) => {
      const fullPath = path.join(dir, file);
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      return {
        ...data,
        file,
        fullPath,
        regex: new RegExp(data.match)
      };
    })
    .sort((a, b) => {
      const aIndex = ENTRY_ORDER.indexOf(a.id);
      const bIndex = ENTRY_ORDER.indexOf(b.id);
      const aRank = aIndex === -1 ? ENTRY_ORDER.length : aIndex;
      const bRank = bIndex === -1 ? ENTRY_ORDER.length : bIndex;
      return aRank - bRank || a.id.localeCompare(b.id);
    });
}

module.exports = { DICTIONARY_DIR, loadDictionary };
