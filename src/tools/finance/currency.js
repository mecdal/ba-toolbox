// Shared currency config used by both Interest and Loan calculators.
//
// `locale` is the locale string we hand to Number.prototype.toLocaleString
// for grouping separators and decimal style. We don't try to do FX conversion
// — these tools work in whatever currency the user picked.

export const currencyConfigs = {
  TRY: { symbol: '₺', locale: 'tr-TR' },
  EUR: { symbol: '€', locale: 'de-DE' },
  USD: { symbol: '$', locale: 'en-US' },
  GBP: { symbol: '£', locale: 'en-GB' },
};

export function getCurrencyConfig(selectorId) {
  const code = document.getElementById(selectorId)?.value || 'TRY';
  return { code, ...currencyConfigs[code] };
}
