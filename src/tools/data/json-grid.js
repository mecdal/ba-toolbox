// JSON Grid — Altova XMLSpy-style table view of JSON.
//
// Three layouts:
//   1. Array of objects → table with #/columns based on union of keys
//   2. Array of primitives → 2-column #/Value table
//   3. Plain object → 2-column key/value table
// Nested values render as <details> with the same recursive layout.
// "Tablo Kopyala (TSV)" copies the rendered grid as tab-separated text.

import { t, getLang } from '../../i18n/index.js';
import { showError, hideError, copyToClipboard } from '../../core/util.js';

export function renderJsonGrid() {
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
  const tsv = rows.map((row) =>
    [...row.querySelectorAll('th, td')]
      .map((cell) => cell.textContent.trim().replace(/[\t\n]/g, ' '))
      .join('\t'),
  ).join('\n');
  copyToClipboard(tsv, btn);
}

function buildGridNode(data, depth) {
  if (Array.isArray(data)) {
    if (data.length === 0) return createGridSpan('[]', 'json-grid-null');

    if (typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
      const keys = [...new Set(data.flatMap((obj) => Object.keys(obj)))];
      const table = document.createElement('table');
      table.className = 'json-grid-table';
      const thead = table.createTHead();
      const headerRow = thead.insertRow();
      const thIdx = document.createElement('th');
      thIdx.textContent = '#';
      thIdx.className = 'json-grid-idx';
      headerRow.appendChild(thIdx);
      keys.forEach((k) => {
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
        keys.forEach((k) => {
          const td = tr.insertCell();
          setGridCell(td, row[k], depth);
        });
      });
      return table;
    }

    // Array of primitives or mixed types → 2-column #/Value table
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
