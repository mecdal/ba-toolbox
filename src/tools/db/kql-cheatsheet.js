// KQL Cheatsheet — keyword reference + ready-to-edit query templates.
// Mirrors sql-cheatsheet structurally; both reuse buildKeywordCards.

import { t, getLang } from '../../i18n/index.js';
import { copyToClipboard } from '../../core/util.js';
import { navigate } from '../../core/nav.js';
import { buildKeywordCards } from './_keyword-cards.js';

const kqlKeywords = [
  { kw: 'where',       desc: 'Satırları filtreler. SQL WHERE gibi. Örn: | where Level == "Error"',                          descEn: 'Filters rows. Like SQL WHERE. e.g., | where Level == "Error"' },
  { kw: 'project',     desc: 'Sütun seçer. SQL SELECT gibi. Örn: | project TimeGenerated, Message',                         descEn: 'Selects columns. Like SQL SELECT. e.g., | project TimeGenerated, Message' },
  { kw: 'summarize',   desc: 'Gruplama ve agregasyon. SQL GROUP BY gibi. Örn: | summarize count() by Category',              descEn: 'Grouping and aggregation. Like SQL GROUP BY. e.g., | summarize count() by Category' },
  { kw: 'order by',    desc: 'Sonuçları sıralar. asc (artan) veya desc (azalan). Örn: | order by TimeGenerated desc',       descEn: 'Sorts results. asc (ascending) or desc (descending). e.g., | order by TimeGenerated desc' },
  { kw: 'take / limit',desc: 'İlk N kaydı döner. Keşif için kullanılır. Örn: | take 100',                                   descEn: 'Returns the first N records. Used for exploration. e.g., | take 100' },
  { kw: 'distinct',    desc: 'Tekil değerleri döner. SQL DISTINCT gibi. Örn: | distinct Category',                          descEn: 'Returns unique values. Like SQL DISTINCT. e.g., | distinct Category' },
  { kw: 'extend',      desc: 'Hesaplanmış yeni sütun ekler. Örn: | extend Toplam = Adet * Fiyat',                           descEn: 'Adds a new calculated column. e.g., | extend Total = Count * Price' },
  { kw: 'ago()',       desc: 'Belirli süre öncesi. Örn: ago(1h) = 1 saat önce, ago(7d) = 7 gün önce',                      descEn: 'Refers to a time period ago. e.g., ago(1h) = 1 hour ago, ago(7d) = 7 days ago' },
  { kw: 'contains',   desc: 'Metin içerme kontrolü (büyük/küçük harf duyarsız). Örn: | where Message contains "hata"',     descEn: 'Case-insensitive text search. e.g., | where Message contains "error"' },
  { kw: 'count()',     desc: 'Kayıt sayısını hesaplar. Örn: | summarize count() by Durum',                                  descEn: 'Counts records. e.g., | summarize count() by Status' },
];

const kqlTemplates = [
  {
    category: 'Temel Sorgular', categoryEn: 'Basic Queries',
    templates: [
      { name: 'Son 1 saatin kayıtları',    nameEn: 'Last 1 hour records',       sql: `TableName\n| where TimeGenerated > ago(1h)\n| order by TimeGenerated desc\n| take 100` },
      { name: 'Belirli değere göre filtre',nameEn: 'Filter by specific value',   sql: `TableName\n| where TimeGenerated > ago(24h)\n| where Durum == "Hata"\n| project TimeGenerated, Mesaj, Durum, Kaynak\n| order by TimeGenerated desc` },
      { name: 'Metin arama',               nameEn: 'Text search',                sql: `TableName\n| where TimeGenerated > ago(7d)\n| where Mesaj contains "anahtar_kelime"\n| order by TimeGenerated desc` },
    ],
  },
  {
    category: 'Sayma & Gruplama', categoryEn: 'Count & Group',
    templates: [
      { name: 'Alana göre kayıt sayısı', nameEn: 'Count records by field',    sql: `TableName\n| where TimeGenerated > ago(7d)\n| summarize Adet=count() by Kategori\n| order by Adet desc` },
      { name: 'Tekil değer sayısı',      nameEn: 'Unique value count',         sql: `TableName\n| where TimeGenerated > ago(30d)\n| summarize TekliKullanici=dcount(KullaniciId) by Departman\n| order by TekliKullanici desc` },
      { name: 'Top N',                   nameEn: 'Top N',                      sql: `TableName\n| where TimeGenerated > ago(7d)\n| summarize Adet=count() by Kategori\n| top 10 by Adet desc` },
    ],
  },
  {
    category: 'Zaman Bazlı Analiz', categoryEn: 'Time-Based Analysis',
    templates: [
      { name: 'Günlük kayıt özeti',  nameEn: 'Daily record summary',  sql: `TableName\n| where TimeGenerated > ago(30d)\n| summarize Adet=count() by bin(TimeGenerated, 1d)\n| order by TimeGenerated asc` },
      { name: 'Saatlik trend (grafik)', nameEn: 'Hourly trend (chart)',sql: `TableName\n| where TimeGenerated > ago(7d)\n| summarize Adet=count() by bin(TimeGenerated, 1h)\n| render timechart` },
      { name: 'Belirli tarih aralığı', nameEn: 'Specific date range', sql: `TableName\n| where TimeGenerated between (datetime(2024-01-01) .. datetime(2024-03-31))\n| summarize Adet=count() by Kategori\n| order by Adet desc` },
    ],
  },
  {
    category: 'Veri Keşfi', categoryEn: 'Data Exploration',
    templates: [
      { name: 'Tekil değerleri listele', nameEn: 'List unique values',   sql: `TableName\n| where TimeGenerated > ago(7d)\n| distinct Kategori, AltKategori\n| order by Kategori asc` },
      { name: 'Boş / NULL kayıtlar',    nameEn: 'Empty / NULL records',  sql: `TableName\n| where TimeGenerated > ago(30d)\n| where isempty(Deger) or isnull(Deger)\n| project TimeGenerated, Id, Deger` },
      { name: 'Örnek veri önizleme',    nameEn: 'Sample data preview',   sql: `TableName\n| take 20` },
    ],
  },
];

export function buildKqlCheatsheet() {
  const container = document.getElementById('kql-template-grid');
  if (!container) return;
  container.innerHTML = '';

  buildKeywordCards(kqlKeywords, container);

  kqlTemplates.forEach((cat) => {
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
      btnExport.textContent = t('kql.export');
      btnExport.addEventListener('click', () => {
        navigate('kql-formatter');
        document.getElementById('kql-input').value = tmpl.sql;
      });
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
