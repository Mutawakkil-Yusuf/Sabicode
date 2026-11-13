'use strict';

const os = require('node:os');
const { spawn } = require('node:child_process');
const { findErrorLine, stripAnsi } = require('./parse');
const { matchError } = require('./match');
const {
  renderBlock,
  renderHeadline,
  renderUnknown,
  renderUnknownHeadline
} = require('./render');

function replaceErrorLine(raw, originalLine, replacement) {
  const lines = raw.split('\n');
  const target = originalLine.trimEnd();

  for (let index = 0; index < lines.length; index += 1) {
    const hasCr = lines[index].endsWith('\r');
    const line = hasCr ? lines[index].slice(0, -1) : lines[index];

    if (stripAnsi(line).trimEnd() === target) {
      lines[index] = `${replacement}${hasCr ? '\r' : ''}`;
      break;
    }
  }

  return lines.join('\n');
}

function runScript({
  script,
  args = [],
  entries,
  tone,
  mode = 'pidgin-first',
  color = false,
  emoji = true,
  stderr = process.stderr
}) {
  return new Promise((resolve) => {
    let settled = false;
    const chunks = [];
    const child = spawn(process.execPath, [script, ...args], {
      stdio: ['inherit', 'inherit', 'pipe']
    });
    const streamLive = mode !== 'pidgin-first';

    const cleanup = () => {
      process.removeListener('SIGINT', onSigint);
      process.removeListener('SIGTERM', onSigterm);
    };

    const finish = (code) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(code);
    };

    const forward = (signal) => {
      try {
        child.kill(signal);
      } catch {
        // The child may have exited between the signal and this call.
      }
    };

    const onSigint = () => forward('SIGINT');
    const onSigterm = () => forward('SIGTERM');

    process.on('SIGINT', onSigint);
    process.on('SIGTERM', onSigterm);

    child.stderr.on('data', (chunk) => {
      chunks.push(chunk);
      if (streamLive) stderr.write(chunk);
    });

    child.on('error', (error) => {
      stderr.write(`sabi: could not start the script: ${error.message}\n`);
      finish(1);
    });

    child.on('close', (code, signal) => {
      if (settled) return;

      let exitCode = code;

      if (exitCode === null) {
        const number = signal ? os.constants.signals[signal] : undefined;
        exitCode = signal && number !== undefined ? 128 + number : 1;
      }

      const buffer = Buffer.concat(chunks).toString('utf8');

      if (mode === 'raw') {
        finish(exitCode);
        return;
      }

      if (mode === 'append') {
        if (exitCode !== 0) {
          const found = findErrorLine(buffer);

          if (found) {
            const result = matchError(found.normalized, entries);

            if (result) {
              stderr.write(
                renderBlock(result.entry, result.captures, { tone, color, emoji })
              );
            } else {
              stderr.write(renderUnknown(tone, { color, emoji }));
            }
          }
        }

        finish(exitCode);
        return;
      }

      if (exitCode === 0) {
        stderr.write(buffer);
        finish(exitCode);
        return;
      }

      const found = findErrorLine(buffer);

      if (!found) {
        stderr.write(buffer);
        finish(exitCode);
        return;
      }

      const result = matchError(found.normalized, entries);
      const errorLabel = found.code ? `${found.name} [${found.code}]` : found.name;

      if (result) {
        const headline = renderHeadline(result.entry, result.captures, {
          tone,
          color,
          emoji,
          errorLabel
        });

        stderr.write(replaceErrorLine(buffer, found.line, headline));
        stderr.write(
          renderBlock(result.entry, result.captures, {
            tone,
            color,
            emoji,
            showMascot: false,
            english: found.line
          })
        );
      } else {
        const headline = renderUnknownHeadline(tone, { color, emoji, errorLabel });

        stderr.write(replaceErrorLine(buffer, found.line, headline));
        stderr.write(
          renderUnknown(tone, { color, emoji, showMascot: false, english: found.line })
        );
      }

      finish(exitCode);
    });
  });
}

module.exports = { replaceErrorLine, runScript };
