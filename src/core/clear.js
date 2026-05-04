// "Clear" footer button injected into every tool panel.
//
// noClearPanels lists IDs that opt out: cheatsheets are read-only references,
// the User Story Writer has its own dedicated Clear button with custom logic.
//
// clearPanel takes a per-panel kitchen-sink approach: blanks all inputs, hides
// result cards / amortization tables, drops error boxes. We don't try to call
// each tool's "real" clear handler because most don't have one, and the DOM
// reset here is enough to put the panel back to its empty state.

import { t } from '../i18n/index.js';

export const noClearPanels = new Set([
  'panel-sql-cheatsheet',
  'panel-kql-cheatsheet',
  'panel-user-story',
]);

export function addClearButtons() {
  document.querySelectorAll('.tool-panel').forEach((panel) => {
    if (noClearPanels.has(panel.id)) return;
    const card = panel.querySelector('.tool-card');
    if (!card) return;
    const footer = document.createElement('div');
    footer.className = 'panel-clear-footer';
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.style.cssText = 'font-size:11px; opacity:0.65;';
    btn.dataset.i18n = 'clear';
    btn.textContent = t('clear');
    btn.addEventListener('click', () => clearPanel(panel.id));
    footer.appendChild(btn);
    card.appendChild(footer);
  });
}

export function clearPanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.querySelectorAll('input[type="text"], input[type="number"]').forEach((el) => { el.value = ''; });
  panel.querySelectorAll('textarea').forEach((el) => { el.value = ''; });
  panel.querySelectorAll('.error-box').forEach((el) => { el.textContent = ''; el.style.display = 'none'; });
  panel.querySelectorAll('.result-box').forEach((el) => { el.innerHTML = ''; });
  panel.querySelectorAll('tbody').forEach((el) => { el.innerHTML = ''; });

  // Tool-specific result containers that won't be caught by the generic queries above.
  const specialIds = [
    'json-grid-output', 'json-diff-output', 'diff-output',
    'si-result-card', 'loan-result-card',
    'editor-stats', 'diff-stats', 'file-b64-info',
    'json-status', 'url-short-result',
  ];
  specialIds.forEach((id) => {
    const el = panel.querySelector('#' + id);
    if (!el) return;
    if (id === 'url-short-result') {
      el.style.display = 'none';
    } else if (id.endsWith('-card')) {
      el.innerHTML = '';
      el.style.display = 'none';
    } else {
      el.innerHTML = '';
      el.textContent = '';
    }
  });

  ['loan-table-wrap'].forEach((id) => {
    const el = panel.querySelector('#' + id);
    if (el) el.style.display = 'none';
  });
}
