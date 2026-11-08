'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DICTIONARY_DIR = path.join(__dirname, '..', 'dictionary');

function loadDictionary(dir = DICTIONARY_DIR) {
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort();

  return files.map((file) => {
    const fullPath = path.join(dir, file);
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    return {
      ...data,
      file,
      fullPath,
      regex: new RegExp(data.match)
    };
  });
}

module.exports = { DICTIONARY_DIR, loadDictionary };
