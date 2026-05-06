// CSV → JSON converter with an RFC 4180-compliant parser.
//
// Handles:
//   - Quoted fields that contain the delimiter ("Alice, Bob",30)
//   - Doubled-quote escapes inside quoted fields ("she said ""hi""")
//   - CRLF / LF / CR line endings
//   - Multiline fields when wrapped in quotes
// We deliberately don't trust naive `split(',')` — it would mangle quoted commas.

import { t } from '../../i18n/index.js';
import { showError, hideError } from '../../core/util.js';

/**
 * @param {string} text - raw CSV input
 * @param {string} delimiter - field separator (default ',')
 * @returns {string[][]} array of rows; each row is an array of cell strings
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
      row.push(field); field = ''; rows.push(row); row = [];
      // CRLF counts as one terminator.
      if (text[i + 1] === '\n') i++;
      i++; continue;
    }
    if (ch === '\n') {
      row.push(field); field = ''; rows.push(row); row = [];
      i++; continue;
    }
    field += ch; i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop trailing empty rows from inputs ending with a newline.
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }
  return rows;
}

export function csvToJson() {
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
      result = rows.slice(1).map((vals) => {
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
