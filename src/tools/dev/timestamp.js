// Unix Timestamp ↔ Date converter.
//
// `tsToDate` honors an explicit s/ms/auto radio. The "auto" mode uses both
// string length AND numeric magnitude as fallbacks, so timestamps near year
// 3000 (which exceed 1e12 even in seconds) still classify correctly.
// All output rows go through escapeHtml — values are user-controlled.

import { t, getLang } from '../../i18n/index.js';
import { escapeHtml } from '../../core/util.js';

function tsISOWeek(d) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Thursday in current week decides the year (ISO 8601 week numbering rule).
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
}

function tsRelative(ms) {
  const diff = Date.now() - ms;
  const abs = Math.abs(diff);
  const future = diff < 0;
  const slots = [
    { u: 'year',   ms: 31536000000 },
    { u: 'month',  ms: 2592000000 },
    { u: 'day',    ms: 86400000 },
    { u: 'hour',   ms: 3600000 },
    { u: 'minute', ms: 60000 },
    { u: 'second', ms: 1000 },
  ];
  for (const { u, ms: unit } of slots) {
    const n = Math.floor(abs / unit);
    if (n >= 1) {
      const label = n === 1 ? u : u + 's';
      return future ? `in ${n} ${label}` : `${n} ${label} ago`;
    }
  }
  return 'just now';
}

export function tsToDate() {
  const raw = document.getElementById('ts-input').value.trim();
  const out = document.getElementById('ts-result');
  if (!raw || isNaN(raw)) { out.innerHTML = t('ts.invalid'); return; }

  const unitInput = document.querySelector('input[name="ts-unit"]:checked');
  const unit = unitInput ? unitInput.value : 'auto';
  const num = parseInt(raw, 10);
  let ms;
  if (unit === 's') ms = num * 1000;
  else if (unit === 'ms') ms = num;
  else ms = (raw.length >= 13 || num >= 1e12) ? num : num * 1000;
  const d = new Date(ms);
  if (isNaN(d.getTime())) { out.innerHTML = t('ts.invalid'); return; }

  const pad = (n) => String(n).padStart(2, '0');
  const Y = d.getUTCFullYear(), M = pad(d.getUTCMonth() + 1), D = pad(d.getUTCDate());
  const h = pad(d.getUTCHours()), m = pad(d.getUTCMinutes()), s = pad(d.getUTCSeconds());

  const formats = [
    { label: 'Local',        value: d.toLocaleString(getLang() === 'tr' ? 'tr-TR' : 'en-GB') },
    { label: 'UTC',          value: d.toUTCString() },
    { label: 'ISO 8601',     value: d.toISOString() },
    { label: 'SQL Date',     value: `${Y}-${M}-${D}` },
    { label: 'SQL DateTime', value: `${Y}-${M}-${D} ${h}:${m}:${s}` },
    { label: 'Day of Week',  value: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
    { label: 'ISO Week',     value: `Week ${tsISOWeek(d)}, ${Y}` },
    { label: 'Relative',     value: tsRelative(ms) },
    { label: 'Unix (s)',     value: String(Math.floor(ms / 1000)) },
    { label: 'Unix (ms)',    value: String(ms) },
  ];

  out.innerHTML = formats.map((f) =>
    `<div class="ts-row">
       <span class="ts-label">${f.label}</span>
       <span class="ts-value">${escapeHtml(f.value)}</span>
       <button class="btn ts-copy" data-value="${escapeHtml(f.value)}" onclick="copyToClipboard(this.dataset.value,this)">Copy</button>
     </div>`,
  ).join('');
}

export function dateToTs() {
  const val = document.getElementById('date-input').value;
  if (!val) return;
  const d = new Date(val);
  document.getElementById('date-ts-result').textContent =
    `Unix (s): ${Math.floor(d.getTime() / 1000)}\nUnix (ms): ${d.getTime()}`;
}

export function setNow() {
  document.getElementById('ts-input').value = Math.floor(Date.now() / 1000);
  tsToDate();
}

/**
 * Pre-fills the date-input with current local time so the user sees a sensible
 * default on first visit. Called from main DOMContentLoaded.
 */
export function initTimestampNow() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  const dateEl = document.getElementById('date-input');
  if (dateEl) dateEl.value = local.toISOString().slice(0, 16);
}
