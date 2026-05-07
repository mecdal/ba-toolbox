# BA Toolbox

İş analistleri ve operasyon (L2/L3) ekipleri için günlük kullanıma yönelik pratik web araçları koleksiyonu. Tamamen tarayıcıda çalışır — veri sunucuya gönderilmez.

🔗 **Canlı Demo:** https://ba-toolbox.vercel.app

---

## Araçlar (31 araç, 6 kategori)

### Veri & Format
| Araç | Açıklama |
|------|----------|
| **JSON Formatlayıcı** | Güzelleştir / küçült / doğrula / null temizle + ağaç görünümü ve arama |
| **JSON Grid** | Altova XMLSpy-stili tablo görünümü, TSV kopyalama |
| **JSON Karşılaştırma** | Path-bazlı yapısal diff, dizilerde LCS algoritması |
| **JSON Escape/Unescape** | JSON string-safe dönüşüm + iki yönlü swap |
| **CSV → JSON** | RFC 4180 uyumlu parser (quoted/escaped/CRLF/multi-line) |
| **YAML ↔ JSON** | js-yaml CDN üzerinden lazy-load (K8s, GitHub Actions, Helm) |
| **Base64 / Dosya** | UTF-8 round-trip + dosya↔Base64 + indirme |

### Veritabanı
| Araç | Açıklama |
|------|----------|
| **SQL Formatlayıcı** | String-aware (literaller içindeki keyword'ler korunur) |
| **SQL Şablonları** | 5 kategoride hazır sorgular + keyword cheatsheet |
| **KQL Formatlayıcı** | Azure Monitor / Log Analytics / Sentinel için pipe-aware |
| **KQL Şablonları** | 4 kategoride hazır sorgular + keyword cheatsheet |

### Geliştirici
| Araç | Açıklama |
|------|----------|
| **UUID Üretici** | RFC 4122 v4 + non-secure context fallback |
| **URL Encode/Decode** | İki yönlü, anlık dönüştürme |
| **Timestamp Dönüştürücü** | Unix ↔ Tarih, s/ms/auto + multi-format çıktı |
| **URL Kısaltıcı** | TinyURL → is.gd fallback + offline detect |
| **JWT Decoder** | Header/payload + expiry kontrolü (sadece okuma) |
| **Regex Builder** | Pattern + flag, vurgulu eşleşmeler, capture groups |
| **Cron Expression** | Decode, doğrulama, sonraki 5 çalışma + preset şablonlar |
| **HTTP Status Kodları** | 29 kod referansı (1xx-5xx) + arama |
| **cURL Parser** | Method/URL/header/body inspect + query split |

### Hesaplama
| Araç | Açıklama |
|------|----------|
| **Basit Faiz Hesaplama** | TR Stopaj + DE Abgeltungssteuer (KPMG metodu) |
| **Kredi Hesaplama** | Aylık taksit + cent-precise amortizasyon tablosu |

### Metin
| Araç | Açıklama |
|------|----------|
| **Metin Karşılaştırma** | Satır-satır diff |
| **Kelime Sayacı** | Karakter, kelime, cümle, paragraf, okuma süresi |
| **Metin Editörü** | Format seçerek (txt/md/csv/json/html/sql/kql/xml) indirme |
| **Markdown Önizleme** | Hafif GFM-flavored renderer (heading, table, list, code) |

### Analiz & Gereksinim
| Araç | Açıklama |
|------|----------|
| **User Story Yazıcı** | BABOK + Gherkin/checklist AC + INVEST + DoD |
| **Use Case Yazıcı** | Cockburn formatı (actor, ön/son koşul, akışlar) |
| **AC Üretici (Gherkin)** | Feature + çoklu Given/When/Then senaryoları |
| **RACI Matrisi** | Tıkla-değiştir hücreler + tek-A doğrulaması + CSV/MD export |
| **BPMN Modeler** | bpmn-js entegrasyonu (CDN) + import/export XML/SVG |

---

## Özellikler

- 🌍 **TR/EN dil desteği** (Cyber Cyan teması ile karanlık/açık mod)
- 🧰 **Multi-tab sistem** (max 5 sekme açık)
- 🔗 **URL hash ile direkt araç erişimi** (`#json-formatter`)
- 💾 **Son kullanılan araçlar** hafızası (namespaced localStorage)
- 🔍 **Sidebar arama**
- ♿ **A11y**: aria-label, role="tablist", focus-visible, WCAG AA dark-mode kontrast
- 📱 **PWA**: offline çalışır (service worker + manifest)
- 🔒 **Tamamen client-side** — şirket verisi paste edebilirsiniz, sunucuya gitmez

---

## Teknoloji

Saf HTML, CSS ve JavaScript. Bağımlılık yok, build adımı yok. Modern tarayıcılar gerekli (`<script type="module">`, top-level await, optional chaining).

Yalnızca CDN'den lazy-load edilen iki kütüphane:
- **bpmn-js** — sadece BPMN tool ilk açılınca
- **js-yaml** — sadece YAML tool ilk dönüştürmede

İkisi de offline-detect ve timeout korumalı.

---

## Mimari (Sprint 5a sonrası)

```
ba-toolbox/
├── index.html               # Tüm tool panelleri (statik markup)
├── style.css                # Tek CSS dosyası (1320+ satır)
├── manifest.webmanifest     # PWA manifest
├── sw.js                    # Service worker (stale-while-revalidate)
└── src/
    ├── main.js              # ENTRY POINT (modules + window-bridge + init)
    ├── i18n/                # tr.js, en.js, index.js (post-apply hooks)
    ├── core/                # storage, util, theme, nav, tabs, search,
    │                        #   tab-helper, clear, feedback, tool-registry,
    │                        #   base64-codec, cdn-loader
    └── tools/
        ├── data/   (7)      # JSON formatter/grid/diff/escape, CSV, Base64, YAML
        ├── db/     (4+1)    # SQL/KQL formatter + cheatsheet (private _keyword-cards)
        ├── dev/    (9)      # UUID, timestamp, JWT, URL encoder/shortener,
        │                    #   regex, cron, HTTP status, cURL parser
        ├── text/   (4)      # diff, word counter, editor, markdown
        ├── finance/(2+1)    # interest, loan (private currency config)
        └── ba/     (5)      # user story, use case, AC, RACI, BPMN
```

**Tasarım kararları:**
- ES modules (`<script type="module">`) — build adımı yok
- Inline `onclick` handler'lar korundu; `main.js` 100+ fonksiyonu `window`'a köprüler
- Tool kayıtları `src/core/tool-registry.js`'te tek kaynak (nav ↔ tabs sirküler bağımlılık önlemi)
- localStorage `ba-toolbox:*` namespace + legacy migration

---

## Geliştirme

```bash
# Herhangi bir statik sunucu — modül CORS yüzünden file:// çalışmaz
npx serve .
# veya
python3 -m http.server 8000
```

E2E testleri:

```bash
npm install            # @playwright/test
npx playwright test
```

---

## Lisans

ISC
