# BA Toolbox

İş analistleri ve geliştiriciler için günlük kullanıma yönelik pratik web araçları koleksiyonu.

🔗 **Canlı Demo:** _(Vercel deploy sonrası eklenecek)_

---

## Araçlar

### Temel Araçlar
| Araç | Açıklama |
|------|----------|
| **JSON Formatlayıcı** | JSON güzelleştirme, küçültme ve doğrulama |
| **UUID Üretici** | Tek veya toplu UUID/GUID üretimi |
| **Faiz Hesaplama** | Basit faiz, bileşik faiz ve birikim hesabı |

### Veri Araçları
| Araç | Açıklama |
|------|----------|
| **Timestamp Dönüştürücü** | Unix timestamp ↔ tarih/saat dönüşümü |
| **Base64 Encode/Decode** | Metin ve veri encode/decode |
| **CSV → JSON** | CSV dosyalarını JSON'a dönüştürme |

### Metin Araçları
| Araç | Açıklama |
|------|----------|
| **Metin Karşılaştırma** | İki metin arasındaki farkları görselleştirme |
| **Regex Test** | Düzenli ifade testi ve vurgulama |
| **Kelime Sayacı** | Karakter, kelime, cümle ve okuma süresi |
| **SQL Formatlayıcı** | SQL sorgularını okunabilir formata getirme |

### Geliştirici
| Araç | Açıklama |
|------|----------|
| **JWT Decoder** | JWT token header ve payload çözümleme |
| **URL Encode/Decode** | URL encoding/decoding |
| **Hash Üretici** | SHA-1, SHA-256, SHA-512 hash üretimi |

### Ekstra
| Araç | Açıklama |
|------|----------|
| **Renk Dönüştürücü** | HEX, RGB, HSL renk dönüşümleri |
| **Lorem Ipsum** | Kelime, cümle veya paragraf olarak placeholder metin |

---

## Özellikler

- Karanlık / Açık tema
- URL hash ile direkt araç erişimi (`#json-formatter`)
- Son kullanılan araçlar hafızası
- Araç arama
- Tamamen tarayıcı tabanlı — sunucu yok, veri gönderimi yok

---

## Teknoloji

Saf HTML, CSS ve JavaScript. Bağımlılık yok, build adımı yok.

---

## Geliştirme

```bash
# Herhangi bir statik sunucu ile çalıştır
npx serve .
# veya direkt index.html'i tarayıcıda aç
```
