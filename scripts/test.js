'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const testDir = path.join(__dirname, '..', 'test');
const files = fs
  .readdirSync(testDir)
  .filter((name) => name.endsWith('.test.js'))
  .sort()
  .map((name) => path.join('test', name));

const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit'
});

process.exit(result.status === null ? 1 : result.status);
