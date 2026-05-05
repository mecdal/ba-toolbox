// HTTP Status Code reference — search + class (1xx-5xx) filter.
//
// The status table is curated for incident-triage hot-paths (auth, gateway,
// rate-limit, etc.) rather than exhaustive — we deliberately omit 1990s-era
// codes (303, 415's siblings) to keep the list scannable.

import { t, getLang } from '../../i18n/index.js';
import { escapeHtml } from '../../core/util.js';

const HTTP_STATUS_CODES = [
  { code: 100, name: 'Continue',                desc: { tr: 'Sunucu başlığı aldı; istemci gövdeyi göndermeye devam edebilir.', en: 'Server got headers; client should proceed to send body.' } },
  { code: 101, name: 'Switching Protocols',     desc: { tr: 'Protokol değişimi onaylandı (örn. WebSocket upgrade).',          en: 'Protocol upgrade accepted (e.g. WebSocket upgrade).' } },
  { code: 200, name: 'OK',                      desc: { tr: 'Standart başarılı yanıt.',                                       en: 'Standard success response.' } },
  { code: 201, name: 'Created',                 desc: { tr: 'Kaynak oluşturuldu (genelde POST sonrası).',                     en: 'Resource created (typically after POST).' } },
  { code: 202, name: 'Accepted',                desc: { tr: 'İstek alındı, işlem asenkron olarak devam ediyor.',              en: 'Request accepted, processing continues async.' } },
  { code: 204, name: 'No Content',              desc: { tr: 'Başarılı, ama gövde yok (genelde DELETE / PUT).',                en: 'Success with no body (typically DELETE / PUT).' } },
  { code: 301, name: 'Moved Permanently',       desc: { tr: 'Kaynak kalıcı olarak taşındı; yeni URL’i kullanın.',              en: 'Resource moved permanently; use new URL.' } },
  { code: 302, name: 'Found',                   desc: { tr: 'Geçici yönlendirme.',                                            en: 'Temporary redirect.' } },
  { code: 304, name: 'Not Modified',            desc: { tr: 'Cache geçerli; yeniden indirmeye gerek yok.',                    en: 'Cache still valid; no re-download needed.' } },
  { code: 307, name: 'Temporary Redirect',      desc: { tr: 'Geçici yönlendirme; istek metodu korunur.',                      en: 'Temporary redirect; method preserved.' } },
  { code: 308, name: 'Permanent Redirect',      desc: { tr: 'Kalıcı yönlendirme; metot korunur.',                             en: 'Permanent redirect; method preserved.' } },
  { code: 400, name: 'Bad Request',             desc: { tr: 'İstek bozuk (eksik/hatalı parametre, geçersiz JSON).',           en: 'Malformed request (missing/invalid params, bad JSON).' } },
  { code: 401, name: 'Unauthorized',            desc: { tr: 'Kimlik doğrulama gerekli ya da token geçersiz.',                 en: 'Authentication required or token invalid.' } },
  { code: 403, name: 'Forbidden',               desc: { tr: 'Kimlik doğrulandı ama yetki yok.',                               en: 'Authenticated but not authorized.' } },
  { code: 404, name: 'Not Found',               desc: { tr: 'Kaynak yok.',                                                    en: 'Resource does not exist.' } },
  { code: 405, name: 'Method Not Allowed',      desc: { tr: 'HTTP metodu bu kaynak için izinli değil.',                       en: 'HTTP method not allowed on this resource.' } },
  { code: 408, name: 'Request Timeout',         desc: { tr: 'Sunucu istek için çok uzun bekledi.',                            en: 'Server timed out waiting for request.' } },
  { code: 409, name: 'Conflict',                desc: { tr: 'Kaynak çakışması (örn. duplicate, version mismatch).',          en: 'Resource conflict (e.g. duplicate, version mismatch).' } },
  { code: 410, name: 'Gone',                    desc: { tr: 'Kaynak kalıcı olarak silindi.',                                  en: 'Resource permanently removed.' } },
  { code: 413, name: 'Payload Too Large',       desc: { tr: 'İstek gövdesi sunucu limitini aşıyor.',                          en: 'Request body exceeds server limit.' } },
  { code: 415, name: 'Unsupported Media Type',  desc: { tr: 'Content-Type desteklenmiyor.',                                   en: 'Content-Type not supported.' } },
  { code: 422, name: 'Unprocessable Entity',    desc: { tr: 'İstek anlaşıldı ama validasyon başarısız.',                      en: 'Request understood but validation failed.' } },
  { code: 429, name: 'Too Many Requests',       desc: { tr: 'Rate limit aşıldı.',                                             en: 'Rate limit exceeded.' } },
  { code: 500, name: 'Internal Server Error',   desc: { tr: 'Sunucu beklenmedik hata; loglarda detay aranmalı.',             en: 'Unexpected server error; check logs.' } },
  { code: 501, name: 'Not Implemented',         desc: { tr: 'Sunucu bu özelliği henüz desteklemiyor.',                        en: 'Feature not yet implemented.' } },
  { code: 502, name: 'Bad Gateway',             desc: { tr: 'Upstream sunucudan geçersiz yanıt (proxy/LB sorunu).',           en: 'Invalid response from upstream (proxy/LB issue).' } },
  { code: 503, name: 'Service Unavailable',     desc: { tr: 'Servis geçici olarak kapalı (bakım, aşırı yük).',                en: 'Service temporarily unavailable (maintenance, overload).' } },
  { code: 504, name: 'Gateway Timeout',         desc: { tr: 'Upstream sunucu zamanında yanıt vermedi.',                       en: 'Upstream server did not respond in time.' } },
  { code: 507, name: 'Insufficient Storage',    desc: { tr: 'Sunucuda yeterli depolama alanı yok.',                           en: 'Server out of storage.' } },
];

let httpStatusFilter = 'all';

export function setHttpFilter(cls) {
  httpStatusFilter = cls;
  document.querySelectorAll('.http-filter').forEach((b) => b.classList.toggle('active', b.dataset.class === cls));
  filterHttpStatus();
}

export function filterHttpStatus() {
  const list = document.getElementById('http-status-list');
  if (!list) return;
  const q = (document.getElementById('http-search').value || '').trim().toLowerCase();
  const lang = getLang() === 'en' ? 'en' : 'tr';
  const matches = HTTP_STATUS_CODES.filter((s) => {
    const classOk = httpStatusFilter === 'all' || String(s.code).startsWith(httpStatusFilter);
    if (!classOk) return false;
    if (!q) return true;
    return String(s.code).includes(q)
      || s.name.toLowerCase().includes(q)
      || s.desc[lang].toLowerCase().includes(q);
  });
  list.innerHTML = matches.map((s) => `
    <div class="http-status-item c-${String(s.code)[0]}">
      <div class="code">${s.code}</div>
      <div>
        <div class="name">${escapeHtml(s.name)}</div>
        <div class="desc">${escapeHtml(s.desc[lang])}</div>
      </div>
    </div>
  `).join('');
  if (matches.length === 0) list.innerHTML = `<div class="empty-state visible">${escapeHtml(t('http.empty'))}</div>`;
}
