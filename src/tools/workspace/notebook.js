// Notebook — Sprint 5c MVP.
//
// A "workspace" tool that lets BAs chain operations into reusable steps,
// like a tiny Jupyter notebook. Each cell picks a transform and an input;
// the cell's output can be referenced from later cells via `${cell:N}` or
// `${cell:N.dot.path}` (a JSON-path-lite extractor).
//
// MVP scope (per Sprint 5 plan): 4 cell types. Bigger surfaces (chart cells,
// multi-input cells, sharing) wait for usage feedback.
//
// State model:
//   cells = [
//     { id, type: 'json-format'|'jwt-decode'|'regex-extract'|'jsonpath',
//       input: string, params: { ... }, output: string, error: string|null }
//   ]
// Cells are kept in module state; persistence happens via Save (.bantb file
// download) and Load (file input upload). Optional auto-save to localStorage
// can land in v2 once we know users want it.

import { t } from '../../i18n/index.js';
import { escapeHtml, copyToClipboard } from '../../core/util.js';
import { base64ToUtf8 } from '../../core/base64-codec.js';

const CELL_TYPES = ['json-format', 'jwt-decode', 'regex-extract', 'jsonpath'];

let cells = [];
let nextCellId = 1;

// ----- Reference interpolation -----

/**
 * Walk a JSON value following a dot-and-bracket path. Returns `undefined`
 * if any step misses. Examples accepted by the path parser:
 *   "headers.auth"
 *   "users[0].email"
 *   "data.items[2].id"
 */
function extractByPath(value, path) {
  if (!path) return value;
  // Split on dots and brackets: "users[0].email" → ["users", "0", "email"]
  const parts = path.match(/[^.[\]]+/g) || [];
  let cur = value;
  for (const part of parts) {
    if (cur == null) return undefined;
    // Numeric segment + array → integer index; everything else → object key
    if (Array.isArray(cur) && /^\d+$/.test(part)) {
      cur = cur[Number(part)];
    } else if (typeof cur === 'object') {
      cur = cur[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

/**
 * Replace `${cell:N(.path)?}` markers in a string with output from earlier
 * cells. Path lookup parses the cell's output as JSON; if parsing fails,
 * `${cell:N.path}` falls back to the raw output (path ignored).
 *
 * Forward references (cell N referencing N+1) silently produce `<missing:cell:N>`
 * — we don't raise so the user sees what's misordered.
 */
export function interpolateRefs(text, currentCellIdx) {
  if (typeof text !== 'string') return text;
  return text.replace(/\$\{cell:(\d+)(?:\.([^}]+))?\}/g, (match, nStr, path) => {
    const n = parseInt(nStr, 10);
    if (n < 1 || n > currentCellIdx) return `<missing:cell:${n}>`;
    const referenced = cells[n - 1];
    if (!referenced || referenced.error || !referenced.output) {
      return `<no-output:cell:${n}>`;
    }
    if (!path) return referenced.output;
    try {
      const parsed = JSON.parse(referenced.output);
      const v = extractByPath(parsed, path);
      if (v === undefined) return `<missing-path:${path}>`;
      return typeof v === 'string' ? v : JSON.stringify(v);
    } catch {
      // Output isn't JSON; can't path-extract. Keep raw output.
      return referenced.output;
    }
  });
}

// ----- Cell runners -----

function runJsonFormat(input) {
  if (!input.trim()) throw new Error('Empty input');
  return JSON.stringify(JSON.parse(input), null, 2);
}

function runJwtDecode(input) {
  const token = input.trim();
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error(t('jwt.error.format'));
  const decode = (s) => JSON.parse(base64ToUtf8(s));
  // Return both halves — typical use is to path into payload.
  return JSON.stringify({ header: decode(parts[0]), payload: decode(parts[1]) }, null, 2);
}

function runRegexExtract(input, params) {
  const { pattern, flags } = params;
  if (!pattern) throw new Error(t('regex.error.invalid') + ': pattern required');
  let re;
  try { re = new RegExp(pattern, flags || ''); }
  catch (e) { throw new Error(t('regex.error.invalid') + ': ' + e.message); }
  // Always operate as global so we get every match; if user didn't request
  // 'g' we still return only the first match's data, but matchAll needs 'g'.
  const allFlags = (flags || '').includes('g') ? flags : (flags || '') + 'g';
  const reGlobal = new RegExp(pattern, allFlags);
  const matches = [...input.matchAll(reGlobal)].map((m) => ({
    match: m[0],
    index: m.index,
    groups: m.slice(1),
    namedGroups: m.groups || null,
  }));
  return JSON.stringify({ count: matches.length, matches }, null, 2);
}

function runJsonpath(input, params) {
  const { path } = params;
  if (!path) throw new Error('JSONPath required');
  let parsed;
  try { parsed = JSON.parse(input); }
  catch (e) { throw new Error('Input is not valid JSON: ' + e.message); }
  const v = extractByPath(parsed, path);
  if (v === undefined) throw new Error(`Path "${path}" did not match any value`);
  return typeof v === 'string' ? v : JSON.stringify(v, null, 2);
}

const RUNNERS = {
  'json-format':   runJsonFormat,
  'jwt-decode':    runJwtDecode,
  'regex-extract': runRegexExtract,
  'jsonpath':      runJsonpath,
};

// ----- DOM rendering -----

function paramsHTML(cell) {
  if (cell.type === 'regex-extract') {
    const pattern = escapeHtml(cell.params?.pattern || '');
    const flags = escapeHtml(cell.params?.flags || 'g');
    return `
      <div class="nb-param-row">
        <label>Pattern</label>
        <input type="text" class="nb-param" data-param="pattern" value="${pattern}" placeholder="\\b[A-Z]\\w+\\b">
      </div>
      <div class="nb-param-row">
        <label>Flags</label>
        <input type="text" class="nb-param" data-param="flags" value="${flags}" placeholder="g, gi, gim..." maxlength="6">
      </div>`;
  }
  if (cell.type === 'jsonpath') {
    const path = escapeHtml(cell.params?.path || '');
    return `
      <div class="nb-param-row">
        <label>Path</label>
        <input type="text" class="nb-param" data-param="path" value="${path}" placeholder="users[0].email">
      </div>`;
  }
  return '';
}

function cellHTML(cell, idx) {
  const num = idx + 1;
  const typeOptions = CELL_TYPES.map((type) => {
    const sel = type === cell.type ? ' selected' : '';
    return `<option value="${type}"${sel}>${type}</option>`;
  }).join('');
  const inputVal = escapeHtml(cell.input || '');
  const outputVal = cell.error
    ? `// ERROR: ${escapeHtml(cell.error)}`
    : escapeHtml(cell.output || '');
  const outputCls = cell.error ? 'nb-output nb-output-error' : 'nb-output';
  return `
    <div class="nb-cell" data-cell-id="${cell.id}">
      <div class="nb-cell-header">
        <span class="nb-cell-num">[${num}]</span>
        <select class="nb-cell-type" aria-label="${t('nb.cell.type')}">
          ${typeOptions}
        </select>
        <button type="button" class="btn btn-primary nb-run">${t('nb.run')}</button>
        <button type="button" class="btn btn-secondary nb-copy-out">${t('copy')}</button>
        <button type="button" class="btn btn-secondary nb-remove" aria-label="${t('nb.remove')}">×</button>
      </div>
      ${paramsHTML(cell)}
      <label class="nb-input-label">${t('nb.input')} <span class="nb-hint">${t('nb.refs-hint')}</span></label>
      <textarea class="nb-input" rows="4" placeholder="${escapeHtml(t('nb.input.ph'))}">${inputVal}</textarea>
      <label class="nb-input-label">${t('nb.output')}</label>
      <pre class="${outputCls}">${outputVal}</pre>
    </div>`;
}

function render() {
  const list = document.getElementById('nb-cells');
  if (!list) return;
  list.innerHTML = cells.map((c, i) => cellHTML(c, i)).join('');
  attachCellHandlers();
}

function attachCellHandlers() {
  document.querySelectorAll('.nb-cell').forEach((el) => {
    const id = Number(el.dataset.cellId);
    const cell = cells.find((c) => c.id === id);
    if (!cell) return;

    el.querySelector('.nb-cell-type').addEventListener('change', (e) => {
      cell.type = e.target.value;
      cell.params = {}; // params are type-specific; reset on type change
      cell.output = '';
      cell.error = null;
      render();
    });

    el.querySelector('.nb-input').addEventListener('input', (e) => {
      cell.input = e.target.value;
    });

    el.querySelectorAll('.nb-param').forEach((input) => {
      input.addEventListener('input', (e) => {
        if (!cell.params) cell.params = {};
        cell.params[e.target.dataset.param] = e.target.value;
      });
    });

    el.querySelector('.nb-run').addEventListener('click', () => runCell(id));
    el.querySelector('.nb-remove').addEventListener('click', () => removeCell(id));
    el.querySelector('.nb-copy-out').addEventListener('click', (e) => {
      copyToClipboard(cell.output || '', e.currentTarget);
    });
  });
}

function runCell(id) {
  const idx = cells.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const cell = cells[idx];
  try {
    const interpolated = interpolateRefs(cell.input || '', idx);
    const runner = RUNNERS[cell.type];
    if (!runner) throw new Error('Unknown cell type: ' + cell.type);
    cell.output = runner(interpolated, cell.params || {});
    cell.error = null;
  } catch (e) {
    cell.output = '';
    cell.error = e.message || String(e);
  }
  render();
}

// ----- Notebook ops (window-bridged) -----

export function nbAddCell() {
  cells.push({
    id: nextCellId++,
    type: 'json-format',
    input: '',
    params: {},
    output: '',
    error: null,
  });
  render();
}

function removeCell(id) {
  cells = cells.filter((c) => c.id !== id);
  render();
}

export function nbRunAll() {
  for (let i = 0; i < cells.length; i++) {
    runCell(cells[i].id);
  }
}

export function nbClear() {
  cells = [];
  nextCellId = 1;
  render();
}

export function nbSave() {
  // Strip transient state (output, error) so .bantb files diff cleanly across runs.
  const data = {
    version: 1,
    savedAt: new Date().toISOString(),
    cells: cells.map((c) => ({ type: c.type, input: c.input, params: c.params || {} })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `notebook-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')}.bantb`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export function nbLoad() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.bantb,application/json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data.cells)) throw new Error('Invalid notebook: missing cells[]');
      cells = data.cells.map((c) => ({
        id: nextCellId++,
        type: CELL_TYPES.includes(c.type) ? c.type : 'json-format',
        input: typeof c.input === 'string' ? c.input : '',
        params: c.params || {},
        output: '',
        error: null,
      }));
      render();
    } catch (err) {
      alert('Notebook load failed: ' + err.message);
    }
  };
  input.click();
}

/**
 * First-render hook. Called on DOMContentLoaded so users see one empty cell
 * when they first open the Notebook tab — no need to figure out "+ Cell" first.
 */
export function initNotebook() {
  if (cells.length === 0) {
    cells.push({ id: nextCellId++, type: 'json-format', input: '', params: {}, output: '', error: null });
  }
  render();
}
