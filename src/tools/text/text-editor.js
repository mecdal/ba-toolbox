// Text Editor — local-only textarea with download in chosen format.
//
// "Download" creates a Blob URL and synthesizes a click on a hidden anchor;
// the URL is revoked immediately so the browser doesn't keep the buffer alive.
// MIME types are best-effort — most formats fall back to text/plain so the
// browser doesn't try to render them.

import { t } from '../../i18n/index.js';

const MIME_MAP = {
  txt:  'text/plain',
  md:   'text/markdown',
  csv:  'text/csv',
  json: 'application/json',
  html: 'text/html',
  sql:  'text/plain',
  kql:  'text/plain',
  xml:  'application/xml',
};

export function downloadTextFile() {
  const content = document.getElementById('editor-content').value;
  const filename = document.getElementById('editor-filename').value.trim() || 'belge';
  const format = document.getElementById('editor-format').value;
  const blob = new Blob([content], { type: (MIME_MAP[format] || 'text/plain') + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename + '.' + format;
  a.click();
  URL.revokeObjectURL(url);
}

export function updateEditorStats() {
  const content = document.getElementById('editor-content').value;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lines = content.split('\n').length;
  document.getElementById('editor-stats').textContent = t('wc.stats')
    .replace('{chars}', content.length)
    .replace('{words}', words)
    .replace('{lines}', lines);
}
