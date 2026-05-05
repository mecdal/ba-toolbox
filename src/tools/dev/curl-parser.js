// cURL command parser — paste a `curl …` line, see method/URL/headers/body/flags.
//
// We tokenize the input ourselves rather than splitting on whitespace, so quoted
// payloads (-d '{"x":1}') survive intact. The argument loop recognizes the
// most common curl flags; unknown short flags greedily consume the next token
// as their value if it doesn't look like another flag.

import { t } from '../../i18n/index.js';
import { showError, hideError, escapeHtml } from '../../core/util.js';

/**
 * Tokenize a curl command, honoring single/double quotes and shell line
 * continuations (backslash followed by newline).
 */
function tokenizeCurl(text) {
  const cleaned = text.replace(/\\\r?\n\s*/g, ' ').trim();
  const tokens = [];
  let current = '';
  let quote = null;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (quote) {
      if (ch === quote) { quote = null; continue; }
      // Inside double quotes only, backslash escapes the next char.
      if (quote === '"' && ch === '\\' && i + 1 < cleaned.length) { current += cleaned[++i]; continue; }
      current += ch; continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (/\s/.test(ch)) {
      if (current.length > 0) { tokens.push(current); current = ''; }
      continue;
    }
    current += ch;
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

export function parseCurl() {
  hideError('curl-error');
  const raw = document.getElementById('curl-input').value.trim();
  const out = document.getElementById('curl-result');
  if (!raw) { out.style.display = 'none'; return; }

  let tokens;
  try { tokens = tokenizeCurl(raw); }
  catch (e) { showError('curl-error', `${t('curl.error.parse')}: ${e.message}`); return; }

  if (!tokens.length || !/^curl/i.test(tokens[0])) {
    showError('curl-error', t('curl.error.notcurl'));
    return;
  }

  let url = '';
  let method = 'GET';
  const headers = [];
  let body = '';
  let bodyType = null;
  let user = null;
  let followRedirects = false;
  let insecure = false;

  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i];
    const next = () => tokens[++i];
    if (tok === '-X' || tok === '--request') method = (next() || 'GET').toUpperCase();
    else if (tok === '-H' || tok === '--header') headers.push(next() || '');
    else if (tok === '-d' || tok === '--data' || tok === '--data-raw') { body = next() || ''; bodyType = 'data'; if (method === 'GET') method = 'POST'; }
    else if (tok === '--data-binary') { body = next() || ''; bodyType = 'binary'; if (method === 'GET') method = 'POST'; }
    else if (tok === '--data-urlencode') { body = next() || ''; bodyType = 'urlencoded'; if (method === 'GET') method = 'POST'; }
    else if (tok === '-u' || tok === '--user') user = next() || '';
    else if (tok === '-L' || tok === '--location') followRedirects = true;
    else if (tok === '-k' || tok === '--insecure') insecure = true;
    else if (tok === '--compressed' || tok === '-i' || tok === '--include' || tok === '-s' || tok === '--silent' || tok === '-v' || tok === '--verbose') { /* ignored */ }
    else if (tok.startsWith('-')) {
      // Unknown flag — best-effort skip of its value if any.
      if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) i++;
    }
    else if (!url) url = tok;
  }

  if (!url) { showError('curl-error', t('curl.error.nourl')); return; }

  let parsedUrl = null;
  const queryPairs = [];
  try {
    parsedUrl = new URL(url);
    parsedUrl.searchParams.forEach((v, k) => queryPairs.push({ k, v }));
  } catch { /* malformed URL — keep going with raw display */ }

  let html = `<div class="curl-row"><span class="label">${t('curl.method')}</span><span class="value"><strong>${escapeHtml(method)}</strong></span></div>`;
  html += `<div class="curl-row"><span class="label">URL</span><span class="value">${escapeHtml(url)}</span></div>`;
  if (parsedUrl) {
    html += `<div class="curl-row"><span class="label">${t('curl.host')}</span><span class="value">${escapeHtml(parsedUrl.host)}</span></div>`;
    html += `<div class="curl-row"><span class="label">${t('curl.path')}</span><span class="value">${escapeHtml(parsedUrl.pathname)}</span></div>`;
    if (queryPairs.length) {
      html += `<div class="curl-row"><span class="label">${t('curl.query')}</span><div class="curl-headers">${queryPairs.map((p) => `<div><span class="k">${escapeHtml(p.k)}</span>= ${escapeHtml(p.v)}</div>`).join('')}</div></div>`;
    }
  }
  if (headers.length) {
    html += `<div class="curl-row"><span class="label">${t('curl.headers')}</span><div class="curl-headers">${headers.map((h) => {
      const idx = h.indexOf(':');
      const k = idx > 0 ? h.slice(0, idx).trim() : h;
      const v = idx > 0 ? h.slice(idx + 1).trim() : '';
      return `<div><span class="k">${escapeHtml(k)}:</span> ${escapeHtml(v)}</div>`;
    }).join('')}</div></div>`;
  }
  if (user) html += `<div class="curl-row"><span class="label">${t('curl.auth')}</span><span class="value">Basic — ${escapeHtml(user)}</span></div>`;
  if (body) {
    let bodyDisplay = body;
    try {
      if (body.startsWith('{') || body.startsWith('[')) bodyDisplay = JSON.stringify(JSON.parse(body), null, 2);
    } catch { /* keep raw */ }
    html += `<div class="curl-row"><span class="label">${t('curl.body')} (${bodyType || 'data'})</span><span class="value"><pre style="white-space:pre-wrap; margin:0;">${escapeHtml(bodyDisplay)}</pre></span></div>`;
  }
  const flagsList = [];
  if (followRedirects) flagsList.push('-L (follow redirects)');
  if (insecure) flagsList.push('-k (skip TLS verify)');
  if (flagsList.length) html += `<div class="curl-row"><span class="label">${t('curl.flags')}</span><span class="value">${escapeHtml(flagsList.join(', '))}</span></div>`;

  out.innerHTML = html;
  out.style.display = 'block';
}
