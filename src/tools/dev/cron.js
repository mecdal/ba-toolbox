// Cron Expression decoder.
//
// Supports the standard 5-field crontab grammar (no @reboot/@weekly aliases yet)
// with month/dow text aliases (Jan-Dec, Sun-Sat). The "next runs" preview walks
// the calendar minute-by-minute up to a 1-year safety net, which is fine for
// typical schedules. Pathological expressions like `0 0 31 2 *` (Feb 31st) just
// return zero runs rather than looping forever.

import { t, getLang } from '../../i18n/index.js';
import { showError, hideError, escapeHtml } from '../../core/util.js';

const CRON_FIELD_NAMES = ['minute', 'hour', 'dom', 'month', 'dow'];
const CRON_FIELD_RANGES = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];
const CRON_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CRON_DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function setCron(expr) {
  document.getElementById('cron-input').value = expr;
  decodeCron();
}

function parseCronField(field, idx) {
  const [min, max] = CRON_FIELD_RANGES[idx];
  let f = field.toUpperCase();
  // Replace text aliases with numbers before splitting on commas.
  if (idx === 3) CRON_MONTH_NAMES.forEach((n, i) => { f = f.replace(new RegExp(`\\b${n.toUpperCase()}\\b`, 'g'), String(i + 1)); });
  if (idx === 4) CRON_DOW_NAMES.forEach((n, i) => { f = f.replace(new RegExp(`\\b${n.toUpperCase()}\\b`, 'g'), String(i)); });

  const allowed = new Set();
  for (const part of f.split(',')) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    let step = 1, base = part;
    if (stepMatch) { base = stepMatch[1]; step = parseInt(stepMatch[2], 10); }

    let from, to;
    if (base === '*') { from = min; to = max; }
    else if (base.includes('-')) {
      const [a, b] = base.split('-').map((s) => parseInt(s, 10));
      from = a; to = b;
    } else {
      const v = parseInt(base, 10);
      if (isNaN(v)) throw new Error(`Invalid cron field: ${field}`);
      from = v; to = v;
    }
    if (from < min || to > max || from > to) throw new Error(`Cron field "${field}" out of range [${min}-${max}]`);
    for (let v = from; v <= to; v += step) allowed.add(v);
  }
  return Array.from(allowed).sort((a, b) => a - b);
}

function describeCronField(field, idx, parsed) {
  const [min, max] = CRON_FIELD_RANGES[idx];
  if (parsed.length === max - min + 1) return null; // "every" — caller suppresses this segment
  if (field === '*') return null;
  if (idx === 3) return parsed.map((v) => CRON_MONTH_NAMES[v - 1]).join(', ');
  if (idx === 4) return parsed.map((v) => CRON_DOW_NAMES[v]).join(', ');
  return parsed.join(', ');
}

function nextCronRuns(parsed, count) {
  const [mins, hours, doms, months, dows] = parsed;
  const runs = [];
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  const limitMs = d.getTime() + 366 * 24 * 60 * 60 * 1000;
  while (runs.length < count && d.getTime() < limitMs) {
    if (
      mins.includes(d.getMinutes()) &&
      hours.includes(d.getHours()) &&
      doms.includes(d.getDate()) &&
      months.includes(d.getMonth() + 1) &&
      dows.includes(d.getDay())
    ) {
      runs.push(new Date(d));
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  return runs;
}

export function decodeCron() {
  hideError('cron-error');
  const input = document.getElementById('cron-input').value.trim();
  const result = document.getElementById('cron-result');
  if (!input) { result.style.display = 'none'; return; }
  const fields = input.split(/\s+/);
  if (fields.length !== 5) {
    showError('cron-error', t('cron.error.fields'));
    result.style.display = 'none';
    return;
  }
  let parsed;
  try {
    parsed = fields.map((f, i) => parseCronField(f, i));
  } catch (e) {
    showError('cron-error', `${t('cron.error.invalid')}: ${e.message}`);
    result.style.display = 'none';
    return;
  }

  const labels = [t('cron.field.minute'), t('cron.field.hour'), t('cron.field.dom'), t('cron.field.month'), t('cron.field.dow')];
  const descs = parsed.map((p, i) => describeCronField(fields[i], i, p));
  let human;
  if (descs.every((d) => d === null)) {
    human = t('cron.human.everyMin');
  } else {
    const minPart = descs[0] === null ? t('cron.human.everyMin') : `${t('cron.at')} :${parsed[0].map((v) => String(v).padStart(2, '0')).join(',:')}`;
    const hourPart = descs[1] === null ? '' : ` ${t('cron.hour')} ${parsed[1].join(',')}`;
    const domPart = descs[2] === null ? '' : ` ${t('cron.onDom')} ${parsed[2].join(',')}`;
    const monthPart = descs[3] === null ? '' : ` ${t('cron.inMonths')} ${descs[3]}`;
    const dowPart = descs[4] === null ? '' : ` ${t('cron.onDow')} ${descs[4]}`;
    human = `${minPart}${hourPart}${domPart}${monthPart}${dowPart}`.trim();
  }

  const runs = nextCronRuns(parsed, 5);
  const locale = getLang() === 'tr' ? 'tr-TR' : 'en-GB';

  let html = `<div class="cron-human">${escapeHtml(human)}</div>`;
  html += '<div class="cron-fields">';
  CRON_FIELD_NAMES.forEach((n, i) => {
    html += `<div class="cron-field"><div class="label">${escapeHtml(labels[i])}</div><div class="value">${escapeHtml(fields[i])}</div></div>`;
  });
  html += '</div>';
  html += `<div class="cron-next">${escapeHtml(t('cron.next'))}<ul>`;
  runs.forEach((r) => { html += `<li>${escapeHtml(r.toLocaleString(locale))}</li>`; });
  html += '</ul></div>';
  result.innerHTML = html;
  result.style.display = 'block';
}
