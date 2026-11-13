'use strict';

const fs = require('node:fs');
const path = require('node:path');
const packageJson = require('../package.json');
const { resolveMode, resolveTone } = require('./config');
const { loadDictionary } = require('./dictionary');
const { matchError } = require('./match');
const { findErrorLine } = require('./parse');
const {
  renderBlock,
  renderPidginFirst,
  renderUnknown,
  renderUnknownPidginFirst,
  resolveColor
} = require('./render');
const { runScript } = require('./run');

const COMMANDS = new Set(['run', 'explain', 'list']);

const HELP = `Sabicode - your errors, finally in your language.

Usage:
  sabi app.js [args...]
  sabi run app.js [args...]
  sabi explain "<error message>"
  sabi list
  sabi --help
  sabi --version

Options (place them before the script path):
  --mode=pidgin-first|append|raw
                        How errors are shown. Default: pidgin-first
  --raw                 Shortcut for --mode=raw
  --tone=street|normal  Explanation tone. Default: street
  --no-color            Do not use ANSI colors
  --no-emoji            Print [Polly] instead of the parrot

Modes:
  pidgin-first  Put Pidgin where the error line was, keep the English below
  append        Keep the English error and add the Pidgin block under it
  raw           Print the original stderr untouched

Mode can also come from SABI_MODE. Tone can also come from SABI_TONE or the
nearest .sabirc file:
  { "tone": "normal" }

Everything after the script path is passed to your script untouched.
`;

function parseInvocation(argv) {
  const options = {
    tone: undefined,
    mode: undefined,
    color: true,
    emoji: true,
    help: false,
    version: false
  };
  let index = 0;

  const parseFlags = () => {
    while (index < argv.length) {
      const arg = argv[index];

      if (arg === '--') {
        index += 1;
        return { literal: true };
      }

      if (arg === '--no-color') {
        options.color = false;
        index += 1;
        continue;
      }

      if (arg === '--no-emoji') {
        options.emoji = false;
        index += 1;
        continue;
      }

      if (arg === '--raw') {
        options.mode = 'raw';
        index += 1;
        continue;
      }

      if (arg === '--mode') {
        if (index + 1 >= argv.length || argv[index + 1].startsWith('-')) {
          return { error: 'option "--mode" needs "pidgin-first", "append", or "raw"' };
        }
        options.mode = argv[index + 1];
        index += 2;
        continue;
      }

      if (arg.startsWith('--mode=')) {
        options.mode = arg.slice('--mode='.length);
        index += 1;
        continue;
      }

      if (arg === '--tone') {
        if (index + 1 >= argv.length || argv[index + 1].startsWith('-')) {
          return { error: 'option "--tone" needs "street" or "normal"' };
        }
        options.tone = argv[index + 1];
        index += 2;
        continue;
      }

      if (arg.startsWith('--tone=')) {
        options.tone = arg.slice('--tone='.length);
        index += 1;
        continue;
      }

      if (arg === '--help' || arg === '-h') {
        options.help = true;
        index += 1;
        continue;
      }

      if (arg === '--version' || arg === '-v') {
        options.version = true;
        index += 1;
        continue;
      }

      if (arg.startsWith('-')) {
        return { error: `unknown option "${arg}"` };
      }

      break;
    }

    return null;
  };

  let result = parseFlags();
  if (result && result.error) return { error: result.error };
  if (result && result.literal) {
    return { command: 'run', options, positionals: argv.slice(index) };
  }

  let command = 'run';
  if (COMMANDS.has(argv[index])) {
    command = argv[index];
    index += 1;

    result = parseFlags();
    if (result && result.error) return { error: result.error };
    if (result && result.literal) {
      return { command, options, positionals: argv.slice(index) };
    }
  }

  return { command, options, positionals: argv.slice(index) };
}

function usageError(message) {
  process.stderr.write(`sabi: ${message}\nRun "sabi --help" for usage.\n`);
  return 1;
}

function listErrors(entries) {
  const width = Math.max(2, ...entries.map((entry) => entry.id.length));

  process.stdout.write(`Covered errors: ${entries.length}\n\n`);
  process.stdout.write(`${'id'.padEnd(width)}  reviewed\n`);
  process.stdout.write(`${'-'.repeat(width)}  --------\n`);

  for (const entry of entries) {
    const state =
      entry.reviewStatus === 'reviewed'
        ? 'yes'
        : entry.reviewStatus === 'stale'
          ? 'stale'
          : 'no';
    process.stdout.write(`${entry.id.padEnd(width)}  ${state}\n`);
  }

  return 0;
}

function explain(message, entries, options, tone, mode) {
  const found = findErrorLine(message);

  if (!found) {
    process.stderr.write('sabi: no JavaScript error line found in that message.\n');
    return 1;
  }

  const result = matchError(found.normalized, entries);
  const color = resolveColor({
    noColor: !options.color,
    env: process.env,
    isTTY: process.stdout.isTTY
  });
  const errorLabel = found.code ? `${found.name} [${found.code}]` : found.name;

  if (mode === 'raw') {
    process.stdout.write(`${message}\n`);
    return result ? 0 : 1;
  }

  if (!result) {
    const output =
      mode === 'pidgin-first'
        ? renderUnknownPidginFirst(tone, {
            color,
            emoji: options.emoji,
            errorLabel,
            english: found.line
          })
        : renderUnknown(tone, { color, emoji: options.emoji });

    process.stdout.write(output.replace(/^\n/, ''));
    return 1;
  }

  const output =
    mode === 'pidgin-first'
      ? renderPidginFirst(result.entry, result.captures, {
          tone,
          color,
          emoji: options.emoji,
          errorLabel,
          english: found.line
        })
      : renderBlock(result.entry, result.captures, {
          tone,
          color,
          emoji: options.emoji
        });

  process.stdout.write(output.replace(/^\n/, ''));
  return 0;
}

async function main(argv = []) {
  const invocation = parseInvocation(argv);

  if (invocation.error) {
    return usageError(invocation.error);
  }

  const { command, options, positionals } = invocation;

  if (options.help) {
    process.stdout.write(HELP);
    return 0;
  }

  if (options.version) {
    process.stdout.write(`${packageJson.version}\n`);
    return 0;
  }

  const warn = (message) => process.stderr.write(`${message}\n`);
  const tone = resolveTone({
    flag: options.tone,
    env: process.env,
    cwd: process.cwd(),
    warn
  });
  const mode = resolveMode({
    flag: options.mode,
    env: process.env,
    warn
  });
  const entries = loadDictionary();

  if (command === 'list') {
    if (positionals.length > 0) {
      return usageError(`unexpected argument "${positionals[0]}"`);
    }
    return listErrors(entries);
  }

  if (command === 'explain') {
    const message = positionals.join(' ').trim();
    if (!message) {
      return usageError('explain needs an error message');
    }
    return explain(message, entries, options, tone, mode);
  }

  const script = positionals[0];
  if (!script) {
    return usageError('no script given');
  }

  if (!fs.existsSync(script)) {
    process.stderr.write(`sabi: cannot find "${script}".\n`);
    return 1;
  }

  let stats;
  try {
    stats = fs.statSync(script);
  } catch (error) {
    process.stderr.write(`sabi: cannot open "${script}": ${error.message}\n`);
    return 1;
  }

  if (!stats.isFile()) {
    process.stderr.write(`sabi: "${path.normalize(script)}" is not a file.\n`);
    return 1;
  }

  const color = resolveColor({
    noColor: !options.color,
    env: process.env,
    isTTY: process.stderr.isTTY
  });

  return runScript({
    script,
    args: positionals.slice(1),
    entries,
    tone,
    mode,
    color,
    emoji: options.emoji
  });
}

module.exports = { HELP, main, parseInvocation };
