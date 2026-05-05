// Regex Builder — live highlight + capture group inspection.
//
// `syncRegexFlags` and `runRegex` are wired bidirectionally: typing flags in
// the input updates the checkboxes, and (via the checkbox onchange handlers)
// vice versa. matchAll requires the /g flag, so we branch.

import { t } from '../../i18n/index.js';
import { showError, hideError, escapeHtml } from '../../core/util.js';

export function syncRegexFlags() {
  const flags = ['g', 'i', 'm', 's']
    .filter((f) => document.getElementById(`regex-flag-${f}`).checked)
    .join('');
  document.getElementById('regex-flags').value = flags;
  runRegex();
}

export function runRegex() {
  hideError('regex-error');
  const pattern = document.getElementById('regex-pattern').value;
  const flags = document.getElementById('regex-flags').value;
  const sample = document.getElementById('regex-sample').value;
  const highlightEl = document.getElementById('regex-highlight');
  const groupsEl = document.getElementById('regex-groups');
  const statsEl = document.getElementById('regex-stats');

  // Keep checkbox state in sync if user typed flags directly into the field.
  ['g', 'i', 'm', 's'].forEach((f) => {
    const cb = document.getElementById(`regex-flag-${f}`);
    if (cb) cb.checked = flags.includes(f);
  });

  highlightEl.textContent = sample;
  groupsEl.innerHTML = '';
  statsEl.style.display = 'none';

  if (!pattern) return;

  let regex;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e) {
    showError('regex-error', `${t('regex.error.invalid')}: ${e.message}`);
    return;
  }

  const matches = [];
  if (flags.includes('g')) {
    for (const m of sample.matchAll(regex)) matches.push(m);
  } else {
    const m = sample.match(regex);
    if (m) matches.push(m);
  }

  let html = '';
  let cursor = 0;
  for (const m of matches) {
    if (m.index === undefined) continue;
    html += escapeHtml(sample.slice(cursor, m.index));
    html += `<span class="regex-match">${escapeHtml(m[0])}</span>`;
    cursor = m.index + m[0].length;
  }
  html += escapeHtml(sample.slice(cursor));
  highlightEl.innerHTML = html || escapeHtml(sample);

  statsEl.style.display = 'block';
  statsEl.textContent = `${t('regex.matches')}: ${matches.length}`;

  if (matches.length > 0) {
    const first = matches[0];
    let rows = '';
    for (let i = 0; i < first.length; i++) {
      rows += `<div class="regex-group-row"><span class="gname">$${i}</span><span class="gidx">${i === 0 ? 'full' : 'group'}</span><span>${escapeHtml(first[i] === undefined ? '(undefined)' : first[i])}</span></div>`;
    }
    if (first.groups) {
      for (const [name, val] of Object.entries(first.groups)) {
        rows += `<div class="regex-group-row"><span class="gname">${escapeHtml(name)}</span><span class="gidx">named</span><span>${escapeHtml(val === undefined ? '(undefined)' : val)}</span></div>`;
      }
    }
    groupsEl.innerHTML = rows;
  }
}
