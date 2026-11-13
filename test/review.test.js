'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { contentHash, reviewState } = require('../src/review');

function makeEntry() {
  return {
    id: 'example',
    match: '^Error: example',
    samples: ['Error: example'],
    fix_code: 'fix()',
    review: {
      status: 'draft',
      reviewers: [],
      contentHash: null
    },
    tone: {
      street: {
        headline: 'Street headline',
        happen: 'Street happen',
        todo: 'Street todo',
        learn: 'Street learn'
      },
      normal: {
        headline: 'Normal headline',
        happen: 'Normal happen',
        todo: 'Normal todo',
        learn: 'Normal learn'
      }
    }
  };
}

test('review: content hash is stable and prefixed', () => {
  const entry = makeEntry();
  const first = contentHash(entry);

  assert.match(first, /^sha256:[a-f0-9]{64}$/);
  assert.equal(contentHash(entry), first);
});

test('review: changing Pidgin copy changes the hash', () => {
  const entry = makeEntry();
  const before = contentHash(entry);
  entry.tone.street.happen = 'Changed';

  assert.notEqual(contentHash(entry), before);
});

test('review: draft entries are not reviewed', () => {
  const state = reviewState(makeEntry());

  assert.equal(state.reviewed, false);
  assert.equal(state.status, 'draft');
});

test('review: a signed entry is reviewed only while the hash matches', () => {
  const entry = makeEntry();
  entry.review = {
    status: 'reviewed',
    reviewers: [{ name: 'Ada Obi', github: 'adaobi', date: '2026-11-13' }],
    contentHash: contentHash(entry)
  };

  assert.equal(reviewState(entry).reviewed, true);
  assert.equal(reviewState(entry).status, 'reviewed');

  entry.tone.normal.learn = 'Changed after sign-off';
  const stale = reviewState(entry);

  assert.equal(stale.reviewed, false);
  assert.equal(stale.status, 'stale');
});

test('review: a reviewed entry without a reviewer is not valid', () => {
  const entry = makeEntry();
  entry.review = {
    status: 'reviewed',
    reviewers: [],
    contentHash: contentHash(entry)
  };

  assert.equal(reviewState(entry).reviewed, false);
  assert.equal(reviewState(entry).status, 'stale');
});
