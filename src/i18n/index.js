// i18n core — manages active language state, translation lookup, and DOM-attribute application.
//
// Public API:
//   getLang() / setLang(lang)              — read/write the active language ('tr' | 'en')
//   t(key)                                 — translate a key (falls back to TR, then to the raw key)
//   applyDomI18n()                         — refresh all data-i18n attributes on the page
//   addPostApplyHook(fn)                   — register a callback that runs after applyDomI18n()
//                                            (used by tools that need to re-render after a language switch)
//   groupKeyMap                            — sidebar group-name → i18n-key map
//
// Storage: language is persisted via the namespaced localStorage helper.

import tr from './tr.js';
import en from './en.js';
import { storageGet, storageSet } from '../core/storage.js';

const translations = { tr, en };

let currentLang = storageGet('lang') || 'en';

export const groupKeyMap = {
  'Veri & Format': 'group.veri',
  'Veritabanı': 'group.veritabani',
  'Geliştirici': 'group.gelistirici',
  'Hesaplama': 'group.hesaplama',
  'Metin': 'group.metin',
  'Analiz & Gereksinim': 'group.analiz',
  'Çalışma Alanı': 'group.workspace',
};

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang !== 'tr' && lang !== 'en') return;
  currentLang = lang;
  storageSet('lang', lang);
}

/**
 * Translate a key. Returns the raw key if no translation is found in any language —
 * this surfaces missing keys in the UI rather than producing a silent empty string.
 */
export function t(key) {
  return (translations[currentLang] || translations.tr)[key] || translations.tr[key] || key;
}

const postApplyHooks = [];

/**
 * Register a callback to run every time applyDomI18n() finishes. Tools that maintain
 * dynamic content (e.g. SQL/KQL cheatsheets, HTTP status list, word counter stats)
 * use this to re-render in the active language without coupling i18n to those tools.
 */
export function addPostApplyHook(fn) {
  if (typeof fn === 'function') postApplyHooks.push(fn);
}

/**
 * Walk the DOM and update every element with a data-i18n / data-i18n-placeholder /
 * data-i18n-aria / data-i18n-aria-label attribute, then run all post-apply hooks.
 */
export function applyDomI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  });

  // Lang toggle button text reflects the *next* language for clarity.
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = currentLang === 'tr' ? '🌐 EN' : '🌐 TR';

  postApplyHooks.forEach((fn) => {
    try { fn(); } catch (err) {
      // Per-tool refresh hooks must never break the language switch flow.
      // Swallow individual hook errors so one buggy tool can't poison the whole UI.
      console.error('[i18n] post-apply hook failed:', err);
    }
  });
}
