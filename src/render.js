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

const WIDTH = 80;

function makeLayout(withEmoji) {
  const mascot = withEmoji ? '\u{1F99C}' : '[Polly]';
  const firstLabel = `${mascot} ${LABELS.happen}`;
  const width = firstLabel.length + 1;
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

function renderBlock(entry, captures, options = {}) {
  const tone = options.tone === 'normal' ? 'normal' : 'street';
  const copy = entry.tone[tone];
  const layout = makeLayout(options.emoji !== false);
  const color = Boolean(options.color);
  const lines = [''];

  renderSegment(layout.first, fill(copy.happen, captures), layout, color, lines);
  renderSegment(layout.todo, fill(copy.todo, captures), layout, color, lines);
  if (entry.fix_code) {
    renderSegment(layout.indent, `\`${fill(entry.fix_code, captures)}\``, layout, color, lines);
  }
  renderSegment(layout.learn, fill(copy.learn, captures), layout, color, lines);

  lines.push('');
  lines.push(layout.closer + CLOSERS[tone]);

  return `${lines.join('\n')}\n`;
}

function renderUnknown(tone, options = {}) {
  const safeTone = tone === 'normal' ? 'normal' : 'street';
  const layout = makeLayout(options.emoji !== false);
  const lines = [''];

  renderSegment(layout.first, UNKNOWN[safeTone], layout, Boolean(options.color), lines);

  return `${lines.join('\n')}\n`;
}

function resolveColor({ noColor = false, env = {}, isTTY = false } = {}) {
  if (noColor) return false;
  if (Object.prototype.hasOwnProperty.call(env, 'NO_COLOR')) return false;
  return Boolean(isTTY);
}

module.exports = {
  CLOSERS,
  UNKNOWN,
  applyInline,
  renderBlock,
  renderUnknown,
  resolveColor,
  wrapText
};
