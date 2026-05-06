// SQL Cheatsheet — keyword reference + query templates.
//
// Templates are bilingual (Turkish + English names). Each card has Export
// (sends to SQL Formatter via openTab) and Copy buttons.

import { t, getLang } from '../../i18n/index.js';
import { copyToClipboard } from '../../core/util.js';
import { navigate } from '../../core/nav.js';
import { buildKeywordCards } from './_keyword-cards.js';

const sqlKeywords = [
  { kw: 'SELECT',    desc: 'Hangi sütunları getireceğini belirtir. SELECT * tüm sütunları, SELECT a,b sadece a ve b sütunlarını döner.',                                  descEn: 'Specifies which columns to retrieve. SELECT * returns all columns, SELECT a,b returns only a and b.' },
  { kw: 'FROM',      desc: 'Verinin hangi tablodan okunacağını belirtir. Birden fazla tablo için JOIN kullanılır.',                                                        descEn: 'Specifies which table to read from. Use JOIN for multiple tables.' },
  { kw: 'WHERE',     desc: 'Satırları filtreler. Koşul sağlamayan satırlar sonuca dahil edilmez. Agregasyon sonrası filtre için HAVING kullanılır.',                       descEn: 'Filters rows. Rows not matching the condition are excluded. Use HAVING for post-aggregation filtering.' },
  { kw: 'DISTINCT',  desc: 'Tekrar eden satırları kaldırır. SELECT DISTINCT şehir: her şehri yalnızca bir kez döner.',                                                    descEn: 'Removes duplicate rows. SELECT DISTINCT city returns each city only once.' },
  { kw: 'JOIN',      desc: 'İki tabloyu birleştirir. INNER: her iki tarafta eşleşen satırlar. LEFT: sol tablo tam + sağ taraf NULL olabilir. RIGHT: sağ tablo tam.',      descEn: 'Combines two tables. INNER: matching rows on both sides. LEFT: full left table + right side can be NULL. RIGHT: full right table.' },
  { kw: 'GROUP BY',  desc: 'Satırları belirtilen sütuna göre gruplar. COUNT/SUM/AVG gibi agregasyon fonksiyonlarıyla kullanılır.',                                        descEn: 'Groups rows by the specified column. Used with aggregation functions like COUNT/SUM/AVG.' },
  { kw: 'HAVING',    desc: 'GROUP BY sonrası gruplara filtre uygular. WHERE satırlara filtre uygularken HAVING gruplara uygular.',                                        descEn: 'Applies filter to groups after GROUP BY. WHERE filters rows, HAVING filters groups.' },
  { kw: 'ORDER BY',  desc: 'Sonuçları sıralar. ASC artan (varsayılan), DESC azalan. Birden fazla sütunla kullanılabilir.',                                               descEn: 'Sorts results. ASC ascending (default), DESC descending. Can use multiple columns.' },
  { kw: 'LIKE',      desc: 'Metin arama deseni. % sıfır veya daha fazla karakter, _ tam olarak bir karakter. Örn: LIKE \'%ahmet%\'',                                     descEn: 'Text search pattern. % matches zero or more characters, _ exactly one. e.g., LIKE \'%john%\'' },
  { kw: 'COALESCE',  desc: 'İlk NULL olmayan değeri döner. COALESCE(a, b, c): a NULL ise b\'ye, o da NULL ise c\'ye bakar. NULL alanları varsayılan değerle doldurmak için kullanılır.', descEn: 'Returns the first non-NULL value. COALESCE(a, b, c): if a is NULL tries b, then c. Used to fill NULL fields with defaults.' },
  { kw: 'IN',        desc: 'Değerin bir liste içinde olup olmadığını kontrol eder. WHERE şehir IN (\'İstanbul\', \'Ankara\') — OR zincirine alternatif.',                 descEn: 'Checks if a value is in a list. WHERE city IN (\'London\', \'Paris\') — alternative to OR chain.' },
  { kw: 'BETWEEN',   desc: 'Değerin bir aralıkta olup olmadığını kontrol eder (sınırlar dahil). Örn: WHERE fiyat BETWEEN 100 AND 500',                                    descEn: 'Checks if a value is within a range (inclusive). e.g., WHERE price BETWEEN 100 AND 500' },
  { kw: 'IS NULL',   desc: 'Değerin NULL (boş) olup olmadığını kontrol eder. = NULL kullanılmaz; IS NULL ya da IS NOT NULL kullanılır.',                                  descEn: 'Checks if a value is NULL (empty). Don\'t use = NULL; use IS NULL or IS NOT NULL.' },
  { kw: 'CASE WHEN', desc: 'Koşullu ifade (if-else). CASE WHEN koşul THEN değer ELSE varsayılan END. SELECT içinde hesaplanmış sütun yaratmak için kullanılır.',         descEn: 'Conditional expression (if-else). CASE WHEN condition THEN value ELSE default END. Creates calculated columns in SELECT.' },
  { kw: 'EXISTS',    desc: 'Alt sorgunun en az bir satır döndürüp döndürmediğini kontrol eder. IN\'e göre büyük veri setlerinde daha performanslı olabilir.',             descEn: 'Checks if a subquery returns at least one row. Can be more efficient than IN for large datasets.' },
];

const sqlTemplates = [
  {
    category: 'Temel Sorgular', categoryEn: 'Basic Queries',
    templates: [
      { name: 'SELECT *',                 nameEn: 'SELECT *',                  sql: `SELECT *\nFROM tablo_adi\nWHERE koşul = 'değer'\nORDER BY sütun ASC\nLIMIT 100;` },
      { name: 'SELECT belirli sütunlar',  nameEn: 'SELECT specific columns',   sql: `SELECT\n    id,\n    ad,\n    email,\n    olusturma_tarihi\nFROM kullanicilar\nWHERE aktif = 1\nORDER BY ad ASC;` },
      { name: 'INSERT INTO',              nameEn: 'INSERT INTO',               sql: `INSERT INTO tablo_adi (sütun1, sütun2, sütun3)\nVALUES ('değer1', 'değer2', 'değer3');` },
      { name: 'UPDATE',                   nameEn: 'UPDATE',                    sql: `UPDATE tablo_adi\nSET\n    sütun1 = 'yeni_değer1',\n    sütun2 = 'yeni_değer2'\nWHERE id = 1;` },
      { name: 'DELETE',                   nameEn: 'DELETE',                    sql: `DELETE FROM tablo_adi\nWHERE id = 1;` },
    ],
  },
  {
    category: 'JOIN Sorguları', categoryEn: 'JOIN Queries',
    templates: [
      { name: 'INNER JOIN',  nameEn: 'INNER JOIN',    sql: `SELECT\n    a.id,\n    a.ad,\n    b.sütun\nFROM tablo_a a\nINNER JOIN tablo_b b ON a.b_id = b.id\nWHERE a.aktif = 1;` },
      { name: 'LEFT JOIN',   nameEn: 'LEFT JOIN',     sql: `SELECT\n    a.id,\n    a.ad,\n    b.sütun\nFROM tablo_a a\nLEFT JOIN tablo_b b ON a.b_id = b.id;` },
      { name: 'Çoklu JOIN',  nameEn: 'Multiple JOINs',sql: `SELECT\n    s.id AS siparis_id,\n    k.ad AS musteri,\n    u.ad AS urun,\n    sd.adet,\n    sd.birim_fiyat\nFROM siparisler s\nINNER JOIN musteriler k ON s.musteri_id = k.id\nINNER JOIN siparis_detay sd ON s.id = sd.siparis_id\nINNER JOIN urunler u ON sd.urun_id = u.id\nWHERE s.tarih >= '2024-01-01'\nORDER BY s.tarih DESC;` },
    ],
  },
  {
    category: 'Agregasyon & Gruplama', categoryEn: 'Aggregation & Grouping',
    templates: [
      { name: 'GROUP BY + COUNT/SUM', nameEn: 'GROUP BY + COUNT/SUM', sql: `SELECT\n    kategori,\n    COUNT(*) AS adet,\n    SUM(tutar) AS toplam,\n    AVG(tutar) AS ortalama\nFROM siparisler\nWHERE tarih >= '2024-01-01'\nGROUP BY kategori\nHAVING COUNT(*) > 5\nORDER BY toplam DESC;` },
      { name: 'DISTINCT COUNT',       nameEn: 'DISTINCT COUNT',       sql: `SELECT\n    COUNT(*) AS toplam_siparis,\n    COUNT(DISTINCT musteri_id) AS tekil_musteri\nFROM siparisler\nWHERE YEAR(tarih) = 2024;` },
    ],
  },
  {
    category: 'Alt Sorgular & CTE', categoryEn: 'Subqueries & CTE',
    templates: [
      { name: 'WHERE IN (alt sorgu)', nameEn: 'WHERE IN (subquery)', sql: `SELECT *\nFROM urunler\nWHERE id IN (\n    SELECT urun_id\n    FROM siparis_detay\n    WHERE durum = 'tamamlandi'\n);` },
      { name: 'EXISTS',               nameEn: 'EXISTS',              sql: `SELECT *\nFROM musteriler k\nWHERE EXISTS (\n    SELECT 1\n    FROM siparisler s\n    WHERE s.musteri_id = k.id\n      AND s.tarih >= '2024-01-01'\n);` },
      { name: 'CTE (WITH)',           nameEn: 'CTE (WITH)',          sql: `WITH aylik_ozet AS (\n    SELECT\n        DATE_TRUNC('month', tarih) AS ay,\n        SUM(tutar) AS toplam\n    FROM siparisler\n    GROUP BY DATE_TRUNC('month', tarih)\n)\nSELECT ay, toplam,\n    LAG(toplam) OVER (ORDER BY ay) AS onceki_ay\nFROM aylik_ozet\nORDER BY ay;` },
    ],
  },
  {
    category: 'Analitik & Pencere Fonksiyonları', categoryEn: 'Analytics & Window Functions',
    templates: [
      { name: 'ROW_NUMBER / RANK', nameEn: 'ROW_NUMBER / RANK', sql: `SELECT\n    id, ad, satis, departman,\n    ROW_NUMBER() OVER (PARTITION BY departman ORDER BY satis DESC) AS sira,\n    RANK()       OVER (PARTITION BY departman ORDER BY satis DESC) AS rank\nFROM calisanlar;` },
      { name: 'LAG / LEAD',        nameEn: 'LAG / LEAD',        sql: `SELECT\n    tarih,\n    tutar,\n    LAG(tutar, 1)  OVER (ORDER BY tarih) AS onceki_gun,\n    LEAD(tutar, 1) OVER (ORDER BY tarih) AS sonraki_gun\nFROM gunluk_satis\nORDER BY tarih;` },
    ],
  },
];

function insertSqlTemplate(sql) {
  navigate('sql-formatter');
  document.getElementById('sql-input').value = sql;
}

export function buildSqlCheatsheet() {
  const container = document.getElementById('sql-template-grid');
  if (!container) return;
  container.innerHTML = '';

  buildKeywordCards(sqlKeywords, container);

  sqlTemplates.forEach((cat) => {
    const section = document.createElement('div');
    section.style.marginBottom = '28px';

    const h4 = document.createElement('h4');
    h4.textContent = (getLang() === 'en' && cat.categoryEn) ? cat.categoryEn : cat.category;
    h4.style.cssText = 'font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border);';
    section.appendChild(h4);

    const grid = document.createElement('div');
    grid.className = 'sql-template-grid';

    cat.templates.forEach((tmpl) => {
      const card = document.createElement('div');
      card.className = 'sql-template-card';

      const name = document.createElement('div');
      name.className = 'sql-template-name';
      name.textContent = (getLang() === 'en' && tmpl.nameEn) ? tmpl.nameEn : tmpl.name;

      const pre = document.createElement('pre');
      pre.className = 'sql-template-preview';
      pre.textContent = tmpl.sql;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group';
      btnGroup.style.marginBottom = '0';

      const btnExport = document.createElement('button');
      btnExport.className = 'btn btn-primary';
      btnExport.style.cssText = 'font-size:11px; padding:5px 10px;';
      btnExport.textContent = t('sql.export');
      btnExport.addEventListener('click', () => insertSqlTemplate(tmpl.sql));

      const btnCopy = document.createElement('button');
      btnCopy.className = 'btn btn-secondary';
      btnCopy.style.cssText = 'font-size:11px; padding:5px 10px;';
      btnCopy.textContent = t('copy');
      btnCopy.addEventListener('click', () => copyToClipboard(tmpl.sql, btnCopy));

      btnGroup.appendChild(btnExport);
      btnGroup.appendChild(btnCopy);
      card.appendChild(name);
      card.appendChild(pre);
      card.appendChild(btnGroup);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}
