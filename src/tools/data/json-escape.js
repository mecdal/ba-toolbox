// JSON Escape / Unescape — convert between raw text and JSON-string-safe form.
//
// jsonEscapeStr uses JSON.stringify and strips the outer quotes (so the user
// gets just the escaped content, ready to paste into a string literal).
// jsonUnescapeStr accepts both forms (with or without surrounding quotes) so
// users can paste either a bare escaped fragment or a complete JSON string.
// jsonSwap exchanges the two textareas — handy for round-tripping.

import { t } from '../../i18n/index.js';
import { showError, hideError } from '../../core/util.js';

export function jsonEscapeStr() {
  hideError('json-escape-error');
  const input = document.getElementById('json-escape-input').value;
  document.getElementById('json-escape-output').value = JSON.stringify(input).slice(1, -1);
}

export function jsonUnescapeStr() {
  hideError('json-escape-error');
  const raw = document.getElementById('json-escape-output').value.trim();
  if (!raw) return;
  const toparse = (raw.startsWith('"') && raw.endsWith('"')) ? raw : '"' + raw + '"';
  try {
    const parsed = JSON.parse(toparse);
    document.getElementById('json-escape-input').value = parsed;
  } catch (e) {
    showError('json-escape-error', t('json-esc.error') + e.message);
  }
}

export function jsonSwap() {
  const top = document.getElementById('json-escape-input');
  const bot = document.getElementById('json-escape-output');
  const tmp = top.value;
  top.value = bot.value;
  bot.value = tmp;
  hideError('json-escape-error');
}
