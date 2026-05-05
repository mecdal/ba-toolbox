// JWT Decoder — read-only inspection (does NOT verify signatures).
//
// Tokens are 3 base64url segments joined by ".". Header and payload are JSON;
// signature is opaque to us. Expiry status is i18n-aware: locale formatting +
// translated "expired" / "valid" labels. base64ToUtf8 is shared with the
// Base64 tool via src/core/base64-codec.js.

import { t, getLang } from '../../i18n/index.js';
import { showError, hideError } from '../../core/util.js';
import { base64ToUtf8 } from '../../core/base64-codec.js';

export function decodeJWT() {
  hideError('jwt-error');
  const token = document.getElementById('jwt-input').value.trim();
  const parts = token.split('.');
  if (parts.length !== 3) {
    showError('jwt-error', t('jwt.error.format'));
    return;
  }

  try {
    const decode = (str) => JSON.parse(base64ToUtf8(str));
    const header = decode(parts[0]);
    const payload = decode(parts[1]);

    document.getElementById('jwt-header').value = JSON.stringify(header, null, 2);
    document.getElementById('jwt-payload').value = JSON.stringify(payload, null, 2);

    if (payload.exp) {
      const exp = new Date(payload.exp * 1000);
      const expired = exp < new Date();
      const locale = getLang() === 'tr' ? 'tr-TR' : 'en-GB';
      const status = expired ? `❌ ${t('jwt.exp.expired')}` : `✅ ${t('jwt.exp.valid')}`;
      document.getElementById('jwt-exp').textContent =
        `${t('jwt.exp.label')}: ${exp.toLocaleString(locale)} — ${status}`;
    } else {
      document.getElementById('jwt-exp').textContent = t('jwt.exp.none');
    }
  } catch (e) {
    showError('jwt-error', t('jwt.error.decode') + e.message);
  }
}
