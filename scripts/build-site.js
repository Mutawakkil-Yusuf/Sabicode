#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { loadDictionary } = require('../src/dictionary');

// Single place to change the public domain and the pilot inbox.
const SITE_URL = (process.env.SABI_SITE_URL || 'https://sabicode.dev').replace(/\/+$/, '');
const SCHOOLS_EMAIL = process.env.SABI_SCHOOLS_EMAIL || 'schools@sabicode.dev';
const SCHOOLS_FORM_ACTION = `mailto:${SCHOOLS_EMAIL}`;
const PIDGIN_EMAIL = process.env.SABI_PIDGIN_EMAIL || 'pidgin@sabicode.dev';

const SITE_TITLE = 'Sabicode — Your errors, finally in your language.';
const SITE_DESCRIPTION =
  'Sabicode runs your JavaScript and explains errors in Nigerian Pidgin, right under the original message. Zero dependencies, Node 18+, street and normal tones.';
const OG_IMAGE = `${SITE_URL}/assets/og.svg`;
const OG_IMAGE_ALT = 'Sabicode, with Polly Glot the parrot and the command npx sabicode app.js';

const ROOT = path.join(__dirname, '..');
const SITE_DIR = path.resolve(process.env.SABI_SITE_OUT || path.join(ROOT, 'site'));
const TEMPLATE_PATH = path.join(__dirname, 'landing.template.html');
const CSS_PATH = path.join(__dirname, 'site.css');

if (SITE_DIR === ROOT || SITE_DIR === path.parse(SITE_DIR).root) {
  throw new Error('SABI_SITE_OUT must point at a directory below the project root');
}

const entries = loadDictionary();
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
const css = fs.readFileSync(CSS_PATH, 'utf8');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function fill(value, captures) {
  return String(value).replace(/\{(\d+)\}/g, (placeholder, index) => {
    const capture = captures[Number(index) - 1];
    return capture === undefined ? placeholder : capture;
  });
}

function inline(value, captures) {
  return escapeHtml(fill(value, captures)).replace(/`([^`]+)`/g, '<code>$1</code>');
}

function plain(value, captures) {
  return fill(value, captures).replace(/`/g, '').replace(/\s+/g, ' ').trim();
}

function truncate(value, length) {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1).replace(/\s+\S*$/, '')}…`;
}

function capturesFor(entry) {
  const match = entry.regex.exec(entry.samples[0]);
  if (!match) {
    throw new Error(`sample for ${entry.id} does not match its own expression`);
  }
  return match.slice(1);
}

function labelFor(id) {
  const words = id.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function toneData(entry, captures) {
  const data = {};

  for (const tone of ['street', 'normal']) {
    const copy = entry.tone[tone];
    const todo = fill(copy.todo, captures);
    const fix = entry.fix_code ? ` \`${fill(entry.fix_code, captures)}\`` : '';
    data[tone] = {
      h: inline(copy.happen, captures),
      t: inline(todo + fix, captures),
      l: inline(copy.learn, captures)
    };
  }

  return data;
}

const data = entries.map((entry) => {
  const captures = capturesFor(entry);
  return {
    entry,
    captures,
    sample: entry.samples[0],
    tones: toneData(entry, captures),
    what: inline(entry.what, captures),
    description: truncate(
      plain(entry.what, captures) ||
        `${entry.samples[0]} explained in plain English.`,
      158
    )
  };
});

function head({ title, description, canonical, assetPrefix = '' }) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta name="theme-color" content="#faf7ef" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#101712" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${assetPrefix}assets/polly.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Sabicode">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:type" content="image/svg+xml">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<meta name="twitter:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}">
<style>
${css.trim()}
</style>`;
}

function svgDefs() {
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="parrot" viewBox="0 0 48 48"><path d="M13 14C10 7 15 3 18 9C19 3 25 3 25 11C29 7 32 11 28 16Z" fill="var(--yellow)"/><circle cx="22" cy="27" r="16" fill="var(--green)"/><path d="M34 21C46 20 48 31 40 38C39 33 36 31 33 31Z" fill="var(--yellow)"/><circle cx="26" cy="23" r="5" fill="#fff"/><circle cx="27.5" cy="23" r="2.3" fill="#16241c"/></symbol></svg>`;
}

function logoSvg() {
  return '<svg class="logo-parrot" viewBox="0 0 48 48" aria-hidden="true"><use href="#parrot"/></svg>';
}

function pollySvg() {
  return `<svg class="p" id="polly" viewBox="0 0 48 48" aria-hidden="true"><path class="crest" d="M13 14C10 7 15 3 18 9C19 3 25 3 25 11C29 7 32 11 28 16Z" fill="var(--yellow)"/><circle cx="22" cy="27" r="16" fill="var(--green)"/><path class="beak" d="M34 21C46 20 48 31 40 38C39 33 36 31 33 31Z" fill="var(--yellow)"/><circle cx="26" cy="23" r="5" fill="#fff"/><circle cx="27.5" cy="23" r="2.3" fill="#16241c"/><ellipse class="lid" cx="26" cy="23" rx="5.4" ry="5.4" fill="var(--green)"/></svg>`;
}

function footer() {
  return `<div class="wrap">
  <footer>
    <span>Sabicode is in development. Pidgin explanations are a draft until reviewers sign off.</span>
    <span>Pidgin reviewers: <span class="credit-placeholder">[reviewer credits placeholder]</span> · <a href="mailto:${PIDGIN_EMAIL}?subject=Suggest%20a%20Pidgin%20phrase">Suggest a phrase</a></span>
  </footer>
</div>`;
}

function talkScript() {
  return `(function () {
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function talk() {
    var parrot = document.getElementById("polly");
    if (!parrot || still) return;
    parrot.classList.remove("talk");
    void parrot.getBoundingClientRect();
    parrot.classList.add("talk");
  }
  window.talk = talk;
  talk();
})();`;
}

function gridLink(item) {
  return `<a href="errors/${item.entry.id}.html"><span class="g-err">${escapeHtml(item.sample)}</span><span class="g-go">Open page →</span></a>`;
}

function demoData() {
  return data.map((item) => ({
    id: item.entry.id,
    label: labelFor(item.entry.id),
    cmd: item.sample,
    s: item.tones.street,
    n: item.tones.normal
  }));
}

function toneCard(tone, copy) {
  return `<article class="tone-card">
  <h3>${tone}</h3>
  <div class="pg">
    <div><b>Wetin happen:</b> ${copy.h}</div>
    <div><b>Wetin to do:</b> ${copy.t}</div>
    <div><b>Learn am:</b> ${copy.l}</div>
  </div>
</article>`;
}

function errorPage(item) {
  const { entry, captures, sample, tones, what, description } = item;
  const title = `${sample} — Sabicode`;
  const canonical = `${SITE_URL}/errors/${entry.id}.html`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
${head({ title, description: description, canonical, assetPrefix: '../' })}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${svgDefs()}
<div class="wrap">
  <nav>
    <a class="logo" href="../index.html">${logoSvg()}<span>sabicode</span></a>
    <a class="s" href="../index.html">All errors</a>
  </nav>

  <main id="main" class="error-page">
    <a class="back-link" href="../index.html">← All errors</a>
    <div class="error-hero">
      <div>
        <h1 class="error-title">${escapeHtml(sample)}</h1>
        <div class="term error-term">
          <div class="out"><span class="err">${escapeHtml(sample)}</span></div>
        </div>
      </div>
      <aside class="polly-bubble" aria-label="Polly Glot">
        ${pollySvg()}
        <p><strong>Polly Glot says:</strong> Wetin happen?</p>
      </aside>
    </div>

    <section class="prose" aria-labelledby="what-title">
      <h2 id="what-title">What this means</h2>
      <p>${what}</p>
    </section>

    <section aria-labelledby="tones-title">
      <h2 id="tones-title">How Sabicode explains it</h2>
      <div class="tone-grid">
        ${toneCard('street', tones.street)}
        ${toneCard('normal', tones.normal)}
      </div>
    </section>

    <p class="back-bottom"><a class="btn alt" href="../index.html">Back to all errors</a></p>
  </main>
</div>

${footer()}
<script>
${talkScript()}
</script>
</body>
</html>
`;
}

function renderIndex() {
  const demo = JSON.stringify(demoData())
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  const replacements = {
    HEAD: head({
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      canonical: `${SITE_URL}/`,
      assetPrefix: ''
    }),
    SVG_DEFS: svgDefs(),
    LOGO_SVG: logoSvg(),
    POLLY_TERMINAL: pollySvg(),
    ERROR_COUNT: String(entries.length),
    ERRORS_GRID: data.map(gridLink).join('\n      '),
    DEMO_DATA: demo,
    SCHOOLS_ACTION: escapeHtml(SCHOOLS_FORM_ACTION),
    SCHOOLS_EMAIL: escapeHtml(SCHOOLS_EMAIL),
    PIDGIN_EMAIL: escapeHtml(PIDGIN_EMAIL)
  };

  let html = template;
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }

  const left = html.match(/\{\{[A-Z_]+\}\}/);
  if (left) throw new Error(`unreplaced template placeholder: ${left[0]}`);

  return html;
}

function pollyAsset() {
  return `<!-- Placeholder mascot art. Replace with final art and keep the named parts if animation is reused. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" aria-labelledby="polly-title polly-desc">
  <title id="polly-title">Polly Glot, the Sabicode parrot</title>
  <desc id="polly-desc">A placeholder green parrot with a yellow crest and beak.</desc>
  <path d="M13 14C10 7 15 3 18 9C19 3 25 3 25 11C29 7 32 11 28 16Z" fill="#f5c518"/>
  <circle cx="22" cy="27" r="16" fill="#0c6b3f"/>
  <path d="M34 21C46 20 48 31 40 38C39 33 36 31 33 31Z" fill="#f5c518"/>
  <circle cx="26" cy="23" r="5" fill="#ffffff"/>
  <circle cx="27.5" cy="23" r="2.3" fill="#16241c"/>
</svg>
`;
}

function ogAsset() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="og-title og-desc">
  <title id="og-title">Sabicode</title>
  <desc id="og-desc">Your errors, finally in your language.</desc>
  <rect width="1200" height="630" fill="#faf7ef"/>
  <circle cx="1050" cy="110" r="210" fill="#f5c518" opacity=".18"/>
  <circle cx="90" cy="590" r="160" fill="#0c6b3f" opacity=".08"/>
  <g transform="translate(888 198) scale(7.2)">
    <path d="M13 14C10 7 15 3 18 9C19 3 25 3 25 11C29 7 32 11 28 16Z" fill="#f5c518"/>
    <circle cx="22" cy="27" r="16" fill="#0c6b3f"/>
    <path d="M34 21C46 20 48 31 40 38C39 33 36 31 33 31Z" fill="#f5c518"/>
    <circle cx="26" cy="23" r="5" fill="#ffffff"/>
    <circle cx="27.5" cy="23" r="2.3" fill="#16241c"/>
  </g>
  <text x="80" y="180" font-family="Poppins, system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="92" font-weight="700" fill="#0c6b3f">Sabicode</text>
  <text x="80" y="252" font-family="Poppins, system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="36" font-weight="500" fill="#16241c">Your errors, finally in your language.</text>
  <rect x="80" y="330" width="760" height="112" rx="16" fill="#0e1a14"/>
  <text x="112" y="400" font-family="'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace" font-size="32" fill="#d8e6dc">$ npx sabicode app.js</text>
  <text x="80" y="520" font-family="Poppins, system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="26" font-weight="500" fill="#5a6a60">Nigerian Pidgin explanations, right under the English error.</text>
  <rect x="80" y="548" width="150" height="8" rx="4" fill="#f5c518"/>
</svg>
`;
}

function sitemap() {
  const urls = [
    { loc: `${SITE_URL}/`, priority: '1.0' },
    ...entries.map((entry) => ({
      loc: `${SITE_URL}/errors/${entry.id}.html`,
      priority: '0.7'
    }))
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) =>
      `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n    <priority>${url.priority}</priority>\n  </url>`
  )
  .join('\n')}
</urlset>
`;
}

function deployNotes() {
  return `# Deploy the Sabicode site

The site is static. Every page is generated by \`node scripts/build-site.js\` into
\`site/\`. No server, database, or environment variables are required.

## Cloudflare Pages

- Build command: \`node scripts/build-site.js\`
- Build output directory: \`site\`
- Node version: 18 or newer

## Netlify

- Build command: \`node scripts/build-site.js\`
- Publish directory: \`site\`

## After the first deploy

1. Change \`SITE_URL\` at the top of \`scripts/build-site.js\` to the real domain.
2. Rebuild and redeploy so canonical URLs, Open Graph tags, and the sitemap use
   the new domain.
3. Change \`SCHOOLS_EMAIL\` and \`PIDGIN_EMAIL\` in the same place if the pilot and
   Pidgin-review inboxes are different.
4. Point the domain at the host and confirm \`/sitemap.xml\` and \`/robots.txt\`
   load.
`;
}

function write(relative, contents) {
  const target = path.join(SITE_DIR, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

fs.rmSync(SITE_DIR, { recursive: true, force: true });
fs.mkdirSync(SITE_DIR, { recursive: true });

write('index.html', renderIndex());
for (const item of data) {
  write(path.join('errors', `${item.entry.id}.html`), errorPage(item));
}
write(path.join('assets', 'polly.svg'), pollyAsset());
write(path.join('assets', 'og.svg'), ogAsset());
write('sitemap.xml', sitemap());
write(
  'robots.txt',
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
);
write('DEPLOY.md', deployNotes());

process.stdout.write(
  `Built ${entries.length + 1} pages in ${path.relative(process.cwd(), SITE_DIR) || '.'}\n`
);
