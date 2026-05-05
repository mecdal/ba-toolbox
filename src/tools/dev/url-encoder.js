// URL Encoder/Decoder — bidirectional textarea pair.
//
// No exposed API: typing in either field immediately encodes/decodes into
// the other. Wired up via initUrlEncoder() at app startup. encodeURIComponent
// can throw on malformed surrogate pairs; we swallow the error rather than
// surfacing it because the user is mid-typing and a partial input isn't a bug.

export function initUrlEncoder() {
  const rawEl = document.getElementById('url-raw');
  const encEl = document.getElementById('url-encoded');
  if (!rawEl || !encEl) return;
  rawEl.addEventListener('input', () => {
    try { encEl.value = encodeURIComponent(rawEl.value); } catch { /* mid-edit malformed input */ }
  });
  encEl.addEventListener('input', () => {
    try { rawEl.value = decodeURIComponent(encEl.value); } catch { /* invalid percent-escape */ }
  });
}
