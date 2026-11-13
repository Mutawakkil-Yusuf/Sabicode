'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConcepts } = require('../src/concepts');
const { loadDictionary } = require('../src/dictionary');

const entries = loadDictionary();
const concepts = loadConcepts();
const conceptIds = new Set(concepts.map((concept) => concept.id));
const TONES = ['street', 'normal'];

test('the dictionary has all 17 entries', () => {
  assert.equal(entries.length, 17);
});

for (const entry of entries) {
  test(`schema: ${entry.id}`, () => {
    assert.equal(entry.id, entry.file.replace(/\.json$/, ''), 'id must equal the filename');
    assert.ok(['javascript'].includes(entry.language), `unsupported language ${entry.language}`);
    assert.ok(conceptIds.has(entry.concept), `unknown concept ${entry.concept}`);
    assert.equal(typeof entry.match, 'string');
    assert.doesNotThrow(() => new RegExp(entry.match), 'match must compile');
    assert.ok(Array.isArray(entry.samples) && entry.samples.length >= 1, 'at least one sample');
    assert.ok(entry.samples.every((sample) => typeof sample === 'string' && sample.length > 0));

    assert.ok(entry.review && typeof entry.review === 'object', 'review record');
    assert.ok(['draft', 'reviewed'].includes(entry.review.status), 'review status');
    assert.ok(Array.isArray(entry.review.reviewers), 'reviewers array');

    for (const reviewer of entry.review.reviewers) {
      assert.equal(typeof reviewer.name, 'string', 'reviewer name');
      assert.ok(reviewer.name.trim().length > 0, 'reviewer name must not be empty');
      assert.match(reviewer.date, /^\d{4}-\d{2}-\d{2}$/, 'reviewer date must be YYYY-MM-DD');
      if (reviewer.github !== undefined) {
        assert.equal(typeof reviewer.github, 'string');
        assert.ok(reviewer.github.trim().length > 0, 'reviewer github must not be empty');
      }
    }

    assert.ok(
      entry.review.contentHash === null ||
        /^sha256:[a-f0-9]{64}$/.test(entry.review.contentHash),
      'contentHash must be null or a sha256 digest'
    );
    assert.equal(typeof entry.reviewed, 'boolean');
    assert.ok(['draft', 'reviewed', 'stale'].includes(entry.reviewStatus));

    if (entry.review.status === 'reviewed') {
      assert.ok(entry.review.reviewers.length > 0, 'reviewed entries need a reviewer');
      assert.notEqual(
        entry.reviewStatus,
        'stale',
        'reviewed entry is stale; re-review it or reset the review'
      );
      assert.equal(entry.review.contentHash, entry.currentHash, 'review must match current content');
      assert.equal(entry.reviewStatus, 'reviewed');
    } else {
      assert.equal(entry.reviewStatus, 'draft');
    }

    for (const tone of TONES) {
      assert.ok(entry.tone && entry.tone[tone], `missing ${tone} tone`);
      for (const key of ['headline', 'happen', 'todo', 'learn']) {
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

test('every concept has at least one entry', () => {
  const used = new Set(entries.map((entry) => entry.concept));

  for (const concept of concepts) {
    assert.ok(used.has(concept.id), `concept ${concept.id} has no entries`);
  }
});
