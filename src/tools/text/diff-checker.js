// Text Diff — naïve line-by-line comparison.
//
// This is a positional diff (line N from each side, side-by-side). True LCS
// diffing is reserved for JSON Diff (where ordering matters semantically). For
// flat text the positional view is what users typically want and matches what
// most BA reviewers do mentally.

import { t } from '../../i18n/index.js';
import { escapeHtml } from '../../core/util.js';

export function runDiff() {
  const a = document.getElementById('diff-original').value.split('\n');
  const b = document.getElementById('diff-new').value.split('\n');
  const out = document.getElementById('diff-output');
  out.innerHTML = '';

  const maxLen = Math.max(a.length, b.length);
  let added = 0;
  let removed = 0;

  for (let i = 0; i < maxLen; i++) {
    const lineA = a[i];
    const lineB = b[i];
    if (lineA === lineB) {
      out.innerHTML += `<div class="diff-line diff-unchanged">${escapeHtml(lineB ?? '')}</div>`;
    } else {
      if (lineA !== undefined) {
        out.innerHTML += `<div class="diff-line diff-removed">- ${escapeHtml(lineA)}</div>`;
        removed++;
      }
      if (lineB !== undefined) {
        out.innerHTML += `<div class="diff-line diff-added">+ ${escapeHtml(lineB)}</div>`;
        added++;
      }
    }
  }

  document.getElementById('diff-stats').textContent =
    `+${added} ${t('diff.added')}, -${removed} ${t('diff.removed')}`;
}
