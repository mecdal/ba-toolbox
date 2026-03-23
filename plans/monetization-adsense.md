---
planStatus:
  planId: plan-monetization-adsense
  title: BA Toolbox — Google AdSense ile Para Kazanma
  status: draft
  planType: feature
  priority: high
  owner: mecdal
  stakeholders: []
  tags: [monetization, adsense, domain]
  created: "2026-03-23"
  updated: "2026-03-23T11:00:00.000Z"
  progress: 0
---

# BA Toolbox — Google AdSense ile Para Kazanma

## Hedef

Mevcut static site'a Google AdSense reklam entegrasyonu yaparak pasif gelir elde etmek.

---

## Adım 1 — Domain satın al (1-2 saat)

AdSense, Vercel subdomainleri (`ba-toolbox.vercel.app`) ile de çalışabilir ama **özel domain şiddetle tavsiye edilir** çünkü:
- AdSense onay oranı yükselir
- Daha profesyonel görünür
- SEO açısından avantajlıdır

### Önerilen domain kayıt sitesi

- **Namecheap** (namecheap.com) — en ucuz, ~$10-12/yıl
- **Cloudflare Registrar** (cloudflare.com/registrar) — maliyet fiyatına, ~$9-10/yıl
- Google Domains kapalı, Porkbun da iyi alternatif

### Önerilen domain isimleri (ucuzdan pahalıya)

| Domain | Tahmini Fiyat |
|--------|---------------|
| batoolbox.com | ~$10/yıl |
| ba-toolbox.com | ~$10/yıl |
| batools.app | ~$15/yıl |
| bizanalyst.tools | ~$20/yıl |

### Yapılacaklar
- [ ] Domain satın al
- [ ] Vercel'de custom domain bağla (ücretsiz)
- [ ] HTTPS otomatik aktif olur (Vercel yapıyor)

---

## Adım 2 — Privacy Policy sayfası ekle (1 saat)

AdSense için **zorunlu** — olmadan başvuru reddedilir.

### İçermesi gerekenler
- Hangi verilerin toplandığı (AdSense cookie kullanır)
- Google Analytics/AdSense kullanımı
- İletişim bilgisi

### Yapılacaklar
- [ ] `index.html`'e Privacy Policy paneli ekle
- [ ] Footer'a link ekle
- [ ] Türkçe + İngilizce yaz (site zaten çift dil)

---

## Adım 3 — Google AdSense hesabı aç

1. **ads.google.com/adsense** adresine git
2. Google hesabınla giriş yap
3. Site URL'ini gir (özel domain olduktan sonra)
4. Ülke ve ödeme bilgilerini doldur (Türkiye, banka hesabı)
5. Doğrulama kodu al — bu kodu `index.html`'e ekle
6. **Onay bekleme süresi:** 1-14 gün arası

### Onay için dikkat edilmesi gerekenler
- Site içeriği orijinal ve faydalı olmalı ✅ (araçlar var)
- Yeterli içerik olmalı ✅ (15+ araç)
- Privacy Policy olmalı (Adım 2)
- Custom domain olmalı (Adım 1 - tavsiye)

---

## Adım 4 — Reklam yerleştirme (2-3 saat)

AdSense onayı geldikten sonra.

### Önerilen reklam konumları

Araç sitesi için en iyi strateji: kullanıcıyı rahatsız etmeden gelir sağlamak.

```
┌─────────────────────────────────────────┐
│  Topbar                    [Reklam 728x90] │  ← Leaderboard (üst)
├──────────┬──────────────────────────────┤
│          │  Araç İçeriği               │
│  Nav     │                             │
│          │  [Reklam 300x250]           │  ← Araç sonucu altında
│          │  (araç kullanıldıktan sonra) │
│          │                             │
└──────────┴──────────────────────────────┘
```

**Önerilen birimler:**
1. **Topbar altı** — Leaderboard 728x90 (masaüstü)
2. **Araç sonucu altı** — Medium Rectangle 300x250
3. **Mobil:** Responsive reklam birimler otomatik uyarlanır

### Auto Ads (En kolay yol)
AdSense'in Auto Ads özelliği en iyi yerleri otomatik seçer — tek bir kod satırı yeterli.

---

## Adım 5 — Ödeme ayarları

- AdSense Türkiye'de banka havalesi ile ödeme yapar
- Minimum ödeme eşiği: **$100**
- Ödeme aylık yapılır (eşiği geçince)
- Vergi bilgisi gerekebilir (şahıs/şirket)

---

## Tahmini Maliyet / Gelir

| Kalem | Maliyet |
|-------|---------|
| Domain (yıllık) | $10-15 |
| Vercel hosting | Ücretsiz |
| AdSense | Ücretsiz |

**Gelir tahmini** (aylık ziyaretçi sayısına bağlı):
- 1.000 ziyaretçi/ay → ~$1-3
- 10.000 ziyaretçi/ay → ~$10-30
- 100.000 ziyaretçi/ay → ~$100-300

> AdSense geliri düşük başlar, asıl gelir SEO + trafik büyüdükçe artar.

---

## Özet — Yapılacaklar Sırası

1. **[ ] Domain satın al** (Namecheap/Cloudflare, ~$10)
2. **[ ] Vercel'e domain bağla**
3. **[ ] Privacy Policy sayfası ekle** (commit + push)
4. **[ ] AdSense başvurusu yap**
5. **[ ] Doğrulama kodunu `index.html`'e ekle** (commit + push)
6. **[ ] Onay geldikten sonra reklam birimlerini yerleştir**
