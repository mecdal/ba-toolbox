// Cross-cutting helpers used by every tool.
//
// copyToClipboard, showError/hideError and setEmptyState all read i18n at call time
// so the active language is always picked up; escapeHtml and debounce are pure utilities.

import { t } from '../i18n/index.js';

export async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = t('copied');
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('btn-success');
    }, 2000);
  } catch {
    alert(t('copy.failed'));
  }
}

export function showError(boxId, msg) {
  const el = document.getElementById(boxId);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

export function hideError(boxId) {
  const el = document.getElementById(boxId);
  if (el) el.style.display = 'none';
}

export function setEmptyState(elId, isEmpty) {
  const el = document.getElementById(elId);
  if (el) el.classList.toggle('visible', !!isEmpty);
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Trailing-edge debounce: invokes fn only after `delay` ms of silence.
 * Used by the JSON tree search to avoid re-walking the DOM on every keystroke.
 */
export function debounce(fn, delay) {
  let timer = null;
  return function debounced(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
