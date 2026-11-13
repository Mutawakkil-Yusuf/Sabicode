'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CONCEPTS_FILE = path.join(__dirname, '..', 'concepts', 'concepts.json');
const CONCEPT_ID = /^[a-z][a-z0-9-]*$/;

function loadConcepts(file = CONCEPTS_FILE) {
  const concepts = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (!Array.isArray(concepts) || concepts.length === 0) {
    throw new Error(`${file} must contain a non-empty array of concepts`);
  }

  const seen = new Set();

  for (const concept of concepts) {
    if (!concept || typeof concept !== 'object') {
      throw new Error(`${file} contains a concept that is not an object`);
    }
    if (typeof concept.id !== 'string' || !CONCEPT_ID.test(concept.id)) {
      throw new Error(`invalid concept id ${JSON.stringify(concept.id)} in ${file}`);
    }
    if (seen.has(concept.id)) {
      throw new Error(`duplicate concept id "${concept.id}" in ${file}`);
    }
    if (typeof concept.title !== 'string' || concept.title.trim() === '') {
      throw new Error(`concept "${concept.id}" needs a title`);
    }
    if (typeof concept.summary !== 'string' || concept.summary.trim() === '') {
      throw new Error(`concept "${concept.id}" needs a summary`);
    }
    seen.add(concept.id);
  }

  return concepts;
}

function conceptMap(concepts = loadConcepts()) {
  return new Map(concepts.map((concept) => [concept.id, concept]));
}

module.exports = { CONCEPTS_FILE, CONCEPT_ID, conceptMap, loadConcepts };
