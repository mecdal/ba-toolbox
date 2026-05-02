---
planStatus:
  planId: plan-ba-toolbox-deploy
  title: BA Toolbox — GitHub & Vercel Deployment
  status: completed
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
  progress: 100
---
# BA Toolbox — GitHub & Vercel Deployment Planı

## Proje Özeti

3 dosyalı vanilla JS/HTML/CSS web uygulaması. 15 BA aracı içeriyor. Build adımı yok, pure static site — Vercel'e direkt deploy edilebilir.

**Dosyalar:** `index.html`, `app.js`, `style.css`

---

## Aşama 1: Kod Gözden Geçirme & Bug Düzeltme

### Tespit Edilen Sorunlar (çözüldü)

#### ✅ ÇÖZÜLDÜ — Faiz hesaplama tab yapısı
Eski sürümde `#tab-savings` div'i `#tab-compound` içinde iç içe açılıyordu. Tasarım yeniden değerlendirildi: bileşik faiz ve birikim hesabı sekmeleri kaldırıldı, faiz aracı yalnız **Basit Faiz** olarak tutuldu. Ayrı **Kredi Hesaplama** aracı eklendi (amortisman tablosu dahil).

#### 🟡 ORTA — Mobil: sidebar responsive değil
`@media (max-width: 768px)` var ama sidebar kaybolmuyor/collapse olmuyor, sadece küçülüyor. Telefonlarda kullanılamaz. Şimdilik kabul edilebilir.

### Yapılacaklar
- [x] Faiz hesaplama tab yapısı düzeltildi (sadeleştirildi)
- [x] Manuel test: Basit faiz ve kredi hesaplama panelleri çalışıyor

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
