// URL Shortener — provider chain (TinyURL → is.gd) with timeout + offline detection.
//
// Each provider call is bounded by AbortController; if both fail we surface
// the underlying errors instead of a generic "failed". The button is disabled
// while a request is in flight to prevent double-submits / race conditions.

import { t } from '../../i18n/index.js';
import { showError, hideError, copyToClipboard } from '../../core/util.js';

async function fetchShortUrl(provider, originalUrl, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(provider.endpoint(originalUrl), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`${provider.name} HTTP ${res.status}`);
    const text = (await res.text()).trim();
    if (!text.startsWith('http')) throw new Error(`${provider.name}: unexpected response`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function shortenUrl() {
  hideError('url-short-error');
  const url = document.getElementById('url-short-input').value.trim();
  const btn = document.getElementById('url-short-btn');
  if (!url) return;
  try { new URL(url); } catch {
    showError('url-short-error', t('url-short.error.invalid'));
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    showError('url-short-error', t('url-short.error.offline'));
    return;
  }
  const resultEl = document.getElementById('url-short-result');
  const outputEl = document.getElementById('url-short-output');
  resultEl.style.display = 'none';

  if (btn) { btn.disabled = true; btn.classList.add('btn-loading'); }

  const providers = [
    { name: 'TinyURL', endpoint: (u) => `https://tinyurl.com/api-create.php?url=${encodeURIComponent(u)}` },
    { name: 'is.gd',   endpoint: (u) => `https://is.gd/create.php?format=simple&url=${encodeURIComponent(u)}` },
  ];

  const errors = [];
  try {
    for (const provider of providers) {
      try {
        const shortUrl = await fetchShortUrl(provider, url, 8000);
        outputEl.textContent = shortUrl;
        outputEl.href = shortUrl;
        resultEl.style.display = 'block';
        return;
      } catch (e) {
        errors.push(e && e.name === 'AbortError' ? `${provider.name}: timeout` : (e.message || String(e)));
      }
    }
    showError('url-short-error', `${t('url-short.error.failed')}${errors.join(' · ')}`);
  } finally {
    if (btn) { btn.disabled = false; btn.classList.remove('btn-loading'); }
  }
}

export function copyShortUrl() {
  copyToClipboard(
    document.getElementById('url-short-output').textContent,
    document.getElementById('url-short-copy-btn'),
  );
}
