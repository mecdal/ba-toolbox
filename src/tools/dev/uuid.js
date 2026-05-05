// UUID Generator — RFC 4122 v4.
//
// Uses crypto.randomUUID() in secure contexts; falls back to a hand-rolled
// generator built on crypto.getRandomValues (or Math.random as a last resort)
// for HTTP/file:// and older browsers.

function uuidv4Fallback() {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  // Set version (4) and variant (10xx) bits per RFC 4122.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateOneUUID() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch { /* secure-context guard threw; fall through */ }
  return uuidv4Fallback();
}

export function generateUUIDs() {
  const count = parseInt(document.getElementById('uuid-count').value) || 1;
  const clamped = Math.max(1, Math.min(100, count));
  const uuids = Array.from({ length: clamped }, generateOneUUID);
  document.getElementById('uuid-output').value = uuids.join('\n');
}
