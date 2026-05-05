// Simple Interest Calculator with multi-jurisdiction tax support.
//
// Tax models supported:
//   - 'none':   no withholding
//   - 'tr':     Turkish stopaj (single rate, applied flat)
//   - 'de':     German Abgeltungssteuer using KPMG method:
//               base 25% capital gains tax, optional 5.5% solidarity surcharge
//               (Soli) on the Abgelt amount, optional Kirchensteuer where the
//               base Abgelt rate is reduced because KiSt is itself deductible:
//                 abgelt_rate = 25% / (1 + KiSt × 25%)
//   - 'custom': single user-supplied rate (for any other jurisdiction)
//
// onTaxChange/onKistChange are wired via inline onchange handlers and just
// toggle visibility of the relevant subsection.

import { t } from '../../i18n/index.js';
import { showError, hideError } from '../../core/util.js';
import { getCurrencyConfig } from './currency.js';

export function onTaxChange(prefix) {
  const val = document.getElementById(prefix + '-tax').value;
  document.getElementById(prefix + '-tax-tr').style.display = val === 'tr' ? 'block' : 'none';
  document.getElementById(prefix + '-tax-de').style.display = val === 'de' ? 'block' : 'none';
  const customEl = document.getElementById(prefix + '-tax-custom');
  if (customEl) customEl.style.display = val === 'custom' ? 'block' : 'none';
}

export function onKistChange(prefix) {
  document.getElementById(prefix + '-kist-rate').disabled = !document.getElementById(prefix + '-kist').checked;
}

function getTaxSettings(prefix) {
  const country = document.getElementById(prefix + '-tax').value;
  if (country === 'tr') {
    const rate = parseFloat(document.getElementById(prefix + '-stopaj').value) / 100 || 0.15;
    return { country: 'tr', stopajRate: rate };
  }
  if (country === 'de') {
    const hasSoli = document.getElementById(prefix + '-soli').checked;
    const hasKiSt = document.getElementById(prefix + '-kist').checked;
    const kiStRate = hasKiSt ? (parseFloat(document.getElementById(prefix + '-kist-rate').value) / 100 || 0.09) : 0;
    return { country: 'de', hasSoli, hasKiSt, kiStRate };
  }
  if (country === 'custom') {
    const rate = parseFloat(document.getElementById(prefix + '-custom-rate').value) / 100 || 0.20;
    return { country: 'custom', customRate: rate };
  }
  return { country: 'none' };
}

function calcTaxAmount(grossInterest, ts) {
  if (ts.country === 'none' || grossInterest <= 0) {
    return { totalTax: 0, netInterest: grossInterest, breakdown: [] };
  }

  if (ts.country === 'tr') {
    const tax = grossInterest * ts.stopajRate;
    return {
      totalTax: tax,
      netInterest: grossInterest - tax,
      breakdown: [{ label: `🇹🇷 Stopaj Vergisi (%${(ts.stopajRate * 100).toFixed(1)})`, amount: tax }],
    };
  }

  if (ts.country === 'de') {
    // KPMG method: when KiSt applies, Abgelt rate is reduced because KiSt is deductible.
    let abgeltRate = 0.25;
    if (ts.hasKiSt && ts.kiStRate > 0) {
      abgeltRate = 0.25 / (1 + ts.kiStRate * 0.25);
    }
    const abgelt = grossInterest * abgeltRate;
    const soli = ts.hasSoli ? abgelt * 0.055 : 0;
    const kist = (ts.hasKiSt && ts.kiStRate > 0) ? abgelt * ts.kiStRate : 0;
    const totalTax = abgelt + soli + kist;
    const breakdown = [{ label: `🇩🇪 Abgeltungssteuer (${(abgeltRate * 100).toFixed(3)}%)`, amount: abgelt }];
    if (soli > 0) breakdown.push({ label: `${t('interest.de.soli')}`, amount: soli });
    if (kist > 0) breakdown.push({ label: `${t('interest.de.kist')} (${(ts.kiStRate * 100).toFixed(1)}%)`, amount: kist });
    return { totalTax, netInterest: grossInterest - totalTax, breakdown };
  }

  if (ts.country === 'custom') {
    const tax = grossInterest * ts.customRate;
    return {
      totalTax: tax,
      netInterest: grossInterest - tax,
      breakdown: [{ label: `${t('interest.tax.custom')} (${(ts.customRate * 100).toFixed(1)}%)`, amount: tax }],
    };
  }

  return { totalTax: 0, netInterest: grossInterest, breakdown: [] };
}

function renderInterestResult(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const cur = data.currency || { symbol: '₺', locale: 'tr-TR' };
  const fmt = (n) => Math.abs(n).toLocaleString(cur.locale, { minimumFractionDigits: 2 });
  let html = `<div class="irc-row irc-header"><span>${t('interest.result.title')}</span></div>`;
  html += `<div class="irc-row"><span>${data.principalLabel || t('interest.principal.label')}</span><span class="irc-val">${cur.symbol} ${fmt(data.principal)}</span></div>`;
  html += `<div class="irc-row"><span>${t('interest.gross')}</span><span class="irc-val positive">+ ${cur.symbol} ${fmt(data.grossInterest)}</span></div>`;
  if (data.breakdown && data.breakdown.length > 0) {
    data.breakdown.forEach((b) => {
      html += `<div class="irc-row irc-tax"><span>${b.label}</span><span class="irc-val negative">− ${cur.symbol} ${fmt(b.amount)}</span></div>`;
    });
    html += `<div class="irc-row"><span>${t('interest.net')}</span><span class="irc-val positive">+ ${cur.symbol} ${fmt(data.netInterest)}</span></div>`;
  }
  html += `<div class="irc-row irc-total"><span>${t('interest.total')}</span><span class="irc-val total">${cur.symbol} ${fmt(data.total)}</span></div>`;
  el.innerHTML = html;
  el.style.display = 'block';
}

export function calcSimpleInterest() {
  hideError('interest-error');
  const P = parseFloat(document.getElementById('si-principal').value);
  const R = parseFloat(document.getElementById('si-rate').value);
  const T = parseFloat(document.getElementById('si-time').value);
  const unit = document.getElementById('si-unit').value;

  if (isNaN(P) || isNaN(R) || isNaN(T) || P <= 0 || T <= 0) {
    showError('interest-error', t('error.fill-fields'));
    return;
  }

  const tYears = unit === 'day' ? T / 365 : unit === 'month' ? T / 12 : T;
  const grossInterest = P * (R / 100) * tYears;
  const ts = getTaxSettings('si');
  const tax = calcTaxAmount(grossInterest, ts);

  const cur = getCurrencyConfig('si-currency');
  renderInterestResult('si-result-card', {
    principal: P,
    grossInterest,
    breakdown: tax.breakdown,
    netInterest: tax.netInterest,
    total: P + tax.netInterest,
    currency: cur,
  });
}
