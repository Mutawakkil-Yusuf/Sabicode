'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { conceptMap, loadConcepts } = require('../src/concepts');
const { loadDictionary, loadEslintRules } = require('../src/dictionary');

const ROOT = path.join(__dirname, '..');
const entries = loadDictionary();
const eslintEntries = loadEslintRules();
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
  assert.match(result.stdout, /Built 19 pages/);

  const indexPath = path.join(out, 'index.html');
  const index = fs.readFileSync(indexPath, 'utf8');

  assert.ok(fs.statSync(indexPath).size < 100 * 1024, 'index should stay under 100 KB');
  assert.match(index, /<title>Sabicode — Your errors, finally in your language\.<\/title>/);
  assert.match(
    index,
    /property="og:image" content="https:\/\/mutawakkil-yusuf\.github\.io\/Sabicode\/assets\/og\.svg"/
  );
  assert.match(
    index,
    /<link rel="canonical" href="https:\/\/mutawakkil-yusuf\.github\.io\/Sabicode\/">/
  );
  assert.match(index, /name="twitter:card" content="summary_large_image"/);
  assert.match(index, /var HERO = \[/);
  assert.match(index, /prefers-reduced-motion: reduce/);
  assert.match(index, /function talk\(\)/);
  assert.match(index, /IntersectionObserver/);
  assert.match(index, /Try the live demo/);
  assert.match(index, /Why this is rare/);
  assert.match(index, /A dictionary, not a chatbot\./);
  assert.match(index, /sabi scan/);
  assert.match(
    index,
    /href="https:\/\/github\.com\/Mutawakkil-Yusuf\/Sabicode\/issues\/new\?labels=schools/
  );
  assert.doesNotMatch(index, /mailto:/);
  assert.match(index, /reviewer credits placeholder/);
  assert.doesNotMatch(index, /prototype only/i);
  assert.doesNotMatch(index, /\{\{[A-Z_]+\}\}/);
  assert.doesNotMatch(index, /<script\s+src=/i);

  const demoPath = path.join(out, 'demo.html');
  const demo = fs.readFileSync(demoPath, 'utf8');

  assert.ok(fs.statSync(demoPath).size < 120 * 1024, 'demo should stay under 120 KB');
  assert.match(demo, /<title>Try Sabicode — run JavaScript errors in Pidgin, live<\/title>/);
  assert.match(demo, /Try Sabicode without installing anything\./);
  assert.match(demo, /role="tab"/);
  assert.match(demo, /Paste an error/);
  assert.match(demo, /Preview a scan/);
  assert.match(demo, /var ERRORS = \[/);
  assert.match(demo, /var SCAN = \{/);
  assert.match(demo, /new Worker/);
  assert.match(demo, /WORKER_SOURCE/);
  assert.match(demo, /localStorage\.getItem/);
  assert.match(demo, /prefers-reduced-motion: reduce/);
  assert.match(demo, /sabi scan/);
  assert.match(demo, /href="https:\/\/github\.com\/Mutawakkil-Yusuf\/Sabicode"/);
  assert.doesNotMatch(demo, /mailto:/);
  assert.doesNotMatch(demo, /\{\{[A-Z_]+\}\}/);
  assert.doesNotMatch(demo, /<script\s+src=/i);

  // The scan replay must use the ESLint catalog, not the runtime catalog.
  assert.match(demo, /"id":"eqeqeq"/);
  assert.match(demo, /"headline":"You use `\{2\}`, but `\{1\}` dey safer"/);
  assert.match(demo, /"id":"no-undef"/);
  assert.match(demo, /"headline":"You use `\{1\}`, but e no dey defined"/);
  assert.match(demo, /function renderGeneric\(ruleId, english\)/);
  for (const entry of eslintEntries) {
    assert.ok(demo.includes(`"id":"${entry.id}"`), `demo data includes ESLint rule ${entry.id}`);
  }

  for (const entry of entries) {
    const concept = concepts.get(entry.concept);
    assert.ok(index.includes(`errors/${entry.id}.html`), `grid links to ${entry.id}`);
    assert.ok(index.includes(concept.title), `grid shows the concept for ${entry.id}`);
    const streetPrefix = entry.tone.street.happen.split('`')[0].trim();
    const normalPrefix = entry.tone.normal.happen.split('`')[0].trim();
    assert.ok(demo.includes(streetPrefix), `demo data includes street copy for ${entry.id}`);
    assert.ok(demo.includes(normalPrefix), `demo data includes normal copy for ${entry.id}`);

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
    assert.ok(page.includes('href="../demo.html"'));
    assert.ok(page.includes(escapeHtml(entry.samples[0])));
    assert.doesNotMatch(page, /<script\s+src=/i);
  }

  const sitemap = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/<url>/g) || []).length, entries.length + 2);
  assert.match(
    sitemap,
    /https:\/\/mutawakkil-yusuf\.github\.io\/Sabicode\/demo\.html/
  );
  assert.match(
    sitemap,
    /https:\/\/mutawakkil-yusuf\.github\.io\/Sabicode\/errors\/ref-not-defined\.html/
  );

  const robots = fs.readFileSync(path.join(out, 'robots.txt'), 'utf8');
  assert.match(
    robots,
    /Sitemap: https:\/\/mutawakkil-yusuf\.github\.io\/Sabicode\/sitemap\.xml/
  );

  assert.ok(fs.existsSync(path.join(out, 'assets', 'polly.svg')));
  assert.ok(fs.existsSync(path.join(out, 'assets', 'og.svg')));
  assert.ok(fs.existsSync(path.join(out, 'DEPLOY.md')));
});
