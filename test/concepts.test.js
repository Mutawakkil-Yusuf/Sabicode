'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { CONCEPT_ID, loadConcepts } = require('../src/concepts');

const concepts = loadConcepts();

test('concepts: the catalog is non-empty and every id is unique', () => {
  assert.ok(concepts.length > 0);

  const ids = concepts.map((concept) => concept.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('concepts: every entry has a title and a summary', () => {
  for (const concept of concepts) {
    assert.match(concept.id, CONCEPT_ID);
    assert.equal(typeof concept.title, 'string');
    assert.ok(concept.title.trim().length > 0);
    assert.equal(typeof concept.summary, 'string');
    assert.ok(concept.summary.trim().length > 0);
  }
});

test('concepts: invalid catalogs are rejected', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sabi-concepts-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const file = path.join(dir, 'concepts.json');
  fs.writeFileSync(
    file,
    JSON.stringify([
      { id: 'scope', title: 'Scope', summary: 'One' },
      { id: 'scope', title: 'Scope again', summary: 'Two' }
    ])
  );

  assert.throws(() => loadConcepts(file), /duplicate concept id "scope"/);
});
