'use strict';

const ANSI_PATTERN =
  /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d/#&.:=?%@~_]+)*)?\u0007)|(?:(?:\d{1,4}(?:[;:]\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;

const ERROR_LINE_PATTERN = /^(\w*Error)(?: \[(\w+)\])?: (.+)$/;

function stripAnsi(value) {
  return String(value).replace(ANSI_PATTERN, '');
}

function findErrorLine(stderr) {
  const lines = stripAnsi(stderr).split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(ERROR_LINE_PATTERN);
    if (!match) continue;

    return {
      name: match[1],
      code: match[2] || null,
      message: match[3],
      normalized: `${match[1]}: ${match[3]}`,
      line
    };
  }

  return null;
}

module.exports = { ERROR_LINE_PATTERN, findErrorLine, stripAnsi };
