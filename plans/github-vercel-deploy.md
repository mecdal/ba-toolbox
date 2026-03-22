---
planStatus:
  planId: plan-ba-toolbox-deploy
  title: BA Toolbox — GitHub & Vercel Deployment
  status: draft
  planType: feature
  priority: high
  owner: mecda
  stakeholders: []
  tags:
    - deployment
    - github
    - vercel
  created: "2026-03-22"
  updated: "2026-03-22T21:30:00.000Z"
  progress: 0
---
# BA Toolbox — GitHub & Vercel Deployment Planı

## Proje Özeti

3 dosyalı vanilla JS/HTML/CSS web uygulaması. 15 BA aracı içeriyor. Build adımı yok, pure static site — Vercel'e direkt deploy edilebilir.

**Dosyalar:** `index.html`, `app.js`, `style.css`

---

## Aşama 1: Kod Gözden Geçirme & Bug Düzeltme

### Tespit Edilen Sorunlar

#### 🔴 KRİTİK — HTML Yapı Hatası (index.html:152)
`#tab````-savings` div'i `#tab````-compound` div'inin **içinde** açılıyor. Bu yüzden:
- "Birikim Hesabı" tab'ı çalışmıyor
- Compound tab gizlenince savings da gizleniyor

**Düzeltme:** `#tab-savings` div'ini `````#tab````-compound` div'inin **kardeşi** yapacak şekilde taşı.

```html
<!-- YANLIŞ (şu an) -->
<div id="tab-compound" class="tab-content">
  ...
  <div id="tab-savings" class="tab-content">  <!-- içerde! -->
    ...
  </div>
</div>

<!-- DOĞRU -->
<div id="tab-compound" class="tab-content">
  ...
</div>
<div id="tab-savings" class="tab-content">  <!-- kardeş -->
  ...
</div>
```

#### 🟡 ORTA — `calcSavings()` fonksiyonu `sa-freq` parametresini kullanmıyor
`app.js:298`'de `n` değişkeni okunuyor ama faiz hesabında kullanılmıyor. Faiz her zaman aylık hesaplanıyor. Şimdilik not olarak bırakılabilir, sonraya ertelenebilir.

#### 🟡 ORTA — Mobil: sidebar responsive değil
`@media (max-width: 768px)` var ama sidebar kaybolmuyor/collapse olmuyor, sadece küçülüyor. Telefonlarda kullanılamaz. Şimdilik kabul edilebilir.

### Yapılacaklar
- [ ] `index.html`'deki `#tab-savings` yapı hatasını düzelt
- [ ] Manuel test: Faiz hesaplama 3 tab da çalışıyor mu?

---

## Aşama 2: GitHub'a Hazırlık

### Yapılacaklar
- [ ] `.gitignore` dosyası oluştur (OS dosyaları için)
- [ ] `README.md` oluştur (proje açıklaması, araç listesi, Vercel linki)
- [ ] `git init` çalıştır
- [ ] İlk commit yap

### `.gitignore` içeriği
```
.DS_Store
Thumbs.db
*.log
node_modules/
.env
```

### `README.md` içeriği
- Proje başlığı ve açıklaması
- Araç listesi (15 araç)
- Canlı demo linki (Vercel'den sonra eklenecek)
- Ekran görüntüsü (opsiyonel)

---

## Aşama 3: GitHub'a Push

### Detaylar
- **Repo adı:** `ba-toolbox`
- **Görünürlük:** Public
- **Branch:** `main`

### Yapılacaklar
- [ ] `gh repo create ba-toolbox --public` ile repo oluştur
- [ ] Remote ekle ve push yap

---

## Aşama 4: Vercel Deploy

### Yaklaşım
Static site olduğu için özel bir `vercel.json` gerekmez. Vercel otomatik tanır.

### Yapılacaklar
- [ ] Vercel hesabı GitHub'a bağlı mı kontrol et
- [ ] `vercel --prod` CLI ile ya da Vercel dashboard üzerinden GitHub reposunu import et
- [ ] Deploy URL'ini `README.md`'e ekle

### Vercel Yapılandırması (opsiyonel)
```json
{
  "cleanUrls": true,
  "trailingSlash": false
}
```

---

## Uygulama Sırası

```
[1] Bug fix (HTML yapı)
       ↓
[2] .gitignore + README
       ↓
[3] git init + commit
       ↓
[4] GitHub repo oluştur + push
       ↓
[5] Vercel'e import + deploy
       ↓
[6] README'ye canlı link ekle + son commit
```

---

## Riskler

| Risk | Olasılık | Çözüm |
| --- | --- | --- |
| `gh` CLI kurulu değil | Orta | `winget install GitHub.cli` |
| Vercel CLI kurulu değil | Orta | `npm i -g vercel` veya dashboard üzerinden |
| Git kurulu değil | Düşük | `winget install Git.Git` |
