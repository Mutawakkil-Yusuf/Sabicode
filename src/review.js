'use strict';

const crypto = require('node:crypto');

const REVIEW_STATUSES = ['draft', 'reviewed'];

function reviewedContent(entry) {
  return {
    id: entry.id,
    match: entry.match,
    samples: entry.samples,
    fix_code: entry.fix_code === undefined ? null : entry.fix_code,
    tone: {
      street: {
        headline: entry.tone.street.headline,
        happen: entry.tone.street.happen,
        todo: entry.tone.street.todo,
        learn: entry.tone.street.learn
      },
      normal: {
        headline: entry.tone.normal.headline,
        happen: entry.tone.normal.happen,
        todo: entry.tone.normal.todo,
        learn: entry.tone.normal.learn
      }
    }
  };
}

function contentHash(entry) {
  const canonical = JSON.stringify(reviewedContent(entry));
  return `sha256:${crypto.createHash('sha256').update(canonical).digest('hex')}`;
}

function reviewState(entry) {
  const review = entry.review && typeof entry.review === 'object' ? entry.review : {};
  const currentHash = contentHash(entry);
  const hasReviewer = Array.isArray(review.reviewers) && review.reviewers.length > 0;
  const matches = review.contentHash === currentHash;
  const reviewed = review.status === 'reviewed' && hasReviewer && matches;

  return {
    currentHash,
    reviewed,
    status: reviewed ? 'reviewed' : review.status === 'reviewed' ? 'stale' : 'draft'
  };
}

module.exports = { REVIEW_STATUSES, contentHash, reviewState, reviewedContent };
