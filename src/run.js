'use strict';

const os = require('node:os');
const { spawn } = require('node:child_process');
const { findErrorLine } = require('./parse');
const { matchError } = require('./match');
const { renderBlock, renderUnknown } = require('./render');

function runScript({
  script,
  args = [],
  entries,
  tone,
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
      stderr.write(chunk);
    });

    child.on('error', (error) => {
      stderr.write(`sabi: could not start the script: ${error.message}\n`);
      finish(1);
    });

    child.on('close', (code, signal) => {
      let exitCode = code;

      if (exitCode === null) {
        const number = signal ? os.constants.signals[signal] : undefined;
        exitCode = signal && number !== undefined ? 128 + number : 1;
      }

      if (exitCode !== 0) {
        const buffer = Buffer.concat(chunks).toString('utf8');
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
    });
  });
}

module.exports = { runScript };
