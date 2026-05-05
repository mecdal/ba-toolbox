// Base64 / Base64url ↔ UTF-8 codec primitives.
//
// Split out of the Base64 tool because JWT also needs base64ToUtf8 to decode
// header/payload. TextEncoder/TextDecoder are used (not the legacy
// unescape(encodeURIComponent) trick) so emoji, surrogate pairs and rare
// scripts round-trip correctly.

export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function base64ToUtf8(b64) {
  // Tolerate base64url and missing padding (common in JWTs and copy/pasted tokens).
  const normalized = b64.trim().replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}
