// app.js — being progressively decomposed into ES modules.
//
// Status (Sprint 5a):
//   Faz 1 ✅ extracted i18n + storage helpers
//   Faz 2 ✅ extracted core utilities (util, theme, nav, tabs, search, tab-helper, clear, feedback)
//   Faz 3a ✅ extracted dev (9), text (4), finance (2) tools
//   Faz 3b ⏳ remaining tools (db, data, ba) still inlined here
//   Faz 4 ⏳ delete this file once Faz 3b finishes
//
// Inline HTML handlers (onclick="…") still drive most interactions, so the
// public functions listed at the bottom of this file are bridged onto `window`
// for compatibility. As tools move into src/tools/*, their bridge entry follows
// them and the corresponding code disappears from this file.

import { storageGet, storageSet } from './src/core/storage.js';
import {
  t,
  applyDomI18n,
  setLang,
  getLang,
  groupKeyMap,
} from './src/i18n/index.js';
import {
  copyToClipboard,
  showError,
  hideError,
  setEmptyState,
  escapeHtml,
  debounce,
} from './src/core/util.js';
import { initTheme, toggleTheme, updateThemeBtn } from './src/core/theme.js';
import { tools, findTool } from './src/core/tool-registry.js';
import { buildNav, navigate } from './src/core/nav.js';
import {
  MAX_TABS,
  renderTabs,
  openTab,
  switchTab,
  closeTab,
  saveRecent,
  getActiveTab,
  getTabs,
} from './src/core/tabs.js';
import { initSearch } from './src/core/search.js';
import { initTabs } from './src/core/tab-helper.js';
import { toggleFeedbackMenu } from './src/core/feedback.js';
import { addClearButtons, clearPanel, noClearPanels } from './src/core/clear.js';
import { utf8ToBase64, base64ToUtf8 } from './src/core/base64-codec.js';

// Faz 3a tool imports
import { generateUUIDs } from './src/tools/dev/uuid.js';
import { tsToDate, dateToTs, setNow, initTimestampNow } from './src/tools/dev/timestamp.js';
import { decodeJWT } from './src/tools/dev/jwt.js';
import { initUrlEncoder } from './src/tools/dev/url-encoder.js';
import { shortenUrl, copyShortUrl } from './src/tools/dev/url-shortener.js';
import { runRegex, syncRegexFlags } from './src/tools/dev/regex-builder.js';
import { setCron, decodeCron } from './src/tools/dev/cron.js';
import { setHttpFilter, filterHttpStatus } from './src/tools/dev/http-status.js';
import { parseCurl } from './src/tools/dev/curl-parser.js';
import { runDiff } from './src/tools/text/diff-checker.js';
import { countWords } from './src/tools/text/word-counter.js';
import { downloadTextFile, updateEditorStats } from './src/tools/text/text-editor.js';
import { renderMarkdown } from './src/tools/text/markdown.js';
import { onTaxChange, onKistChange, calcSimpleInterest } from './src/tools/finance/interest.js';
import { calcLoanPayment } from './src/tools/finance/loan.js';
import { getCurrencyConfig } from './src/tools/finance/currency.js';


// ===== Language / i18n =====
//
// Translations + the t/setLang/getLang/applyDomI18n primitives now live in
// src/i18n/. The wrappers below add tool-specific refreshes (cheatsheets, word
// counter, loan headers) on top of applyDomI18n. They will move to per-tool
// post-apply hooks during Phase 3 of the modularization sprint.

function applyLang() {
  applyDomI18n();
  // Refresh nav group labels (built dynamically; their data-i18n key is
  // tracked on data-group-key, which i18n core doesn't know about).
  document.querySelectorAll('.tool-group-label').forEach((el) => {
    const key = el.dataset.groupKey;
    if (key) el.textContent = t(key);
  });
  // Refresh sidebar tool labels (TR/EN are stored on the tool object).
  document.querySelectorAll('.tool-nav-item').forEach((el) => {
    const tool = tools.find((t2) => t2.id === el.dataset.tool);
    if (!tool) return;
    const label = (getLang() === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
    el.querySelector('span:last-child').textContent = label;
  });
  // Update topbar title if a tool is currently active.
  const activeItem = document.querySelector('.tool-nav-item.active');
  if (activeItem) {
    const tool = tools.find((t2) => t2.id === activeItem.dataset.tool);
    if (tool) {
      const label = (getLang() === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
      document.getElementById('topbar-title').textContent = label;
    }
  }
  // Theme button text depends on current theme + language; updateThemeBtn picks the right key.
  updateThemeBtn(document.documentElement.getAttribute('data-theme'));
  // Tool-specific re-renders that consult t() at draw time.
  buildSqlCheatsheet();
  buildKqlCheatsheet();
  if (typeof filterHttpStatus === 'function' && document.getElementById('http-status-list')) filterHttpStatus();
  if (document.getElementById('wc-input') && document.getElementById('wc-input').value) {
    countWords();
  }
  // Loan amortization table headers (rendered statically in HTML once but with i18n keys).
  const loanTh = document.querySelectorAll('#panel-loan-calc thead th');
  const loanHeaders = ['loan.th.month', 'loan.th.installment', 'loan.th.principal', 'loan.th.interest', 'loan.th.remaining'];
  loanTh.forEach((th, i) => { if (loanHeaders[i]) th.textContent = t(loanHeaders[i]); });
}

function toggleLang() {
  setLang(getLang() === 'tr' ? 'en' : 'tr');
  applyLang();
}


// ===== Tool: JSON Formatter =====

function jsonBeautify() {
  hideError('json-error');
  try {
    const input = document.getElementById('json-input').value.trim();
    if (!input) return;
    const parsed = JSON.parse(input);
    document.getElementById('json-output').value = JSON.stringify(parsed, null, 2);
    document.getElementById('json-status').textContent = t('json.valid');
    document.getElementById('json-status').style.color = 'var(--success)';
  } catch (e) {
    showError('json-error', t('json.error') + e.message);
    document.getElementById('json-status').textContent = t('json.invalid');
    document.getElementById('json-status').style.color = 'var(--error)';
  }
}

function jsonMinify() {
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
    return value
      .filter(item => item !== null)
      .map(item => removeNullsDeep(item));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== null)
        .map(([k, v]) => [k, removeNullsDeep(v)])
    );
  }
  return value;
}

function jsonRemoveNulls() {
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

function jsonValidate() {
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

// ===== JSON Formatter: Tree View =====

let jsonViewMode = 'raw';

function setJsonView(mode) {
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
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('json-tree-search');
  if (searchInput) {
    const debouncedSearch = debounce(function(value) {
      searchJsonTree(value);
    }, 200);
    searchInput.addEventListener('input', function() {
      debouncedSearch(this.value.trim().toLowerCase());
    });
  }
});

function searchJsonTree(query) {
  const container = document.getElementById('json-tree-output');
  // Remove existing highlights
  container.querySelectorAll('.json-tree-highlight').forEach(el => {
    el.replaceWith(el.textContent);
  });
  if (!query) return;

  // Highlight matching text in keys and values
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const matches = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.textContent.toLowerCase().includes(query)) {
      matches.push(node);
    }
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
    // Expand parent details
    let el = span.closest('details');
    while (el) { el.open = true; el = el.parentElement?.closest('details'); }
  }
}

// Override beautify to also update tree
const _origBeautify = jsonBeautify;
jsonBeautify = function() {
  _origBeautify();
  if (jsonViewMode === 'tree') refreshJsonTree();
};

// ===== Tool: Base64 =====

function base64Encode() {
  hideError('base64-error');
  try {
    const input = document.getElementById('b64-raw').value;
    document.getElementById('b64-encoded').value = utf8ToBase64(input);
  } catch (e) {
    showError('base64-error', t('b64.error.encode') + e.message);
  }
}

function base64Decode() {
  hideError('base64-error');
  try {
    const input = document.getElementById('b64-encoded').value;
    document.getElementById('b64-raw').value = base64ToUtf8(input);
  } catch (e) {
    showError('base64-error', t('b64.error.decode'));
  }
}

// ===== Tool: CSV to JSON =====

/**
 * RFC 4180-compliant CSV parser. Handles:
 *  - Quoted fields (commas / delimiters inside quotes)
 *  - Escaped quotes inside quoted fields ("" -> ")
 *  - CRLF / LF / CR line endings
 *  - Multiline fields when wrapped in quotes
 * @param {string} text - raw CSV input
 * @param {string} delimiter - field separator (default ',')
 * @returns {string[][]} array of rows, each row an array of cell strings
 */
function parseCSV(text, delimiter) {
  const sep = (delimiter || ',').charAt(0) || ',';
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQuotes = false;
  const n = text.length;

  while (i < n) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === sep) { row.push(field); field = ''; i++; continue; }
    if (ch === '\r') {
      // Treat CRLF as one terminator
      row.push(field); field = ''; rows.push(row); row = [];
      if (text[i + 1] === '\n') i++;
      i++; continue;
    }
    if (ch === '\n') {
      row.push(field); field = ''; rows.push(row); row = [];
      i++; continue;
    }
    field += ch; i++;
  }
  // Flush trailing field/row (no final newline case)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop fully-empty trailing rows
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }
  return rows;
}

function csvToJson() {
  hideError('csv-error');
  try {
    const input = document.getElementById('csv-input').value;
    if (!input.trim()) return;
    const hasHeaders = document.getElementById('csv-headers').checked;
    const delimiter = document.getElementById('csv-delimiter').value || ',';

    const rows = parseCSV(input, delimiter);
    if (rows.length === 0) { document.getElementById('csv-output').value = '[]'; return; }

    let result;
    if (hasHeaders) {
      const headers = rows[0];
      result = rows.slice(1).map(vals => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = vals[i] ?? '');
        return obj;
      });
    } else {
      result = rows;
    }

    document.getElementById('csv-output').value = JSON.stringify(result, null, 2);
  } catch (e) {
    showError('csv-error', t('csv.error') + e.message);
  }
}

// ===== Tool: SQL Formatter =====

// Replace string literals, quoted identifiers, and comments with placeholders so the formatter
// only touches actual SQL keywords. Restored after newline insertion.
function maskSqlLiterals(sql) {
  const literals = [];
  const masked = sql.replace(
    // single-quoted strings (with doubled-quote escapes), double-quoted identifiers,
    // backtick identifiers, line comments, block comments
    /'(?:[^']|'')*'|"(?:[^"]|"")*"|`(?:[^`]|``)*`|--[^\n]*|\/\*[\s\S]*?\*\//g,
    (match) => {
      const token = `SQLLIT${literals.length}`;
      literals.push(match);
      return token;
    }
  );
  return { masked, literals };
}

function unmaskSqlLiterals(text, literals) {
  return text.replace(/SQLLIT(\d+)/g, (_, idx) => literals[Number(idx)]);
}

function formatSQL() {
  const input = document.getElementById('sql-input').value;

  // Mask literals so 'SELECT' inside a string doesn't get reformatted.
  const { masked, literals } = maskSqlLiterals(input);

  let sql = masked.replace(/\s+/g, ' ').trim();
  sql = sql.toUpperCase();

  const newlineKeywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
    'INNER JOIN', 'ON', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'UNION', 'UNION ALL'];

  newlineKeywords.forEach(kw => {
    sql = sql.replace(new RegExp(`\\b${kw}\\b`, 'g'), '\n' + kw);
  });

  sql = sql.replace(/,\s*/g, ',\n    ');
  sql = unmaskSqlLiterals(sql, literals);
  document.getElementById('sql-output').value = sql.trim();
}

// ===== Tool: JSON Grid =====

function renderJsonGrid() {
  hideError('json-grid-error');
  const input = document.getElementById('json-grid-input').value.trim();
  const container = document.getElementById('json-grid-output');
  container.innerHTML = '';
  if (!input) return;
  try {
    const data = JSON.parse(input);
    const toolbar = document.createElement('div');
    toolbar.className = 'json-grid-toolbar';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-secondary';
    copyBtn.style.cssText = 'font-size:11px; padding:4px 10px;';
    copyBtn.textContent = 'Tablo Kopyala (TSV)';
    copyBtn.addEventListener('click', () => copyJsonGridAsTable(copyBtn));
    toolbar.appendChild(copyBtn);
    container.appendChild(toolbar);
    container.appendChild(buildGridNode(data, 0));
  } catch (e) {
    showError('json-grid-error', t('json.error') + e.message);
  }
}

function copyJsonGridAsTable(btn) {
  const table = document.querySelector('#json-grid-output table');
  if (!table) { alert('Kopyalanacak tablo bulunamadı.'); return; }
  const rows = [...table.querySelectorAll('tr')];
  const tsv = rows.map(row =>
    [...row.querySelectorAll('th, td')]
      .map(cell => cell.textContent.trim().replace(/[\t\n]/g, ' '))
      .join('\t')
  ).join('\n');
  copyToClipboard(tsv, btn);
}

function buildGridNode(data, depth) {
  if (Array.isArray(data)) {
    if (data.length === 0) return createGridSpan('[]', 'json-grid-null');

    if (typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
      const keys = [...new Set(data.flatMap(obj => Object.keys(obj)))];
      const table = document.createElement('table');
      table.className = 'json-grid-table';
      const thead = table.createTHead();
      const headerRow = thead.insertRow();
      const thIdx = document.createElement('th');
      thIdx.textContent = '#';
      thIdx.className = 'json-grid-idx';
      headerRow.appendChild(thIdx);
      keys.forEach(k => {
        const th = document.createElement('th');
        th.textContent = k;
        headerRow.appendChild(th);
      });
      const tbody = table.createTBody();
      data.forEach((row, i) => {
        const tr = tbody.insertRow();
        const tdIdx = tr.insertCell();
        tdIdx.className = 'json-grid-idx';
        tdIdx.textContent = i;
        keys.forEach(k => {
          const td = tr.insertCell();
          setGridCell(td, row[k], depth);
        });
      });
      return table;
    }

    // Array of primitives / mixed
    const table = document.createElement('table');
    table.className = 'json-grid-table';
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const thIdx = document.createElement('th');
    thIdx.textContent = '#';
    thIdx.className = 'json-grid-idx';
    headerRow.appendChild(thIdx);
    const thVal = document.createElement('th');
    thVal.textContent = 'Değer';
    headerRow.appendChild(thVal);
    const tbody = table.createTBody();
    data.forEach((item, i) => {
      const tr = tbody.insertRow();
      const tdIdx = tr.insertCell();
      tdIdx.className = 'json-grid-idx';
      tdIdx.textContent = i;
      setGridCell(tr.insertCell(), item, depth);
    });
    return table;
  }

  if (typeof data === 'object' && data !== null) {
    const table = document.createElement('table');
    table.className = 'json-grid-table';
    const tbody = table.createTBody();
    Object.entries(data).forEach(([k, v]) => {
      const tr = tbody.insertRow();
      const tdKey = tr.insertCell();
      tdKey.className = 'json-grid-key';
      tdKey.textContent = k;
      setGridCell(tr.insertCell(), v, depth);
    });
    return table;
  }

  return createGridSpan(String(data), typeof data === 'number' ? 'json-grid-number' : typeof data === 'boolean' ? 'json-grid-bool' : '');
}

function setGridCell(td, val, depth) {
  if (val === undefined || val === null) {
    td.appendChild(createGridSpan('null', 'json-grid-null'));
  } else if (typeof val === 'object') {
    const isArr = Array.isArray(val);
    const count = isArr ? val.length : Object.keys(val).length;
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.className = 'json-grid-nested';
    summary.style.cursor = 'pointer';
    summary.textContent = isArr
      ? `[${count} ${getLang() === 'en' ? 'item' : 'öğe'}]`
      : `{${count} ${getLang() === 'en' ? 'field' : 'alan'}}`;
    details.appendChild(summary);
    details.appendChild(buildGridNode(val, depth + 1));
    if (depth < 1) details.open = true;
    td.appendChild(details);
  } else if (typeof val === 'boolean') {
    td.appendChild(createGridSpan(String(val), 'json-grid-bool'));
  } else if (typeof val === 'number') {
    td.appendChild(createGridSpan(String(val), 'json-grid-number'));
  } else {
    td.textContent = val;
  }
}

function createGridSpan(text, className) {
  const span = document.createElement('span');
  if (className) span.className = className;
  span.textContent = text;
  return span;
}

// ===== Tool: JSON Escape =====

function jsonEscapeStr() {
  hideError('json-escape-error');
  const input = document.getElementById('json-escape-input').value;
  // JSON.stringify wraps with outer quotes — strip them to give just the escaped content
  document.getElementById('json-escape-output').value = JSON.stringify(input).slice(1, -1);
}

function jsonUnescapeStr() {
  hideError('json-escape-error');
  const raw = document.getElementById('json-escape-output').value.trim();
  if (!raw) return;
  // Wrap in quotes if not already present, so JSON.parse can handle bare escaped strings
  const toparse = (raw.startsWith('"') && raw.endsWith('"')) ? raw : '"' + raw + '"';
  try {
    const parsed = JSON.parse(toparse);
    document.getElementById('json-escape-input').value = parsed;
  } catch (e) {
    showError('json-escape-error', t('json-esc.error') + e.message);
  }
}

function jsonSwap() {
  const top = document.getElementById('json-escape-input');
  const bot = document.getElementById('json-escape-output');
  const tmp = top.value;
  top.value = bot.value;
  bot.value = tmp;
  hideError('json-escape-error');
}

// ===== Tool: JSON Diff =====

function diffJson() {
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

  const html = diffs.map(d => {
    const icons = { added: '＋', removed: '－', changed: '≠', type: '⚑' };
    const colors = { added: 'var(--success)', removed: 'var(--error)', changed: 'var(--accent)', type: '#e67e22' };
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

// Deep equality check used by the LCS array-diff matcher.
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

// Longest Common Subsequence over two arrays — same shape used by Git/Diff tools.
// Returns a script of {type: 'eq'|'add'|'del', li, ri} steps, where li/ri are indices in left/right.
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
    // LCS-based diffing: an insertion at index 0 no longer cascades a "changed" verdict
    // across every subsequent element.
    const script = lcsArrayDiff(left, right);
    for (const step of script) {
      if (step.type === 'eq') continue;
      if (step.type === 'add') {
        diffs.push({ type: 'added',   path: `${path}[+${step.ri}]`, right: right[step.ri] });
      } else if (step.type === 'del') {
        diffs.push({ type: 'removed', path: `${path}[-${step.li}]`, left:  left[step.li] });
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

// ===== Tool: File to Base64 =====

function fileToBase64() {
  const fileInput = document.getElementById('file-to-b64-input');
  const file = fileInput.files[0];
  if (!file) { alert('Lütfen bir dosya seçin.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const b64 = reader.result.split(',')[1];
    document.getElementById('file-b64-output').value = b64;
    document.getElementById('file-b64-info').textContent =
      `${file.name} · ${formatBytes(file.size)} → ${b64.length} karakter`;
  };
  reader.readAsDataURL(file);
}

function base64ToFile() {
  const b64 = document.getElementById('b64-to-file-input').value.trim();
  const filename = document.getElementById('b64-target-filename').value.trim() || 'dosya';
  if (!b64) return;
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes]));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    showError('base64-error', t('b64.error.decode'));
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// ===== Tool: KQL Formatter =====

function formatKQL() {
  const input = document.getElementById('kql-input').value.trim();
  if (!input) return;

  // Handle multi-statement (semicolons between let statements)
  const statements = input.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
  const formatted = statements.map(stmt => {
    // Split on pipe, keeping let blocks together
    const parts = stmt.split(/\s*\|\s*/);
    return parts.map((part, i) => {
      part = part.trim();
      if (!part) return null;
      // Indent sub-clauses within each pipe: and/or on new lines
      part = part.replace(/\band\b/gi, '\n    and').replace(/\bor\b(?!\s*\()/gi, '\n    or');
      return i === 0 ? part : '| ' + part;
    }).filter(Boolean).join('\n');
  }).join('\n\n');

  document.getElementById('kql-output').value = formatted;
}

// ===== Tool: KQL Cheatsheet =====

const kqlKeywords = [
  { kw: 'where',       desc: 'Satırları filtreler. SQL WHERE gibi. Örn: | where Level == "Error"',                          descEn: 'Filters rows. Like SQL WHERE. e.g., | where Level == "Error"' },
  { kw: 'project',     desc: 'Sütun seçer. SQL SELECT gibi. Örn: | project TimeGenerated, Message',                         descEn: 'Selects columns. Like SQL SELECT. e.g., | project TimeGenerated, Message' },
  { kw: 'summarize',   desc: 'Gruplama ve agregasyon. SQL GROUP BY gibi. Örn: | summarize count() by Category',              descEn: 'Grouping and aggregation. Like SQL GROUP BY. e.g., | summarize count() by Category' },
  { kw: 'order by',    desc: 'Sonuçları sıralar. asc (artan) veya desc (azalan). Örn: | order by TimeGenerated desc',       descEn: 'Sorts results. asc (ascending) or desc (descending). e.g., | order by TimeGenerated desc' },
  { kw: 'take / limit',desc: 'İlk N kaydı döner. Keşif için kullanılır. Örn: | take 100',                                   descEn: 'Returns the first N records. Used for exploration. e.g., | take 100' },
  { kw: 'distinct',    desc: 'Tekil değerleri döner. SQL DISTINCT gibi. Örn: | distinct Category',                          descEn: 'Returns unique values. Like SQL DISTINCT. e.g., | distinct Category' },
  { kw: 'extend',      desc: 'Hesaplanmış yeni sütun ekler. Örn: | extend Toplam = Adet * Fiyat',                           descEn: 'Adds a new calculated column. e.g., | extend Total = Count * Price' },
  { kw: 'ago()',       desc: 'Belirli süre öncesi. Örn: ago(1h) = 1 saat önce, ago(7d) = 7 gün önce',                      descEn: 'Refers to a time period ago. e.g., ago(1h) = 1 hour ago, ago(7d) = 7 days ago' },
  { kw: 'contains',   desc: 'Metin içerme kontrolü (büyük/küçük harf duyarsız). Örn: | where Message contains "hata"',     descEn: 'Case-insensitive text search. e.g., | where Message contains "error"' },
  { kw: 'count()',     desc: 'Kayıt sayısını hesaplar. Örn: | summarize count() by Durum',                                  descEn: 'Counts records. e.g., | summarize count() by Status' },
];

const kqlTemplates = [
  {
    category: 'Temel Sorgular', categoryEn: 'Basic Queries',
    templates: [
      { name: 'Son 1 saatin kayıtları',    nameEn: 'Last 1 hour records',       sql: `TableName\n| where TimeGenerated > ago(1h)\n| order by TimeGenerated desc\n| take 100` },
      { name: 'Belirli değere göre filtre',nameEn: 'Filter by specific value',   sql: `TableName\n| where TimeGenerated > ago(24h)\n| where Durum == "Hata"\n| project TimeGenerated, Mesaj, Durum, Kaynak\n| order by TimeGenerated desc` },
      { name: 'Metin arama',               nameEn: 'Text search',                sql: `TableName\n| where TimeGenerated > ago(7d)\n| where Mesaj contains "anahtar_kelime"\n| order by TimeGenerated desc` },
    ]
  },
  {
    category: 'Sayma & Gruplama', categoryEn: 'Count & Group',
    templates: [
      { name: 'Alana göre kayıt sayısı', nameEn: 'Count records by field',    sql: `TableName\n| where TimeGenerated > ago(7d)\n| summarize Adet=count() by Kategori\n| order by Adet desc` },
      { name: 'Tekil değer sayısı',      nameEn: 'Unique value count',         sql: `TableName\n| where TimeGenerated > ago(30d)\n| summarize TekliKullanici=dcount(KullaniciId) by Departman\n| order by TekliKullanici desc` },
      { name: 'Top N',                   nameEn: 'Top N',                      sql: `TableName\n| where TimeGenerated > ago(7d)\n| summarize Adet=count() by Kategori\n| top 10 by Adet desc` },
    ]
  },
  {
    category: 'Zaman Bazlı Analiz', categoryEn: 'Time-Based Analysis',
    templates: [
      { name: 'Günlük kayıt özeti',  nameEn: 'Daily record summary',  sql: `TableName\n| where TimeGenerated > ago(30d)\n| summarize Adet=count() by bin(TimeGenerated, 1d)\n| order by TimeGenerated asc` },
      { name: 'Saatlik trend (grafik)', nameEn: 'Hourly trend (chart)',sql: `TableName\n| where TimeGenerated > ago(7d)\n| summarize Adet=count() by bin(TimeGenerated, 1h)\n| render timechart` },
      { name: 'Belirli tarih aralığı', nameEn: 'Specific date range', sql: `TableName\n| where TimeGenerated between (datetime(2024-01-01) .. datetime(2024-03-31))\n| summarize Adet=count() by Kategori\n| order by Adet desc` },
    ]
  },
  {
    category: 'Veri Keşfi', categoryEn: 'Data Exploration',
    templates: [
      { name: 'Tekil değerleri listele', nameEn: 'List unique values',   sql: `TableName\n| where TimeGenerated > ago(7d)\n| distinct Kategori, AltKategori\n| order by Kategori asc` },
      { name: 'Boş / NULL kayıtlar',    nameEn: 'Empty / NULL records',  sql: `TableName\n| where TimeGenerated > ago(30d)\n| where isempty(Deger) or isnull(Deger)\n| project TimeGenerated, Id, Deger` },
      { name: 'Örnek veri önizleme',    nameEn: 'Sample data preview',   sql: `TableName\n| take 20` },
    ]
  },
];

function buildKqlCheatsheet() {
  const container = document.getElementById('kql-template-grid');
  if (!container) return;
  container.innerHTML = '';

  buildKeywordCards(kqlKeywords, container);

  kqlTemplates.forEach(cat => {
    const section = document.createElement('div');
    section.style.marginBottom = '28px';
    const h4 = document.createElement('h4');
    h4.textContent = (getLang() === 'en' && cat.categoryEn) ? cat.categoryEn : cat.category;
    h4.style.cssText = 'font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border);';
    section.appendChild(h4);
    const grid = document.createElement('div');
    grid.className = 'sql-template-grid';

    cat.templates.forEach(tmpl => {
      const card = document.createElement('div');
      card.className = 'sql-template-card';
      const name = document.createElement('div');
      name.className = 'sql-template-name';
      name.textContent = (getLang() === 'en' && tmpl.nameEn) ? tmpl.nameEn : tmpl.name;
      const pre = document.createElement('pre');
      pre.className = 'sql-template-preview';
      pre.textContent = tmpl.sql;
      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group';
      btnGroup.style.marginBottom = '0';
      const btnExport = document.createElement('button');
      btnExport.className = 'btn btn-primary';
      btnExport.style.cssText = 'font-size:11px; padding:5px 10px;';
      btnExport.textContent = t('kql.export');
      btnExport.addEventListener('click', () => {
        navigate('kql-formatter');
        document.getElementById('kql-input').value = tmpl.sql;
      });
      const btnCopy = document.createElement('button');
      btnCopy.className = 'btn btn-secondary';
      btnCopy.style.cssText = 'font-size:11px; padding:5px 10px;';
      btnCopy.textContent = t('copy');
      btnCopy.addEventListener('click', () => copyToClipboard(tmpl.sql, btnCopy));
      btnGroup.appendChild(btnExport);
      btnGroup.appendChild(btnCopy);
      card.appendChild(name);
      card.appendChild(pre);
      card.appendChild(btnGroup);
      grid.appendChild(card);
    });
    section.appendChild(grid);
    container.appendChild(section);
  });
}

// ===== User Story Writer =====

let acCount = 0;
let checklistCount = 0;
let acMode = 'gherkin';

function setAcMode(mode) {
  acMode = mode;
  document.getElementById('ac-gherkin-mode').style.display = mode === 'gherkin' ? '' : 'none';
  document.getElementById('ac-checklist-mode').style.display = mode === 'checklist' ? '' : 'none';
  document.getElementById('ac-mode-gherkin').classList.toggle('active', mode === 'gherkin');
  document.getElementById('ac-mode-checklist').classList.toggle('active', mode === 'checklist');
}

function addAcBlock() {
  acCount++;
  const n = acCount;
  const list = document.getElementById('ac-list');
  const block = document.createElement('div');
  block.className = 'ac-block';
  block.dataset.ac = n;
  block.innerHTML = `
    <div class="ac-block-title">${t('us.ac-label')} #${n}</div>
    <button class="ac-remove" onclick="removeAcBlock(${n})" title="Kaldır">✕</button>
    <div class="ac-row">
      <label>${t('us.given')}</label>
      <input type="text" id="us-given-${n}" placeholder="${t('us.given.ph')}">
    </div>
    <div class="ac-row">
      <label>${t('us.when')}</label>
      <input type="text" id="us-when-${n}" placeholder="${t('us.when.ph')}">
    </div>
    <div class="ac-row">
      <label>${t('us.then')}</label>
      <input type="text" id="us-then-${n}" placeholder="${t('us.then.ph')}">
    </div>`;
  list.appendChild(block);
}

function removeAcBlock(n) {
  const block = document.querySelector(`.ac-block[data-ac="${n}"]`);
  if (block) block.remove();
}

function addChecklistItem() {
  checklistCount++;
  const n = checklistCount;
  const list = document.getElementById('ac-checklist-list');
  const item = document.createElement('div');
  item.className = 'checklist-item';
  item.dataset.cl = n;
  item.innerHTML = `
    <input type="text" id="us-cl-${n}" data-i18n-placeholder="us.checklist-item.ph" placeholder="${t('us.checklist-item.ph') || 'Kabul kriteri...'}">
    <button class="ac-remove" onclick="removeChecklistItem(${n})" title="Kaldır">✕</button>`;
  list.appendChild(item);
}

function removeChecklistItem(n) {
  const item = document.querySelector(`.checklist-item[data-cl="${n}"]`);
  if (item) item.remove();
}

function toggleInvest(btn) {
  btn.classList.toggle('active');
  const score = document.querySelectorAll('.invest-chip.active').length;
  const scoreEl = document.getElementById('invest-score');
  scoreEl.textContent = `${score}/6`;
  scoreEl.className = 'invest-score ' + (score < 4 ? 'low' : score < 6 ? 'mid' : 'high');
}

function getInvestScore() {
  const chips = document.querySelectorAll('.invest-chip.active');
  return Array.from(chips).map(c => c.dataset.invest).join('');
}

function buildUserStory() {
  const storyId = document.getElementById('us-story-id').value.trim();
  const storyTitle = document.getElementById('us-story-title').value.trim();
  const epic = document.getElementById('us-epic').value.trim();
  const priority = document.getElementById('us-priority').value;
  const points = document.getElementById('us-points').value;
  const role = document.getElementById('us-role').value.trim();
  const action = document.getElementById('us-action').value.trim();
  const benefit = document.getElementById('us-benefit').value.trim();

  if (!role && !action && !benefit) return;

  let text = '';

  // Header
  if (storyId || storyTitle) {
    text += `${storyId ? '[' + storyId + '] ' : ''}${storyTitle || ''}\n`;
  }
  if (epic) text += `Epic: ${epic}\n`;
  if (priority) {
    const pMap = { must: 'Must Have', should: 'Should Have', could: 'Could Have', wont: "Won't Have" };
    text += `Priority: ${pMap[priority] || priority}\n`;
  }
  if (points) text += `Story Points: ${points}\n`;
  if (storyId || storyTitle || epic || priority || points) text += '\n';

  // Core story
  text += `As a ${role || '...'},\nI want to ${action || '...'},\nSo that ${benefit || '...'}.`;

  // AC
  if (acMode === 'gherkin') {
    const blocks = document.querySelectorAll('#ac-list .ac-block');
    if (blocks.length > 0) {
      text += '\n\nAcceptance Criteria:';
      blocks.forEach(block => {
        const n = block.dataset.ac;
        const given = document.getElementById(`us-given-${n}`)?.value.trim() || '...';
        const when  = document.getElementById(`us-when-${n}`)?.value.trim()  || '...';
        const then  = document.getElementById(`us-then-${n}`)?.value.trim()  || '...';
        text += `\n  Given ${given},\n  When ${when},\n  Then ${then}.`;
      });
    }
  } else {
    const items = document.querySelectorAll('#ac-checklist-list .checklist-item');
    if (items.length > 0) {
      text += '\n\nAcceptance Criteria:';
      items.forEach(item => {
        const n = item.dataset.cl;
        const val = document.getElementById(`us-cl-${n}`)?.value.trim() || '...';
        text += `\n  [ ] ${val}`;
      });
    }
  }

  // Additional sections
  const rules = document.getElementById('us-business-rules').value.trim();
  const nfr = document.getElementById('us-nfr').value.trim();
  const deps = document.getElementById('us-dependencies').value.trim();
  if (rules) text += `\n\nBusiness Rules:\n${rules}`;
  if (nfr) text += `\n\nNon-Functional Requirements:\n${nfr}`;
  if (deps) text += `\n\nDependencies & Assumptions:\n${deps}`;

  // INVEST
  const invest = getInvestScore();
  if (invest) text += `\n\nINVEST: ${invest} (${invest.length}/6)`;

  // DoD
  const dodItems = document.querySelectorAll('.dod-item');
  const dodChecked = Array.from(dodItems).filter(i => i.checked);
  if (dodChecked.length > 0) {
    text += '\n\nDefinition of Done:';
    dodChecked.forEach(item => {
      text += `\n  [x] ${item.parentElement.textContent.trim()}`;
    });
  }

  const out = document.getElementById('us-output');
  out.value = text;
  document.getElementById('us-output-card').style.display = '';
}

function clearUserStory() {
  ['us-role','us-action','us-benefit','us-story-id','us-story-title','us-epic','us-business-rules','us-nfr','us-dependencies'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('us-priority').value = '';
  document.getElementById('us-points').value = '';
  document.getElementById('ac-list').innerHTML = '';
  document.getElementById('ac-checklist-list').innerHTML = '';
  acCount = 0;
  checklistCount = 0;
  document.querySelectorAll('.invest-chip').forEach(c => c.classList.remove('active'));
  const scoreEl = document.getElementById('invest-score');
  scoreEl.textContent = '0/6';
  scoreEl.className = 'invest-score';
  document.querySelectorAll('.dod-item').forEach(i => { i.checked = false; });
  document.getElementById('us-output').value = '';
  document.getElementById('us-output-card').style.display = 'none';
}

function copyUserStory() {
  const out = document.getElementById('us-output');
  if (!out.value) return;
  navigator.clipboard.writeText(out.value);
}

function copyUserStoryMd() {
  const out = document.getElementById('us-output');
  if (!out.value) return;
  let md = out.value;
  md = md.replace(/^(\[.+?\].*)$/m, '## $1');
  md = md.replace(/^(As a .+)$/m, '**$1**');
  md = md.replace(/^(I want to .+)$/m, '**$1**');
  md = md.replace(/^(So that .+)$/m, '**$1**');
  md = md.replace(/^(Acceptance Criteria:)$/m, '\n### $1');
  md = md.replace(/^(Business Rules:)$/m, '\n### $1');
  md = md.replace(/^(Non-Functional Requirements:)$/m, '\n### $1');
  md = md.replace(/^(Dependencies & Assumptions:)$/m, '\n### $1');
  md = md.replace(/^(Definition of Done:)$/m, '\n### $1');
  md = md.replace(/^  (Given|When|Then) /gm, '- **$1** ');
  md = md.replace(/^  \[( |x)\] /gm, '- [$1] ');
  navigator.clipboard.writeText(md);
}

function copyUserStoryJira() {
  const out = document.getElementById('us-output');
  if (!out.value) return;
  let jira = out.value;
  jira = jira.replace(/^(\[.+?\].*)$/m, 'h2. $1');
  jira = jira.replace(/^(Acceptance Criteria:)$/m, 'h3. $1');
  jira = jira.replace(/^(Business Rules:)$/m, 'h3. $1');
  jira = jira.replace(/^(Non-Functional Requirements:)$/m, 'h3. $1');
  jira = jira.replace(/^(Dependencies & Assumptions:)$/m, 'h3. $1');
  jira = jira.replace(/^(Definition of Done:)$/m, 'h3. $1');
  jira = jira.replace(/^  (Given|When|Then) /gm, '* *$1* ');
  jira = jira.replace(/^  \[( |x)\] /gm, '* ');
  navigator.clipboard.writeText(jira);
}


// ===== Tool: SQL Cheatsheet =====

const sqlKeywords = [
  { kw: 'SELECT',    desc: 'Hangi sütunları getireceğini belirtir. SELECT * tüm sütunları, SELECT a,b sadece a ve b sütunlarını döner.',                                  descEn: 'Specifies which columns to retrieve. SELECT * returns all columns, SELECT a,b returns only a and b.' },
  { kw: 'FROM',      desc: 'Verinin hangi tablodan okunacağını belirtir. Birden fazla tablo için JOIN kullanılır.',                                                        descEn: 'Specifies which table to read from. Use JOIN for multiple tables.' },
  { kw: 'WHERE',     desc: 'Satırları filtreler. Koşul sağlamayan satırlar sonuca dahil edilmez. Agregasyon sonrası filtre için HAVING kullanılır.',                       descEn: 'Filters rows. Rows not matching the condition are excluded. Use HAVING for post-aggregation filtering.' },
  { kw: 'DISTINCT',  desc: 'Tekrar eden satırları kaldırır. SELECT DISTINCT şehir: her şehri yalnızca bir kez döner.',                                                    descEn: 'Removes duplicate rows. SELECT DISTINCT city returns each city only once.' },
  { kw: 'JOIN',      desc: 'İki tabloyu birleştirir. INNER: her iki tarafta eşleşen satırlar. LEFT: sol tablo tam + sağ taraf NULL olabilir. RIGHT: sağ tablo tam.',      descEn: 'Combines two tables. INNER: matching rows on both sides. LEFT: full left table + right side can be NULL. RIGHT: full right table.' },
  { kw: 'GROUP BY',  desc: 'Satırları belirtilen sütuna göre gruplar. COUNT/SUM/AVG gibi agregasyon fonksiyonlarıyla kullanılır.',                                        descEn: 'Groups rows by the specified column. Used with aggregation functions like COUNT/SUM/AVG.' },
  { kw: 'HAVING',    desc: 'GROUP BY sonrası gruplara filtre uygular. WHERE satırlara filtre uygularken HAVING gruplara uygular.',                                        descEn: 'Applies filter to groups after GROUP BY. WHERE filters rows, HAVING filters groups.' },
  { kw: 'ORDER BY',  desc: 'Sonuçları sıralar. ASC artan (varsayılan), DESC azalan. Birden fazla sütunla kullanılabilir.',                                               descEn: 'Sorts results. ASC ascending (default), DESC descending. Can use multiple columns.' },
  { kw: 'LIKE',      desc: 'Metin arama deseni. % sıfır veya daha fazla karakter, _ tam olarak bir karakter. Örn: LIKE \'%ahmet%\'',                                     descEn: 'Text search pattern. % matches zero or more characters, _ exactly one. e.g., LIKE \'%john%\'' },
  { kw: 'COALESCE',  desc: 'İlk NULL olmayan değeri döner. COALESCE(a, b, c): a NULL ise b\'ye, o da NULL ise c\'ye bakar. NULL alanları varsayılan değerle doldurmak için kullanılır.', descEn: 'Returns the first non-NULL value. COALESCE(a, b, c): if a is NULL tries b, then c. Used to fill NULL fields with defaults.' },
  { kw: 'IN',        desc: 'Değerin bir liste içinde olup olmadığını kontrol eder. WHERE şehir IN (\'İstanbul\', \'Ankara\') — OR zincirine alternatif.',                 descEn: 'Checks if a value is in a list. WHERE city IN (\'London\', \'Paris\') — alternative to OR chain.' },
  { kw: 'BETWEEN',   desc: 'Değerin bir aralıkta olup olmadığını kontrol eder (sınırlar dahil). Örn: WHERE fiyat BETWEEN 100 AND 500',                                    descEn: 'Checks if a value is within a range (inclusive). e.g., WHERE price BETWEEN 100 AND 500' },
  { kw: 'IS NULL',   desc: 'Değerin NULL (boş) olup olmadığını kontrol eder. = NULL kullanılmaz; IS NULL ya da IS NOT NULL kullanılır.',                                  descEn: 'Checks if a value is NULL (empty). Don\'t use = NULL; use IS NULL or IS NOT NULL.' },
  { kw: 'CASE WHEN', desc: 'Koşullu ifade (if-else). CASE WHEN koşul THEN değer ELSE varsayılan END. SELECT içinde hesaplanmış sütun yaratmak için kullanılır.',         descEn: 'Conditional expression (if-else). CASE WHEN condition THEN value ELSE default END. Creates calculated columns in SELECT.' },
  { kw: 'EXISTS',    desc: 'Alt sorgunun en az bir satır döndürüp döndürmediğini kontrol eder. IN\'e göre büyük veri setlerinde daha performanslı olabilir.',             descEn: 'Checks if a subquery returns at least one row. Can be more efficient than IN for large datasets.' },
];

const sqlTemplates = [
  {
    category: 'Temel Sorgular', categoryEn: 'Basic Queries',
    templates: [
      { name: 'SELECT *',                 nameEn: 'SELECT *',                  sql: `SELECT *\nFROM tablo_adi\nWHERE koşul = 'değer'\nORDER BY sütun ASC\nLIMIT 100;` },
      { name: 'SELECT belirli sütunlar',  nameEn: 'SELECT specific columns',   sql: `SELECT\n    id,\n    ad,\n    email,\n    olusturma_tarihi\nFROM kullanicilar\nWHERE aktif = 1\nORDER BY ad ASC;` },
      { name: 'INSERT INTO',              nameEn: 'INSERT INTO',               sql: `INSERT INTO tablo_adi (sütun1, sütun2, sütun3)\nVALUES ('değer1', 'değer2', 'değer3');` },
      { name: 'UPDATE',                   nameEn: 'UPDATE',                    sql: `UPDATE tablo_adi\nSET\n    sütun1 = 'yeni_değer1',\n    sütun2 = 'yeni_değer2'\nWHERE id = 1;` },
      { name: 'DELETE',                   nameEn: 'DELETE',                    sql: `DELETE FROM tablo_adi\nWHERE id = 1;` },
    ]
  },
  {
    category: 'JOIN Sorguları', categoryEn: 'JOIN Queries',
    templates: [
      { name: 'INNER JOIN',  nameEn: 'INNER JOIN',    sql: `SELECT\n    a.id,\n    a.ad,\n    b.sütun\nFROM tablo_a a\nINNER JOIN tablo_b b ON a.b_id = b.id\nWHERE a.aktif = 1;` },
      { name: 'LEFT JOIN',   nameEn: 'LEFT JOIN',     sql: `SELECT\n    a.id,\n    a.ad,\n    b.sütun\nFROM tablo_a a\nLEFT JOIN tablo_b b ON a.b_id = b.id;` },
      { name: 'Çoklu JOIN',  nameEn: 'Multiple JOINs',sql: `SELECT\n    s.id AS siparis_id,\n    k.ad AS musteri,\n    u.ad AS urun,\n    sd.adet,\n    sd.birim_fiyat\nFROM siparisler s\nINNER JOIN musteriler k ON s.musteri_id = k.id\nINNER JOIN siparis_detay sd ON s.id = sd.siparis_id\nINNER JOIN urunler u ON sd.urun_id = u.id\nWHERE s.tarih >= '2024-01-01'\nORDER BY s.tarih DESC;` },
    ]
  },
  {
    category: 'Agregasyon & Gruplama', categoryEn: 'Aggregation & Grouping',
    templates: [
      { name: 'GROUP BY + COUNT/SUM', nameEn: 'GROUP BY + COUNT/SUM', sql: `SELECT\n    kategori,\n    COUNT(*) AS adet,\n    SUM(tutar) AS toplam,\n    AVG(tutar) AS ortalama\nFROM siparisler\nWHERE tarih >= '2024-01-01'\nGROUP BY kategori\nHAVING COUNT(*) > 5\nORDER BY toplam DESC;` },
      { name: 'DISTINCT COUNT',       nameEn: 'DISTINCT COUNT',       sql: `SELECT\n    COUNT(*) AS toplam_siparis,\n    COUNT(DISTINCT musteri_id) AS tekil_musteri\nFROM siparisler\nWHERE YEAR(tarih) = 2024;` },
    ]
  },
  {
    category: 'Alt Sorgular & CTE', categoryEn: 'Subqueries & CTE',
    templates: [
      { name: 'WHERE IN (alt sorgu)', nameEn: 'WHERE IN (subquery)', sql: `SELECT *\nFROM urunler\nWHERE id IN (\n    SELECT urun_id\n    FROM siparis_detay\n    WHERE durum = 'tamamlandi'\n);` },
      { name: 'EXISTS',               nameEn: 'EXISTS',              sql: `SELECT *\nFROM musteriler k\nWHERE EXISTS (\n    SELECT 1\n    FROM siparisler s\n    WHERE s.musteri_id = k.id\n      AND s.tarih >= '2024-01-01'\n);` },
      { name: 'CTE (WITH)',           nameEn: 'CTE (WITH)',          sql: `WITH aylik_ozet AS (\n    SELECT\n        DATE_TRUNC('month', tarih) AS ay,\n        SUM(tutar) AS toplam\n    FROM siparisler\n    GROUP BY DATE_TRUNC('month', tarih)\n)\nSELECT ay, toplam,\n    LAG(toplam) OVER (ORDER BY ay) AS onceki_ay\nFROM aylik_ozet\nORDER BY ay;` },
    ]
  },
  {
    category: 'Analitik & Pencere Fonksiyonları', categoryEn: 'Analytics & Window Functions',
    templates: [
      { name: 'ROW_NUMBER / RANK', nameEn: 'ROW_NUMBER / RANK', sql: `SELECT\n    id, ad, satis, departman,\n    ROW_NUMBER() OVER (PARTITION BY departman ORDER BY satis DESC) AS sira,\n    RANK()       OVER (PARTITION BY departman ORDER BY satis DESC) AS rank\nFROM calisanlar;` },
      { name: 'LAG / LEAD',        nameEn: 'LAG / LEAD',        sql: `SELECT\n    tarih,\n    tutar,\n    LAG(tutar, 1)  OVER (ORDER BY tarih) AS onceki_gun,\n    LEAD(tutar, 1) OVER (ORDER BY tarih) AS sonraki_gun\nFROM gunluk_satis\nORDER BY tarih;` },
    ]
  },
];

function buildKeywordCards(keywords, container) {
  const section = document.createElement('div');
  section.style.marginBottom = '28px';
  const h4 = document.createElement('h4');
  h4.textContent = t('keyword.guide');
  h4.style.cssText = 'font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border);';
  section.appendChild(h4);
  const grid = document.createElement('div');
  grid.className = 'kw-grid';
  keywords.forEach(item => {
    const card = document.createElement('div');
    card.className = 'kw-card';
    const kw = document.createElement('div');
    kw.className = 'kw-name';
    kw.textContent = item.kw;
    const desc = document.createElement('div');
    desc.className = 'kw-desc';
    desc.textContent = (getLang() === 'en' && item.descEn) ? item.descEn : item.desc;
    card.appendChild(kw);
    card.appendChild(desc);
    grid.appendChild(card);
  });
  section.appendChild(grid);
  container.appendChild(section);
}

function buildSqlCheatsheet() {
  const container = document.getElementById('sql-template-grid');
  if (!container) return;
  container.innerHTML = '';

  buildKeywordCards(sqlKeywords, container);

  sqlTemplates.forEach(cat => {
    const section = document.createElement('div');
    section.style.marginBottom = '28px';

    const h4 = document.createElement('h4');
    h4.textContent = (getLang() === 'en' && cat.categoryEn) ? cat.categoryEn : cat.category;
    h4.style.cssText = 'font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border);';
    section.appendChild(h4);

    const grid = document.createElement('div');
    grid.className = 'sql-template-grid';

    cat.templates.forEach(tmpl => {
      const card = document.createElement('div');
      card.className = 'sql-template-card';

      const name = document.createElement('div');
      name.className = 'sql-template-name';
      name.textContent = (getLang() === 'en' && tmpl.nameEn) ? tmpl.nameEn : tmpl.name;

      const pre = document.createElement('pre');
      pre.className = 'sql-template-preview';
      pre.textContent = tmpl.sql;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group';
      btnGroup.style.marginBottom = '0';

      const btnExport = document.createElement('button');
      btnExport.className = 'btn btn-primary';
      btnExport.style.cssText = 'font-size:11px; padding:5px 10px;';
      btnExport.textContent = t('sql.export');
      btnExport.addEventListener('click', () => insertSqlTemplate(tmpl.sql));

      const btnCopy = document.createElement('button');
      btnCopy.className = 'btn btn-secondary';
      btnCopy.style.cssText = 'font-size:11px; padding:5px 10px;';
      btnCopy.textContent = t('copy');
      btnCopy.addEventListener('click', () => copyToClipboard(tmpl.sql, btnCopy));

      btnGroup.appendChild(btnExport);
      btnGroup.appendChild(btnCopy);
      card.appendChild(name);
      card.appendChild(pre);
      card.appendChild(btnGroup);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}

function insertSqlTemplate(sql) {
  navigate('sql-formatter');
  document.getElementById('sql-input').value = sql;
}

// ===== Init =====

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  buildNav();
  initSearch();
  applyLang();
  initTabs('base64-tabs');
  buildSqlCheatsheet();
  buildKqlCheatsheet();
  addClearButtons();

  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // URL Encoder + Timestamp now-default — bootstrapped via their tool modules.
  initUrlEncoder();
  initTimestampNow();

  // Sprint 3 tool initial render (so panels aren't blank when first opened)
  if (document.getElementById('http-status-list')) filterHttpStatus();
  if (document.getElementById('regex-pattern')) runRegex();
  if (document.getElementById('md-input')) renderMarkdown();
  // Sprint 4: AC Generator starts with one empty scenario
  if (document.getElementById('ac-scenarios')) addScenario();

  // Register PWA service worker (offline-first cache)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* registration failed; app still works */ });
  }

  // Restore from hash
  const hash = window.location.hash.replace('#', '');
  if (hash && tools.find(t => t.id === hash)) {
    navigate(hash);
  }
});

// ===== Tool: YAML <-> JSON =====

const YAML_CDN = 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js';
let yamlScriptLoaded = false;

async function ensureYamlLoaded() {
  if (yamlScriptLoaded || (typeof jsyaml !== 'undefined')) { yamlScriptLoaded = true; return; }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error(t('yaml.error.offline'));
  }
  await loadBpmnScript(YAML_CDN, 8000); // reuse the timeout-aware loader from BPMN section
  yamlScriptLoaded = true;
}

async function yamlToJson() {
  hideError('yaml-error');
  const input = document.getElementById('yaml-input').value;
  const outEl = document.getElementById('yaml-json-output');
  if (!input.trim()) { outEl.value = ''; return; }
  try {
    await ensureYamlLoaded();
    const data = jsyaml.load(input);
    outEl.value = JSON.stringify(data, null, 2);
  } catch (e) {
    showError('yaml-error', `${t('yaml.error.parse')}: ${e.message}`);
  }
}

async function jsonToYaml() {
  hideError('yaml-error');
  const inputEl = document.getElementById('yaml-json-output');
  const yamlEl = document.getElementById('yaml-input');
  const text = inputEl.value.trim();
  if (!text) return;
  try {
    const data = JSON.parse(text);
    await ensureYamlLoaded();
    yamlEl.value = jsyaml.dump(data, { indent: 2, lineWidth: 100 });
  } catch (e) {
    showError('yaml-error', `${t('yaml.error.parse')}: ${e.message}`);
  }
}

// ===== Tool: Use Case Writer (Cockburn) =====

function getUseCaseModel() {
  const splitLines = (s) => (s || '').split('\n').map(l => l.trim()).filter(Boolean);
  return {
    id: document.getElementById('uc-id').value.trim() || 'UC-XXX',
    name: document.getElementById('uc-name').value.trim(),
    actor: document.getElementById('uc-actor').value.trim(),
    goal: document.getElementById('uc-goal').value.trim(),
    scope: document.getElementById('uc-scope').value.trim(),
    level: document.getElementById('uc-level').value,
    pre:  splitLines(document.getElementById('uc-pre').value),
    post: splitLines(document.getElementById('uc-post').value),
    main: splitLines(document.getElementById('uc-main').value),
    ext:  splitLines(document.getElementById('uc-ext').value),
    trigger: document.getElementById('uc-trigger').value.trim(),
  };
}

function useCaseToMarkdown() {
  const m = getUseCaseModel();
  const levelLabel = ({
    'user-goal':   t('uc.level.user'),
    'summary':     t('uc.level.summary'),
    'subfunction': t('uc.level.subfn'),
  })[m.level] || m.level;

  let md = `# ${m.id}: ${m.name || '(name)'}\n\n`;
  if (m.scope) md += `**${t('uc.scope')}:** ${m.scope}\n\n`;
  md += `**${t('uc.level')}:** ${levelLabel}\n\n`;
  md += `**${t('uc.actor')}:** ${m.actor || '(actor)'}\n\n`;
  md += `**${t('uc.goal')}:** ${m.goal || '(goal)'}\n\n`;
  if (m.pre.length)  md += `### ${t('uc.preconditions')}\n${m.pre.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`;
  if (m.trigger)     md += `**${t('uc.trigger')}:** ${m.trigger}\n\n`;
  md += `### ${t('uc.main')}\n${m.main.map((s, i) => `${i + 1}. ${s}`).join('\n') || '_(empty)_'}\n\n`;
  if (m.ext.length)  md += `### ${t('uc.ext')}\n${m.ext.map(e => `- ${e}`).join('\n')}\n\n`;
  if (m.post.length) md += `### ${t('uc.postconditions')}\n${m.post.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n`;
  return md;
}

function renderUseCase() {
  document.getElementById('uc-output').value = useCaseToMarkdown();
}

function copyUseCaseMd() {
  const md = useCaseToMarkdown();
  document.getElementById('uc-output').value = md;
  copyToClipboard(md, document.querySelector('#panel-use-case .btn-secondary'));
}

function clearUseCase() {
  ['uc-id','uc-name','uc-actor','uc-goal','uc-scope','uc-trigger','uc-pre','uc-post','uc-main','uc-ext','uc-output']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

// ===== Tool: AC Generator (Gherkin) =====

let acScenarioCounter = 0;

function addScenario() {
  acScenarioCounter += 1;
  const n = acScenarioCounter;
  const wrap = document.getElementById('ac-scenarios');
  if (!wrap) return;
  const div = document.createElement('div');
  div.className = 'ac-scenario';
  div.dataset.scenarioId = String(n);
  div.innerHTML = `
    <div class="ac-scenario-header">
      <span class="ac-scenario-title">${escapeHtml(t('ac.scenario'))} #${n}</span>
      <button class="ac-remove-btn" type="button" onclick="removeScenario(${n})">${escapeHtml(t('ac.remove'))}</button>
    </div>
    <input type="text" class="ac-name" placeholder="${escapeHtml(t('ac.scenario.name.ph'))}">
    <label>${escapeHtml(t('ac.given'))}</label>
    <textarea class="ac-given" rows="2" placeholder="${escapeHtml(t('ac.given.ph'))}"></textarea>
    <label>${escapeHtml(t('ac.when'))}</label>
    <textarea class="ac-when" rows="2" placeholder="${escapeHtml(t('ac.when.ph'))}"></textarea>
    <label>${escapeHtml(t('ac.then'))}</label>
    <textarea class="ac-then" rows="2" placeholder="${escapeHtml(t('ac.then.ph'))}"></textarea>
  `;
  wrap.appendChild(div);
}

function removeScenario(id) {
  const node = document.querySelector(`.ac-scenario[data-scenario-id="${id}"]`);
  if (node) node.remove();
}

function renderAC() {
  const feature = document.getElementById('ac-feature').value.trim() || '(feature)';
  const desc = document.getElementById('ac-desc').value.trim();
  let out = `Feature: ${feature}\n`;
  if (desc) out += `  ${desc.split('\n').join('\n  ')}\n`;
  out += '\n';

  const scenarios = document.querySelectorAll('.ac-scenario');
  if (scenarios.length === 0) addScenario();

  document.querySelectorAll('.ac-scenario').forEach(sc => {
    const name = sc.querySelector('.ac-name').value.trim() || '(scenario)';
    const givenLines = sc.querySelector('.ac-given').value.split('\n').map(s => s.trim()).filter(Boolean);
    const whenLines  = sc.querySelector('.ac-when').value.split('\n').map(s => s.trim()).filter(Boolean);
    const thenLines  = sc.querySelector('.ac-then').value.split('\n').map(s => s.trim()).filter(Boolean);
    out += `  Scenario: ${name}\n`;
    givenLines.forEach((line, i) => out += `    ${i === 0 ? 'Given' : 'And'} ${line}\n`);
    whenLines.forEach((line, i)  => out += `    ${i === 0 ? 'When'  : 'And'} ${line}\n`);
    thenLines.forEach((line, i)  => out += `    ${i === 0 ? 'Then'  : 'And'} ${line}\n`);
    out += '\n';
  });

  document.getElementById('ac-output').value = out.trimEnd();
}

// ===== Tool: RACI Matrix Builder =====

const RACI_VALUES = ['', 'R', 'A', 'C', 'I'];
let raciState = []; // 2D array; raciState[rowIdx][colIdx] = '' | 'R' | 'A' | 'C' | 'I'

function buildRaciMatrix() {
  hideError('raci-error');
  const splitLines = (s) => s.split('\n').map(l => l.trim()).filter(Boolean);
  const activities = splitLines(document.getElementById('raci-activities').value);
  const stakeholders = splitLines(document.getElementById('raci-stakeholders').value);
  if (activities.length === 0 || stakeholders.length === 0) {
    showError('raci-error', t('raci.error.empty'));
    document.getElementById('raci-matrix-wrap').innerHTML = '';
    return;
  }
  // Re-init state if shape changed; otherwise preserve user's selections.
  if (raciState.length !== activities.length || (raciState[0] && raciState[0].length !== stakeholders.length)) {
    raciState = activities.map(() => Array(stakeholders.length).fill(''));
  }
  renderRaciMatrix(activities, stakeholders);
  validateRaci();
}

function renderRaciMatrix(activities, stakeholders) {
  const wrap = document.getElementById('raci-matrix-wrap');
  let html = `<table><thead><tr><th class="activity">${escapeHtml(t('raci.col.activity'))}</th>`;
  stakeholders.forEach(s => { html += `<th>${escapeHtml(s)}</th>`; });
  html += `</tr></thead><tbody>`;
  activities.forEach((a, ri) => {
    html += `<tr><td class="activity">${escapeHtml(a)}</td>`;
    stakeholders.forEach((_, ci) => {
      const val = raciState[ri][ci] || '';
      const cls = val ? val.toLowerCase() : '';
      html += `<td class="raci-cell ${cls}" data-r="${ri}" data-c="${ci}" onclick="cycleRaci(${ri}, ${ci})" tabindex="0" role="button" aria-label="${escapeHtml(a)} / ${escapeHtml(stakeholders[ci])}">${val || '–'}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}

function cycleRaci(ri, ci) {
  const current = raciState[ri][ci] || '';
  const idx = RACI_VALUES.indexOf(current);
  const next = RACI_VALUES[(idx + 1) % RACI_VALUES.length];
  raciState[ri][ci] = next;
  // Update just this cell (avoid full re-render)
  const cell = document.querySelector(`.raci-cell[data-r="${ri}"][data-c="${ci}"]`);
  if (cell) {
    cell.classList.remove('r','a','c','i');
    if (next) cell.classList.add(next.toLowerCase());
    cell.textContent = next || '–';
  }
  validateRaci();
}

function validateRaci() {
  const el = document.getElementById('raci-validation');
  if (!el) return;
  const issues = [];
  raciState.forEach((row, ri) => {
    const aCount = row.filter(v => v === 'A').length;
    if (aCount === 0) issues.push(`${t('raci.issue.noA')} #${ri + 1}`);
    else if (aCount > 1) issues.push(`${t('raci.issue.multiA')} #${ri + 1}`);
  });
  if (issues.length === 0) {
    el.className = 'raci-validation ok';
    el.textContent = '✓ ' + t('raci.valid');
  } else {
    el.className = 'raci-validation warn';
    el.textContent = '⚠ ' + issues.join(' · ');
  }
}

function getRaciTable() {
  const splitLines = (s) => s.split('\n').map(l => l.trim()).filter(Boolean);
  const activities = splitLines(document.getElementById('raci-activities').value);
  const stakeholders = splitLines(document.getElementById('raci-stakeholders').value);
  return { activities, stakeholders };
}

function copyRaciMd() {
  const { activities, stakeholders } = getRaciTable();
  if (!activities.length || !stakeholders.length) return;
  let md = `| ${t('raci.col.activity')} | ${stakeholders.join(' | ')} |\n`;
  md += `| --- | ${stakeholders.map(() => '---').join(' | ')} |\n`;
  activities.forEach((a, ri) => {
    md += `| ${a} | ${(raciState[ri] || []).map(v => v || '–').join(' | ')} |\n`;
  });
  copyToClipboard(md, document.querySelector('#panel-raci-matrix [onclick="copyRaciMd()"]'));
}

function copyRaciCsv() {
  const { activities, stakeholders } = getRaciTable();
  if (!activities.length || !stakeholders.length) return;
  const escapeCsv = v => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  let csv = `${escapeCsv(t('raci.col.activity'))},${stakeholders.map(escapeCsv).join(',')}\n`;
  activities.forEach((a, ri) => {
    csv += `${escapeCsv(a)},${(raciState[ri] || []).map(v => v || '').join(',')}\n`;
  });
  copyToClipboard(csv, document.querySelector('#panel-raci-matrix [onclick="copyRaciCsv()"]'));
}

// ===== Tool: BPMN Modeler (bpmn-js) =====

const BPMN_CDN = 'https://unpkg.com/bpmn-js@17/dist/';
let bpmnInstance = null;
let bpmnInitStarted = false;

function loadBpmnScript(src, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    let timer = setTimeout(() => {
      s.onload = s.onerror = null;
      reject(new Error('Script load timeout: ' + src));
    }, timeoutMs);
    s.onload = () => { clearTimeout(timer); resolve(); };
    s.onerror = () => { clearTimeout(timer); reject(new Error('Script load failed: ' + src)); };
    document.head.appendChild(s);
  });
}

function loadBpmnCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}

async function initBpmn() {
  if (bpmnInstance) return;
  if (bpmnInitStarted) return;
  bpmnInitStarted = true;

  loadBpmnCSS(BPMN_CDN + 'assets/diagram-js.css');
  loadBpmnCSS(BPMN_CDN + 'assets/bpmn-js.css');
  loadBpmnCSS(BPMN_CDN + 'assets/bpmn-font/css/bpmn-embedded.css');

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    bpmnInitStarted = false;
    document.getElementById('bpmn-loading').style.display = 'none';
    showError('bpmn-error', t('bpmn.error.offline'));
    return;
  }

  try {
    await loadBpmnScript(BPMN_CDN + 'bpmn-modeler.production.min.js', 12000);

    bpmnInstance = new BpmnJS({
      container: '#bpmn-canvas',
      keyboard: { bindTo: window }
    });

    await bpmnInstance.createDiagram();
    document.getElementById('bpmn-loading').style.display = 'none';
  } catch (e) {
    bpmnInitStarted = false;
    document.getElementById('bpmn-loading').style.display = 'none';
    const msg = /timeout/i.test(e && e.message || '') ? t('bpmn.error.timeout') : t('bpmn.error.load');
    showError('bpmn-error', msg);
  }
}

async function bpmnNew() {
  if (!bpmnInstance) return;
  hideError('bpmn-error');
  await bpmnInstance.createDiagram();
}

async function bpmnExportXml() {
  if (!bpmnInstance) return;
  try {
    const { xml } = await bpmnInstance.saveXML({ format: true });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([xml], { type: 'application/xml' })),
      download: 'diagram.bpmn'
    });
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    showError('bpmn-error', 'Export failed: ' + e.message);
  }
}

async function bpmnExportSvg() {
  if (!bpmnInstance) return;
  try {
    const { svg } = await bpmnInstance.saveSVG();
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })),
      download: 'diagram.svg'
    });
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    showError('bpmn-error', 'Export failed: ' + e.message);
  }
}

function bpmnImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.bpmn,.xml';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      await bpmnInstance.importXML(text);
      hideError('bpmn-error');
    } catch {
      showError('bpmn-error', t('bpmn.error.import'));
    }
  };
  input.click();
}

// ===== Public API — window bridge =====
//
// app.js is now an ES module, so its top-level functions are scoped to the module.
// Inline HTML handlers (onclick="…") need them on `window`, so we explicitly expose
// the public surface here. This list is the authoritative inventory of "what HTML
// is allowed to call". When you delete a function (or move it to a tool module),
// also delete its entry here. Conversely, when you add an inline handler in
// index.html, add the function to this object.
//
// Functions called from runtime-injected HTML (renderTabs's tab-close, RACI cells,
// AC scenario remove buttons, etc.) are also listed even though static grep
// misses them.

Object.assign(window, {
  // i18n / theme / global UI
  applyLang, toggleLang, t,
  toggleFeedbackMenu,

  // JSON Formatter
  jsonBeautify, jsonMinify, jsonValidate, jsonRemoveNulls, setJsonView,

  // JSON Grid / Diff / Escape
  renderJsonGrid, diffJson, jsonEscapeStr, jsonUnescapeStr, jsonSwap,

  // CSV / Base64
  csvToJson, base64Encode, base64Decode, base64ToFile, fileToBase64,

  // YAML <-> JSON
  yamlToJson, jsonToYaml,

  // Developer tools
  generateUUIDs, copyToClipboard,
  tsToDate, dateToTs, setNow,
  decodeJWT,
  shortenUrl, copyShortUrl,
  runRegex, syncRegexFlags,
  setCron, decodeCron,
  filterHttpStatus, setHttpFilter,
  parseCurl,

  // Database
  formatSQL, formatKQL,

  // Calculation
  calcSimpleInterest, calcLoanPayment, onTaxChange, onKistChange,

  // Text
  runDiff, countWords, downloadTextFile, updateEditorStats, renderMarkdown,

  // BA / Analysis
  buildUserStory, copyUserStory, copyUserStoryMd, copyUserStoryJira, clearUserStory,
  setAcMode, addAcBlock, removeAcBlock, addChecklistItem, removeChecklistItem, toggleInvest,
  renderUseCase, copyUseCaseMd, clearUseCase,
  addScenario, removeScenario, renderAC,
  buildRaciMatrix, cycleRaci, copyRaciMd, copyRaciCsv,
  bpmnNew, bpmnImport, bpmnExportXml, bpmnExportSvg,

  // Tab management (renderTabs injects HTML that calls these by name)
  switchTab, closeTab,
});

