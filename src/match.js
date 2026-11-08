'use strict';

function matchError(normalized, entries) {
  for (const entry of entries) {
    const match = entry.regex.exec(normalized);
    if (!match) continue;

    return {
      entry,
      captures: match.slice(1).map((value) => (value === undefined ? '' : value))
    };
  }

  return null;
}

module.exports = { matchError };
