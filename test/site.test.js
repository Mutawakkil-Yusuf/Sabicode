'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { conceptMap, loadConcepts } = require('../src/concepts');
const { loadDictionary } = require('../src/dictionary');

const ROOT = path.join(__dirname, '..');
const entries = loadDictionary();
const concepts = conceptMap(loadConcepts());

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

test('site: builds every page from the dictionary', (t) => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'sabi-site-'));
  t.after(() => fs.rmSync(out, { recursive: true, force: true }));

  const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build-site.js')], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, SABI_SITE_OUT: out }
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Built 18 pages/);

  const indexPath = path.join(out, 'index.html');
  const index = fs.readFileSync(indexPath, 'utf8');

  assert.ok(fs.statSync(indexPath).size < 100 * 1024, 'index should stay under 100 KB');
  assert.match(index, /<title>Sabicode — Your errors, finally in your language\.<\/title>/);
  assert.match(index, /property="og:image" content="https:\/\/sabicode\.dev\/assets\/og\.svg"/);
  assert.match(index, /name="twitter:card" content="summary_large_image"/);
  assert.match(index, /var E = \[/);
  assert.match(index, /sabicode-tone/);
  assert.match(index, /localStorage\.getItem/);
  assert.match(index, /localStorage\.setItem/);
  assert.match(index, /prefers-reduced-motion: reduce/);
  assert.match(index, /function talk\(\)/);
  assert.match(index, /action="mailto:schools@sabicode\.dev"/);
  assert.match(index, /reviewer credits placeholder/);
  assert.doesNotMatch(index, /prototype only/i);
  assert.doesNotMatch(index, /\{\{[A-Z_]+\}\}/);
  assert.doesNotMatch(index, /<script\s+src=/i);

  for (const entry of entries) {
    const concept = concepts.get(entry.concept);
    assert.ok(index.includes(`errors/${entry.id}.html`), `grid links to ${entry.id}`);
    assert.ok(index.includes(concept.title), `grid shows the concept for ${entry.id}`);
    const streetPrefix = entry.tone.street.happen.split('`')[0].trim();
    const normalPrefix = entry.tone.normal.happen.split('`')[0].trim();
    assert.ok(index.includes(streetPrefix), `demo data includes street copy for ${entry.id}`);
    assert.ok(index.includes(normalPrefix), `demo data includes normal copy for ${entry.id}`);

    const pagePath = path.join(out, 'errors', `${entry.id}.html`);
    assert.ok(fs.existsSync(pagePath), `error page exists for ${entry.id}`);
    const page = fs.readFileSync(pagePath, 'utf8');

    assert.ok(page.includes(`<title>${escapeHtml(entry.samples[0])} — Sabicode</title>`));
    assert.ok(page.includes('What this means'));
    assert.ok(page.includes('id="polly"'));
    assert.ok(page.includes('window.talk = talk'));
    assert.ok(page.includes('Wetin happen:'));
    assert.ok(page.includes(`Concept: <strong>${concept.title}</strong>`));
    assert.ok(page.includes('>street</h3>'));
    assert.ok(page.includes('>normal</h3>'));
    assert.ok(page.includes('href="../index.html"'));
    assert.ok(page.includes(escapeHtml(entry.samples[0])));
    assert.doesNotMatch(page, /<script\s+src=/i);
  }

  const sitemap = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/<url>/g) || []).length, entries.length + 1);
  assert.match(sitemap, /https:\/\/sabicode\.dev\/errors\/ref-not-defined\.html/);

  const robots = fs.readFileSync(path.join(out, 'robots.txt'), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/sabicode\.dev\/sitemap\.xml/);

  assert.ok(fs.existsSync(path.join(out, 'assets', 'polly.svg')));
  assert.ok(fs.existsSync(path.join(out, 'assets', 'og.svg')));
  assert.ok(fs.existsSync(path.join(out, 'DEPLOY.md')));
});
