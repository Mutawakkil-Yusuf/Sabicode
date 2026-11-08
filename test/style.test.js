'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDictionary } = require('../src/dictionary');

const entries = loadDictionary();
const TONES = ['street', 'normal'];

const banned = [
  { pattern: /\bu\b/i, label: 'text-speak "u"' },
  { pattern: /\bur\b/i, label: 'text-speak "ur"' },
  { pattern: /\bpls\b/i, label: 'text-speak "pls"' },
  { pattern: /you\s+forgot/i, label: 'blame phrasing "you forgot"' },
  { pattern: /your\s+fault/i, label: 'blame phrasing "your fault"' },
  { pattern: /\b(dull|stupid|idiot|lazy|careless)\b/i, label: 'blaming language' }
];

for (const entry of entries) {
  test(`style: ${entry.id}`, () => {
    for (const tone of TONES) {
      for (const key of ['happen', 'todo', 'learn']) {
        const text = entry.tone[tone][key];
        for (const rule of banned) {
          assert.doesNotMatch(text, rule.pattern, `${tone}.${key} uses banned ${rule.label}`);
        }
      }
    }
  });
}
