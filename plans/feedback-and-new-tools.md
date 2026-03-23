---
planStatus:
  planId: plan-feedback-and-new-tools
  title: Feedback Butonu + User Story Yazıcı
  status: draft
  planType: feature
  priority: high
  owner: mecdal
  stakeholders: []
  tags: [feedback, user-story, requirements]
  created: "2026-03-23"
  updated: "2026-03-23T14:30:00.000Z"
  progress: 0
---

# Feedback Butonu + User Story Yazıcı

## Kapsam

1. **Feedback butonu** — sağ altta sabit floating buton, tıklayınca mailto açar
2. **User Story Yazıcı** — As a / I want / So that + Acceptance Criteria (Given/When/Then) tek araçta

AC Formatter ve INVEST Kontrolü şimdilik kapsam dışı.

---

## Bölüm 1 — Feedback Butonu

### Tasarım
- Sağ alt köşede sabit `position: fixed` buton (mockup'ta görüldüğü gibi)
- "💬 Feedback" yazısı, mavi accent rengi, pill şekli
- Tıklayınca `mailto:` ile e-posta istemcisi açılır
- Konu satırı: `[BA Toolbox Feedback]`
- i18n: TR + EN

### Değişecek dosyalar
- `index.html` — buton elementi ekle
- `style.css` — `#feedback-btn` fixed positioning
- `app.js` — i18n anahtarı

---

## Bölüm 2 — User Story Yazıcı (Yeni Araç)

### Çıktı formatı
```
As a [ROL],
I want to [AKSİYON],
So that [FAYDA].

Acceptance Criteria:
  Given [BAĞLAM],
  When [OLAY],
  Then [SONUÇ].

  Given [BAĞLAM 2],      ← birden fazla AC eklenebilir
  When [OLAY 2],
  Then [SONUÇ 2].
```

### UI Bileşenleri (mockup'a bakın)
- **Rol** — text input
- **Aksiyon** — text input
- **Fayda** — text input
- Separator
- **AC bloğu** — Given / When / Then (3 input)
- **"+ Acceptance Criteria Ekle"** butonu — yeni AC bloğu ekler (dinamik)
- **Oluştur** (primary) + **Temizle** butonları
- **Çıktı alanı** — formatlanmış metin (readonly textarea)
- **📋 Kopyala** + **Markdown olarak kopyala** butonları

### Nav grubu
Sidebar'a yeni grup eklenir: **"Analiz & Gereksinim"** (TR) / **"Analysis & Requirements"** (EN)
- İlk araç: User Story Yazıcı / User Story Writer (icon: 📖)

### Değişecek dosyalar
- `index.html` — yeni panel `#panel-user-story`
- `app.js` — araç tanımı + `buildUserStory()` + `addAcBlock()` + i18n
- `style.css` — AC bloğu stilleri (minimal, mevcut kart stiliyle uyumlu)

---

## Uygulama Sırası

| # | Görev |
|---|-------|
| 1 | `style.css` — feedback btn + AC block stilleri |
| 2 | `index.html` — feedback btn + user-story paneli |
| 3 | `app.js` — i18n anahtarları (TR+EN) |
| 4 | `app.js` — tools array'e user-story ekle, yeni grup |
| 5 | `app.js` — `buildUserStory()` ve `addAcBlock()` fonksiyonları |
| 6 | `tests/e2e/toolbox.spec.js` — 2-3 E2E test |
| 7 | commit + push (Vercel otomatik deploy) |

---

## Mockup

![User Story Yazıcı + Feedback Butonu](screenshot.png){mockup:plans/user-story-tool.mockup.html}
