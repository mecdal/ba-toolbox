// Base64 / File tool — text encode/decode + file-to-Base64 + Base64-to-file.
//
// Text round-trip uses TextEncoder/TextDecoder (via core/base64-codec) so emoji
// and surrogate pairs survive intact. File path uses FileReader.readAsDataURL
// which already produces standard base64 (we strip the "data:...,").

import { t } from '../../i18n/index.js';
import { showError, hideError } from '../../core/util.js';
import { utf8ToBase64, base64ToUtf8 } from '../../core/base64-codec.js';

export function base64Encode() {
  hideError('base64-error');
  try {
    const input = document.getElementById('b64-raw').value;
    document.getElementById('b64-encoded').value = utf8ToBase64(input);
  } catch (e) {
    showError('base64-error', t('b64.error.encode') + e.message);
  }
}

export function base64Decode() {
  hideError('base64-error');
  try {
    const input = document.getElementById('b64-encoded').value;
    document.getElementById('b64-raw').value = base64ToUtf8(input);
  } catch (e) {
    showError('base64-error', t('b64.error.decode'));
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export function fileToBase64() {
  const fileInput = document.getElementById('file-to-b64-input');
  const file = fileInput.files[0];
  if (!file) { alert('Lütfen bir dosya seçin.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    // readAsDataURL gives us "data:<mime>;base64,<payload>" — strip the prefix.
    const b64 = reader.result.split(',')[1];
    document.getElementById('file-b64-output').value = b64;
    document.getElementById('file-b64-info').textContent =
      `${file.name} · ${formatBytes(file.size)} → ${b64.length} karakter`;
  };
  reader.readAsDataURL(file);
}

export function base64ToFile() {
  const b64 = document.getElementById('b64-to-file-input').value.trim();
  const filename = document.getElementById('b64-target-filename').value.trim() || 'dosya';
  if (!b64) return;
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes]));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    showError('base64-error', t('b64.error.decode'));
  }
}
