#!/usr/bin/env node
'use strict';

const { main } = require('../src/cli');

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stderr.write(`sabi: unexpected failure: ${error && error.message ? error.message : error}\n`);
    process.exitCode = 1;
  });
