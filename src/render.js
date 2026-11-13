'use strict';

const LABELS = {
  happen: 'Wetin happen:',
  todo: 'Wetin to do:',
  learn: 'Learn am:'
};

const CLOSERS = {
  street: 'Oya, run am again.',
  normal: 'Fix am, then run am again.'
};

const UNKNOWN = {
  street: 'This one na new to me. Check the English error above, we go add am soon.',
  normal: 'This error no dey my list yet. Check the English message above.'
};

const UNKNOWN_HEADLINE = {
  street: 'This one na new to me',
  normal: 'This one no dey my list yet'
};

const WIDTH = 80;

function mascotFor(withEmoji) {
  return withEmoji ? '\u{1F99C}' : '[Polly]';
}

function makeLayout(withEmoji, showMascot = true) {
  const mascot = mascotFor(withEmoji);
  const mascotLabel = `${mascot} ${LABELS.happen}`;
  const width = mascotLabel.length + 1;
  const firstLabel = showMascot ? mascotLabel : `   ${LABELS.happen}`;
  const padLabel = (label) => label + ' '.repeat(Math.max(1, width - label.length));

  return {
    width,
    first: padLabel(firstLabel),
    todo: padLabel(`   ${LABELS.todo}`),
    learn: padLabel(`   ${LABELS.learn}`),
    indent: ' '.repeat(width),
    closer: '   Polly: '
  };
}

function fill(template, captures) {
  return String(template).replace(/\{(\d+)\}/g, (placeholder, index) => {
    const value = captures[Number(index) - 1];
    return value === undefined ? placeholder : value;
  });
}

function headlineFor(entry, captures, tone) {
  const copy = entry.tone[tone];
  return fill(copy.headline || copy.happen, captures);
}

function headlineText(text, options) {
  const label = options.errorLabel ? `${options.errorLabel}: ` : '';
  const mascot = mascotFor(options.emoji !== false);
  return applyInline(`${mascot} ${label}${text}`, Boolean(options.color));
}

function renderHeadline(entry, captures, options = {}) {
  const tone = options.tone === 'normal' ? 'normal' : 'street';
  return headlineText(headlineFor(entry, captures, tone), options);
}

function renderUnknownHeadline(tone, options = {}) {
  const safeTone = tone === 'normal' ? 'normal' : 'street';
  return headlineText(UNKNOWN_HEADLINE[safeTone], options);
}

function tokenize(text) {
  const tokens = [];
  let current = '';
  let index = 0;

  while (index < text.length) {
    if (text[index] === ' ') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      index += 1;
      continue;
    }

    if (text[index] === '`') {
      const close = text.indexOf('`', index + 1);
      if (close !== -1) {
        current += text.slice(index, close + 1);
        index = close + 1;
        continue;
      }
    }

    current += text[index];
    index += 1;
  }

  if (current) tokens.push(current);
  return tokens;
}

function wrapText(text, firstWidth, restWidth) {
  const tokens = tokenize(String(text).replace(/\s+/g, ' ').trim());
  if (tokens.length === 0) return [''];

  const lines = [];
  let current = '';
  let limit = firstWidth;

  for (const token of tokens) {
    if (current === '') {
      current = token;
      continue;
    }

    if (current.length + 1 + token.length > limit) {
      lines.push(current);
      current = token;
      limit = restWidth;
      continue;
    }

    current += ` ${token}`;
  }

  lines.push(current);
  return lines;
}

function applyInline(text, color) {
  let output = '';
  let index = 0;

  while (index < text.length) {
    const open = text.indexOf('`', index);
    if (open === -1) {
      output += text.slice(index);
      break;
    }

    const close = text.indexOf('`', open + 1);
    if (close === -1) {
      output += text.slice(index);
      break;
    }

    output += text.slice(index, open);
    const code = text.slice(open + 1, close);
    output += color ? `\u001b[36m${code}\u001b[39m` : `\`${code}\``;
    index = close + 1;
  }

  return output;
}

function renderSegment(prefix, text, layout, color, lines) {
  const wrapped = wrapText(text, WIDTH - layout.width, WIDTH - layout.width);

  wrapped.forEach((line, index) => {
    lines.push((index === 0 ? prefix : layout.indent) + applyInline(line, color));
  });
}

function renderEnglish(english, color, lines) {
  const prefix = '   English: ';
  const indent = ' '.repeat(prefix.length);
  const wrapped = wrapText(english, WIDTH - prefix.length, WIDTH - prefix.length);

  wrapped.forEach((line, index) => {
    const styled = color ? `\u001b[2m${line}\u001b[22m` : line;
    lines.push((index === 0 ? prefix : indent) + styled);
  });
}

function renderBlock(entry, captures, options = {}) {
  const tone = options.tone === 'normal' ? 'normal' : 'street';
  const copy = entry.tone[tone];
  const layout = makeLayout(options.emoji !== false, options.showMascot !== false);
  const color = Boolean(options.color);
  const lines = [''];

  renderSegment(layout.first, fill(copy.happen, captures), layout, color, lines);
  renderSegment(layout.todo, fill(copy.todo, captures), layout, color, lines);
  if (entry.fix_code) {
    renderSegment(layout.indent, `\`${fill(entry.fix_code, captures)}\``, layout, color, lines);
  }
  renderSegment(layout.learn, fill(copy.learn, captures), layout, color, lines);
  if (options.english) {
    renderEnglish(options.english, color, lines);
  }

  lines.push('');
  lines.push(layout.closer + CLOSERS[tone]);

  return `${lines.join('\n')}\n`;
}

function renderUnknown(tone, options = {}) {
  const safeTone = tone === 'normal' ? 'normal' : 'street';
  const layout = makeLayout(options.emoji !== false, options.showMascot !== false);
  const color = Boolean(options.color);
  const lines = [''];

  renderSegment(layout.first, UNKNOWN[safeTone], layout, color, lines);
  if (options.english) {
    renderEnglish(options.english, color, lines);
  }

  return `${lines.join('\n')}\n`;
}

function renderPidginFirst(entry, captures, options = {}) {
  const headline = renderHeadline(entry, captures, options);
  const block = renderBlock(entry, captures, { ...options, showMascot: false });
  return `${headline}\n${block.replace(/^\n/, '')}`;
}

function renderUnknownPidginFirst(tone, options = {}) {
  const headline = renderUnknownHeadline(tone, options);
  const block = renderUnknown(tone, { ...options, showMascot: false });
  return `${headline}\n${block.replace(/^\n/, '')}`;
}

function resolveColor({ noColor = false, env = {}, isTTY = false } = {}) {
  if (noColor) return false;
  if (Object.prototype.hasOwnProperty.call(env, 'NO_COLOR')) return false;
  return Boolean(isTTY);
}

module.exports = {
  CLOSERS,
  UNKNOWN,
  UNKNOWN_HEADLINE,
  applyInline,
  renderBlock,
  renderHeadline,
  renderPidginFirst,
  renderUnknown,
  renderUnknownHeadline,
  renderUnknownPidginFirst,
  resolveColor,
  wrapText
};
