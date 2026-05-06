// JSON Diff — structural, path-based comparison.
//
// Arrays use LCS so that an insertion at index 0 doesn't cascade into "changed"
// reports for every later element. Objects fall through to key-by-key recursion.

import { t } from '../../i18n/index.js';
import { showError, hideError, escapeHtml } from '../../core/util.js';

function deepEquals(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEquals(a[i], b[i])) return false;
    return true;
  }
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!deepEquals(a[k], b[k])) return false;
  return true;
}

/**
 * Longest-common-subsequence array diff. Returns a script of
 * {type: 'eq' | 'add' | 'del', li, ri} steps mirroring git/diff output.
 */
function lcsArrayDiff(left, right) {
  const n = left.length, m = right.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = deepEquals(left[i], right[j])
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const script = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (deepEquals(left[i], right[j])) { script.push({ type: 'eq',  li: i,    ri: j    }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { script.push({ type: 'del', li: i,    ri: null }); i++; }
    else                                     { script.push({ type: 'add', li: null, ri: j    }); j++; }
  }
  while (i < n) script.push({ type: 'del', li: i++, ri: null });
  while (j < m) script.push({ type: 'add', li: null, ri: j++ });
  return script;
}

function jsonDiffRecurse(left, right, path, diffs) {
  if (typeof left !== typeof right || (Array.isArray(left) !== Array.isArray(right))) {
    diffs.push({ type: 'type', path, left, right });
    return;
  }
  if (left === null || right === null || typeof left !== 'object') {
    if (left !== right) diffs.push({ type: 'changed', path, left, right });
    return;
  }
  if (Array.isArray(left)) {
    const script = lcsArrayDiff(left, right);
    for (const step of script) {
      if (step.type === 'eq') continue;
      if (step.type === 'add') {
        diffs.push({ type: 'added',   path: `${path}[+${step.ri}]`, right: right[step.ri] });
      } else if (step.type === 'del') {
        diffs.push({ type: 'removed', path: `${path}[-${step.li}]`, left: left[step.li] });
      }
    }
    return;
  }
  const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of allKeys) {
    const p = path ? `${path}.${key}` : key;
    if (!(key in left)) diffs.push({ type: 'added', path: p, right: right[key] });
    else if (!(key in right)) diffs.push({ type: 'removed', path: p, left: left[key] });
    else jsonDiffRecurse(left[key], right[key], p, diffs);
  }
}

export function diffJson() {
  hideError('json-diff-error');
  const leftText = document.getElementById('json-diff-left').value.trim();
  const rightText = document.getElementById('json-diff-right').value.trim();
  const output = document.getElementById('json-diff-output');

  if (!leftText || !rightText) {
    showError('json-diff-error', t('json-diff.error.empty'));
    return;
  }

  let leftObj, rightObj;
  try { leftObj = JSON.parse(leftText); } catch (e) {
    showError('json-diff-error', t('json-diff.error.left') + e.message); return;
  }
  try { rightObj = JSON.parse(rightText); } catch (e) {
    showError('json-diff-error', t('json-diff.error.right') + e.message); return;
  }

  const diffs = [];
  jsonDiffRecurse(leftObj, rightObj, '', diffs);

  if (diffs.length === 0) {
    output.innerHTML = `<div style="color:var(--success); padding:12px; font-weight:600;">${t('json-diff.identical')}</div>`;
    return;
  }

  const icons = { added: '＋', removed: '－', changed: '≠', type: '⚑' };
  const colors = { added: 'var(--success)', removed: 'var(--error)', changed: 'var(--accent)', type: '#e67e22' };

  const html = diffs.map((d) => {
    const icon = icons[d.type] || '?';
    const color = colors[d.type] || 'var(--text)';
    let detail = '';
    if (d.type === 'changed') detail = `<span style="color:var(--error);">${escapeHtml(JSON.stringify(d.left))}</span> → <span style="color:var(--success);">${escapeHtml(JSON.stringify(d.right))}</span>`;
    else if (d.type === 'added') detail = `<span style="color:var(--success);">${escapeHtml(JSON.stringify(d.right))}</span>`;
    else if (d.type === 'removed') detail = `<span style="color:var(--error);">${escapeHtml(JSON.stringify(d.left))}</span>`;
    else if (d.type === 'type') detail = `<span style="color:var(--error);">${typeof d.left}</span> → <span style="color:var(--success);">${typeof d.right}</span>`;
    return `<div class="diff-row" style="border-left:3px solid ${color}; padding:6px 10px; margin-bottom:4px; background:var(--input-bg); border-radius:0 4px 4px 0;">
      <span style="color:${color}; font-weight:700; margin-right:8px;">${icon}</span>
      <code style="color:var(--accent); margin-right:8px;">${escapeHtml(d.path || '(root)')}</code>
      ${detail}
    </div>`;
  }).join('');

  output.innerHTML = `<div style="margin-bottom:8px; font-size:12px; color:var(--text-muted);">${t('json-diff.found').replace('{n}', diffs.length)}</div>` + html;
}
