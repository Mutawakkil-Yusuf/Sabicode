'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDictionary } = require('../src/dictionary');

const entries = loadDictionary();
const TONES = ['street', 'normal'];

test('the dictionary has all 11 entries', () => {
  assert.equal(entries.length, 11);
});

for (const entry of entries) {
  test(`schema: ${entry.id}`, () => {
    assert.equal(entry.id, entry.file.replace(/\.json$/, ''), 'id must equal the filename');
    assert.equal(typeof entry.match, 'string');
    assert.doesNotThrow(() => new RegExp(entry.match), 'match must compile');
    assert.ok(Array.isArray(entry.samples) && entry.samples.length >= 1, 'at least one sample');
    assert.ok(entry.samples.every((sample) => typeof sample === 'string' && sample.length > 0));
    assert.equal(entry.reviewed, false, 'entries stay unreviewed until a Pidgin speaker signs off');

    for (const tone of TONES) {
      assert.ok(entry.tone && entry.tone[tone], `missing ${tone} tone`);
      for (const key of ['happen', 'todo', 'learn']) {
        assert.equal(typeof entry.tone[tone][key], 'string', `${tone}.${key} must be a string`);
        assert.ok(entry.tone[tone][key].trim().length > 0, `${tone}.${key} must not be empty`);
      }
    }

    if (entry.fix_code !== undefined) {
      assert.equal(typeof entry.fix_code, 'string');
      assert.ok(entry.fix_code.trim().length > 0);
    }

    assert.equal(typeof entry.what, 'string', 'plain-English what paragraph for the site');
    assert.ok(entry.what.trim().length > 0);
  });
}
