// JSON Formatter — beautify / minify / validate / remove-nulls + tree view.
//
// jsonViewMode is module-private state (raw|tree). All four ops update the
// status pill (✓ Valid / ✗ Invalid). beautify and remove-nulls also refresh
// the tree if it's the active view.
//
// Tree view: a recursive <details> rendering. Search is debounced (200ms) at
// the call site (DOMContentLoaded in main.js), matches walk text nodes and
// wrap matches in <span class="json-tree-highlight">. Parent <details>
// elements auto-open so matches are visible.

import { t } from '../../i18n/index.js';
import { showError, hideError, escapeHtml, setEmptyState, debounce } from '../../core/util.js';

let jsonViewMode = 'raw';

export function jsonBeautify() {
  hideError('json-error');
  try {
    const input = document.getElementById('json-input').value.trim();
    if (!input) return;
    const parsed = JSON.parse(input);
    document.getElementById('json-output').value = JSON.stringify(parsed, null, 2);
    document.getElementById('json-status').textContent = t('json.valid');
    document.getElementById('json-status').style.color = 'var(--success)';
    if (jsonViewMode === 'tree') refreshJsonTree();
  } catch (e) {
    showError('json-error', t('json.error') + e.message);
    document.getElementById('json-status').textContent = t('json.invalid');
    document.getElementById('json-status').style.color = 'var(--error)';
  }
}

export function jsonMinify() {
  hideError('json-error');
  try {
    const input = document.getElementById('json-input').value.trim();
    if (!input) return;
    const parsed = JSON.parse(input);
    document.getElementById('json-output').value = JSON.stringify(parsed);
  } catch (e) {
    showError('json-error', t('json.error') + e.message);
  }
}

function removeNullsDeep(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null).map((item) => removeNullsDeep(item));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== null)
        .map(([k, v]) => [k, removeNullsDeep(v)]),
    );
  }
  return value;
}

export function jsonRemoveNulls() {
  hideError('json-error');
  try {
    const input = document.getElementById('json-input').value.trim();
    if (!input) return;
    const parsed = JSON.parse(input);
    const cleaned = removeNullsDeep(parsed);
    document.getElementById('json-output').value = JSON.stringify(cleaned, null, 2);
    document.getElementById('json-status').textContent = t('json.valid');
    document.getElementById('json-status').style.color = 'var(--success)';
    if (jsonViewMode === 'tree') {
      document.getElementById('json-tree-output').innerHTML = renderJsonTree(cleaned, '', true);
      setEmptyState('json-tree-empty', false);
    }
  } catch (e) {
    showError('json-error', t('json.error') + e.message);
    document.getElementById('json-status').textContent = t('json.invalid');
    document.getElementById('json-status').style.color = 'var(--error)';
  }
}

export function jsonValidate() {
  hideError('json-error');
  const input = document.getElementById('json-input').value.trim();
  try {
    JSON.parse(input);
    document.getElementById('json-status').textContent = t('json.valid');
    document.getElementById('json-status').style.color = 'var(--success)';
    hideError('json-error');
  } catch (e) {
    showError('json-error', t('json.error') + e.message);
    document.getElementById('json-status').textContent = t('json.invalid');
    document.getElementById('json-status').style.color = 'var(--error)';
  }
}

export function setJsonView(mode) {
  jsonViewMode = mode;
  document.getElementById('json-raw-view').style.display = mode === 'raw' ? '' : 'none';
  document.getElementById('json-tree-view').style.display = mode === 'tree' ? '' : 'none';
  document.getElementById('json-view-raw').classList.toggle('active', mode === 'raw');
  document.getElementById('json-view-tree').classList.toggle('active', mode === 'tree');
  if (mode === 'tree') refreshJsonTree();
}

function refreshJsonTree() {
  const container = document.getElementById('json-tree-output');
  try {
    const input = document.getElementById('json-input').value.trim();
    if (!input) { container.innerHTML = ''; setEmptyState('json-tree-empty', true); return; }
    const parsed = JSON.parse(input);
    container.innerHTML = renderJsonTree(parsed, '', true);
    setEmptyState('json-tree-empty', false);
  } catch (e) {
    container.innerHTML = '<span style="color:var(--error)">Invalid JSON</span>';
    setEmptyState('json-tree-empty', false);
  }
}

function renderJsonTree(data, key, isRoot) {
  if (data === null) return wrapTreeLeaf(key, '<span class="json-tree-null">null</span>');
  if (typeof data === 'boolean') return wrapTreeLeaf(key, `<span class="json-tree-bool">${data}</span>`);
  if (typeof data === 'number') return wrapTreeLeaf(key, `<span class="json-tree-number">${data}</span>`);
  if (typeof data === 'string') return wrapTreeLeaf(key, `<span class="json-tree-string">"${escapeHtml(data)}"</span>`);

  const isArray = Array.isArray(data);
  const entries = isArray ? data.map((v, i) => [i, v]) : Object.entries(data);
  const openBr = isArray ? '[' : '{';
  const closeBr = isArray ? ']' : '}';
  const count = entries.length;

  const keyHtml = key !== '' ? `<span class="json-tree-key">"${escapeHtml(String(key))}"</span>: ` : '';
  const summaryLabel = `${keyHtml}<span class="json-tree-bracket">${openBr}</span> <span style="color:var(--text-muted);font-size:11px;">${count} ${isArray ? 'items' : 'keys'}</span>`;

  let children = '';
  for (const [k, v] of entries) {
    children += renderJsonTree(v, String(k), false);
  }

  return `<details${isRoot ? ' open' : ''}>
    <summary>${summaryLabel}</summary>
    ${children}
    <div><span class="json-tree-bracket">${closeBr}</span></div>
  </details>`;
}

function wrapTreeLeaf(key, valueHtml) {
  const keyHtml = key !== '' ? `<span class="json-tree-key">"${escapeHtml(String(key))}"</span>: ` : '';
  return `<div style="margin-left:16px;">${keyHtml}${valueHtml}</div>`;
}

function searchJsonTree(query) {
  const container = document.getElementById('json-tree-output');
  // Drop any previous highlights — replaceWith(text) collapses them back.
  container.querySelectorAll('.json-tree-highlight').forEach((el) => {
    el.replaceWith(el.textContent);
  });
  if (!query) return;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const matches = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.textContent.toLowerCase().includes(query)) matches.push(node);
  }
  for (const node of matches) {
    const text = node.textContent;
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) continue;
    const span = document.createElement('span');
    span.className = 'json-tree-highlight';
    span.textContent = text.substring(idx, idx + query.length);
    const after = document.createTextNode(text.substring(idx + query.length));
    const before = document.createTextNode(text.substring(0, idx));
    const parent = node.parentNode;
    parent.insertBefore(before, node);
    parent.insertBefore(span, node);
    parent.insertBefore(after, node);
    parent.removeChild(node);
    // Auto-expand all parent <details> so the match is visible without manual clicks.
    let el = span.closest('details');
    while (el) { el.open = true; el = el.parentElement?.closest('details'); }
  }
}

/**
 * Wires the tree-search input on DOMContentLoaded. Called once from main.js.
 */
export function initJsonTreeSearch() {
  const searchInput = document.getElementById('json-tree-search');
  if (!searchInput) return;
  const debouncedSearch = debounce((value) => searchJsonTree(value), 200);
  searchInput.addEventListener('input', function () {
    debouncedSearch(this.value.trim().toLowerCase());
  });
}
