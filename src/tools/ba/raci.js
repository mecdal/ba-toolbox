// RACI Matrix Builder.
//
// State (raciState[row][col]) is preserved across rebuilds when the matrix
// shape (#activities × #stakeholders) is unchanged — handy when the user
// edits one cell and rebuilds without losing the others. Click a cell to
// cycle '' → R → A → C → I → '' again. validateRaci() warns if any row
// doesn't have exactly one Accountable.

import { t } from '../../i18n/index.js';
import { showError, hideError, escapeHtml, copyToClipboard } from '../../core/util.js';

const RACI_VALUES = ['', 'R', 'A', 'C', 'I'];
let raciState = []; // 2D: raciState[rowIdx][colIdx] = '' | 'R' | 'A' | 'C' | 'I'

export function buildRaciMatrix() {
  hideError('raci-error');
  const splitLines = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean);
  const activities = splitLines(document.getElementById('raci-activities').value);
  const stakeholders = splitLines(document.getElementById('raci-stakeholders').value);
  if (activities.length === 0 || stakeholders.length === 0) {
    showError('raci-error', t('raci.error.empty'));
    document.getElementById('raci-matrix-wrap').innerHTML = '';
    return;
  }
  // Re-init only when the shape changed; otherwise preserve user's selections.
  if (raciState.length !== activities.length || (raciState[0] && raciState[0].length !== stakeholders.length)) {
    raciState = activities.map(() => Array(stakeholders.length).fill(''));
  }
  renderRaciMatrix(activities, stakeholders);
  validateRaci();
}

function renderRaciMatrix(activities, stakeholders) {
  const wrap = document.getElementById('raci-matrix-wrap');
  let html = `<table><thead><tr><th class="activity">${escapeHtml(t('raci.col.activity'))}</th>`;
  stakeholders.forEach((s) => { html += `<th>${escapeHtml(s)}</th>`; });
  html += '</tr></thead><tbody>';
  activities.forEach((a, ri) => {
    html += `<tr><td class="activity">${escapeHtml(a)}</td>`;
    stakeholders.forEach((_, ci) => {
      const val = raciState[ri][ci] || '';
      const cls = val ? val.toLowerCase() : '';
      html += `<td class="raci-cell ${cls}" data-r="${ri}" data-c="${ci}" onclick="cycleRaci(${ri}, ${ci})" tabindex="0" role="button" aria-label="${escapeHtml(a)} / ${escapeHtml(stakeholders[ci])}">${val || '–'}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

export function cycleRaci(ri, ci) {
  const current = raciState[ri][ci] || '';
  const idx = RACI_VALUES.indexOf(current);
  const next = RACI_VALUES[(idx + 1) % RACI_VALUES.length];
  raciState[ri][ci] = next;
  // Surgical update — re-rendering the entire table on every click would clear focus.
  const cell = document.querySelector(`.raci-cell[data-r="${ri}"][data-c="${ci}"]`);
  if (cell) {
    cell.classList.remove('r', 'a', 'c', 'i');
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
    const aCount = row.filter((v) => v === 'A').length;
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
  const splitLines = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean);
  const activities = splitLines(document.getElementById('raci-activities').value);
  const stakeholders = splitLines(document.getElementById('raci-stakeholders').value);
  return { activities, stakeholders };
}

export function copyRaciMd() {
  const { activities, stakeholders } = getRaciTable();
  if (!activities.length || !stakeholders.length) return;
  let md = `| ${t('raci.col.activity')} | ${stakeholders.join(' | ')} |\n`;
  md += `| --- | ${stakeholders.map(() => '---').join(' | ')} |\n`;
  activities.forEach((a, ri) => {
    md += `| ${a} | ${(raciState[ri] || []).map((v) => v || '–').join(' | ')} |\n`;
  });
  copyToClipboard(md, document.querySelector('#panel-raci-matrix [onclick="copyRaciMd()"]'));
}

export function copyRaciCsv() {
  const { activities, stakeholders } = getRaciTable();
  if (!activities.length || !stakeholders.length) return;
  const escapeCsv = (v) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  let csv = `${escapeCsv(t('raci.col.activity'))},${stakeholders.map(escapeCsv).join(',')}\n`;
  activities.forEach((a, ri) => {
    csv += `${escapeCsv(a)},${(raciState[ri] || []).map((v) => v || '').join(',')}\n`;
  });
  copyToClipboard(csv, document.querySelector('#panel-raci-matrix [onclick="copyRaciCsv()"]'));
}
