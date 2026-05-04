// Theme toggle: persists "light" or "dark" in storage and reflects it on
// document.documentElement[data-theme]. The button label is i18n-driven and
// shows the *target* theme (so when dark is active it offers "Light Mode").

import { storageGet, storageSet } from './storage.js';
import { t } from '../i18n/index.js';

export function initTheme() {
  const saved = storageGet('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  storageSet('theme', next);
  updateThemeBtn(next);
}

export function updateThemeBtn(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? t('theme.light') : t('theme.dark');
}
