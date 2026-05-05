// Loan Calculator with monthly amortization schedule.
//
// Standard amortization formula (annuity), then a row-by-row schedule using
// banker's rounding at each step. The final installment absorbs whatever
// rounding drift accumulated, so the closing balance is exactly 0.00 — that's
// what banks print and what users expect when they reconcile manually.

import { t } from '../../i18n/index.js';
import { showError, hideError, setEmptyState } from '../../core/util.js';
import { getCurrencyConfig } from './currency.js';

export function calcLoanPayment() {
  hideError('loan-error');
  const P = parseFloat(document.getElementById('loan-principal').value);
  const annualRate = parseFloat(document.getElementById('loan-rate').value);
  const months = parseInt(document.getElementById('loan-months').value);

  if (isNaN(P) || isNaN(annualRate) || isNaN(months) || P <= 0 || months <= 0) {
    showError('loan-error', t('error.fill-fields'));
    return;
  }

  const r = annualRate / 100 / 12;
  const monthlyPayment = r === 0
    ? P / months
    : P * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  const totalPayment = monthlyPayment * months;
  const totalInterest = totalPayment - P;
  const cur = getCurrencyConfig('loan-currency');
  const fmt = (n) => n.toLocaleString(cur.locale, { minimumFractionDigits: 2 });

  const cardEl = document.getElementById('loan-result-card');
  let html = `<div class="irc-row irc-header"><span>${t('loan.result.title')}</span></div>`;
  html += `<div class="irc-row"><span>${t('loan.amount.label')}</span><span class="irc-val">${cur.symbol} ${fmt(P)}</span></div>`;
  html += `<div class="irc-row"><span>${t('loan.monthly')}</span><span class="irc-val total">${cur.symbol} ${fmt(monthlyPayment)}</span></div>`;
  html += `<div class="irc-row"><span>${t('loan.total.payment')}</span><span class="irc-val">${cur.symbol} ${fmt(totalPayment)}</span></div>`;
  html += `<div class="irc-row irc-tax"><span>${t('loan.total.interest')}</span><span class="irc-val negative">− ${cur.symbol} ${fmt(totalInterest)}</span></div>`;
  html += `<div class="irc-row irc-total"><span>${t('loan.interest.ratio')}</span><span class="irc-val total">${((totalInterest / P) * 100).toFixed(1)}%</span></div>`;
  cardEl.innerHTML = html;
  cardEl.style.display = 'block';

  // Banker's-rounded amortization with final-row drift correction.
  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  let remaining = round2(P);
  let rows = '';
  for (let i = 1; i <= months; i++) {
    const isLast = i === months;
    let interestPayment = round2(remaining * r);
    let principalPayment = round2(monthlyPayment - interestPayment);
    let installment = round2(interestPayment + principalPayment);
    if (isLast) {
      principalPayment = round2(remaining);
      installment = round2(principalPayment + interestPayment);
      remaining = 0;
    } else {
      remaining = round2(Math.max(0, remaining - principalPayment));
    }
    rows += `<tr><td>${i}</td><td>${fmt(installment)}</td><td>${fmt(principalPayment)}</td><td style="color:var(--error);">${fmt(interestPayment)}</td><td><strong>${fmt(remaining)}</strong></td></tr>`;
  }
  document.getElementById('loan-table').innerHTML = rows;
  document.getElementById('loan-table-wrap').style.display = '';
  setEmptyState('loan-empty', false);
}
