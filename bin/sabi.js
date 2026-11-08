#!/usr/bin/env node
'use strict';

const { main } = require('../src/cli');

// A closed pipe is normal when output is piped into `head`, `less`, or a pager.
function handleStreamError(error) {
  if (error && error.code === 'EPIPE') {
    process.exit(0);
  }
  try {
    process.stderr.write(
      `sabi: output stream error: ${error && error.message ? error.message : error}\n`
    );
  } catch {
    // Nothing useful left to report to.
  }
  process.exit(1);
}

process.stdout.on('error', handleStreamError);
process.stderr.on('error', handleStreamError);

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stderr.write(`sabi: unexpected failure: ${error && error.message ? error.message : error}\n`);
    process.exitCode = 1;
  });
