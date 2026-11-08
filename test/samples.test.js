'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDictionary } = require('../src/dictionary');

const entries = loadDictionary();

for (const entry of entries) {
  for (const sample of entry.samples) {
    test(`sample belongs only to ${entry.id}: ${sample}`, () => {
      const own = new RegExp(entry.match);
      assert.match(sample, own, 'sample must match its own entry');

      for (const other of entries) {
        if (other.id === entry.id) continue;
        const otherMatch = new RegExp(other.match);
        assert.doesNotMatch(
          sample,
          otherMatch,
          `sample also matches ${other.id}; entries must not collide`
        );
      }
    });
  }
}
