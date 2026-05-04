// Tool registry: the single source of truth for which tools exist, which group
// they belong to, and how they are labeled in TR / EN.
//
// Both nav.js (sidebar) and tabs.js (tab bar) read this list. Keeping it in its
// own module breaks what would otherwise be a circular import between nav and tabs.
// To add a tool: append an entry here, create a panel in index.html with id
// "panel-<id>", and wire its module + window-bridge entry in main.js / app.js.

export const tools = [
  // Veri & Format
  { id: 'json-formatter',    label: 'JSON Formatlayıcı',     labelEn: 'JSON Formatter',      icon: '{}',  group: 'Veri & Format' },
  { id: 'json-grid',         label: 'JSON Grid Görünüm',     labelEn: 'JSON Grid View',       icon: '⊞',   group: 'Veri & Format' },
  { id: 'json-diff',         label: 'JSON Karşılaştırma',    labelEn: 'JSON Diff',            icon: '⟺',   group: 'Veri & Format' },
  { id: 'json-escape',       label: 'JSON Escape/Unescape',  labelEn: 'JSON Escape/Unescape', icon: '\\{}', group: 'Veri & Format' },
  { id: 'csv-to-json',       label: 'CSV → JSON',            labelEn: 'CSV → JSON',           icon: '📊',  group: 'Veri & Format' },
  { id: 'yaml-json',         label: 'YAML ↔ JSON',           labelEn: 'YAML ↔ JSON',          icon: '🧾',  group: 'Veri & Format' },
  { id: 'base64',            label: 'Base64 / Dosya',        labelEn: 'Base64 / File',        icon: '🔐',  group: 'Veri & Format' },
  // Veritabanı
  { id: 'sql-formatter',     label: 'SQL Formatlayıcı',      labelEn: 'SQL Formatter',        icon: '🗄️',  group: 'Veritabanı' },
  { id: 'sql-cheatsheet',    label: 'SQL Şablonları',        labelEn: 'SQL Templates',        icon: '📋',  group: 'Veritabanı' },
  { id: 'kql-formatter',     label: 'KQL Formatlayıcı',      labelEn: 'KQL Formatter',        icon: '☁️',  group: 'Veritabanı' },
  { id: 'kql-cheatsheet',    label: 'KQL Şablonları',        labelEn: 'KQL Templates',        icon: '📋',  group: 'Veritabanı' },
  // Geliştirici
  { id: 'uuid-generator',    label: 'UUID Üretici',          labelEn: 'UUID Generator',       icon: '🔑',  group: 'Geliştirici' },
  { id: 'url-encoder',       label: 'URL Encode/Decode',     labelEn: 'URL Encode/Decode',    icon: '🔗',  group: 'Geliştirici' },
  { id: 'timestamp',         label: 'Timestamp Dönüştürücü', labelEn: 'Timestamp Converter',  icon: '🕐',  group: 'Geliştirici' },
  { id: 'url-shortener',     label: 'URL Kısaltıcı',         labelEn: 'URL Shortener',        icon: '✂️',  group: 'Geliştirici' },
  { id: 'jwt-decoder',       label: 'JWT Decoder',           labelEn: 'JWT Decoder',          icon: '🎟️',  group: 'Geliştirici' },
  { id: 'regex-builder',     label: 'Regex Builder',         labelEn: 'Regex Builder',        icon: '*️⃣',  group: 'Geliştirici' },
  { id: 'cron-decoder',      label: 'Cron Expression',       labelEn: 'Cron Expression',      icon: '⏱️',  group: 'Geliştirici' },
  { id: 'http-status',       label: 'HTTP Status Kodları',   labelEn: 'HTTP Status Codes',    icon: '🌐',  group: 'Geliştirici' },
  { id: 'curl-parser',       label: 'cURL Parser',           labelEn: 'cURL Parser',          icon: '↩️',  group: 'Geliştirici' },
  // Hesaplama
  { id: 'interest-calc',     label: 'Faiz Hesaplama',        labelEn: 'Interest Calculator',  icon: '💰',  group: 'Hesaplama' },
  { id: 'loan-calc',         label: 'Kredi Hesaplama',       labelEn: 'Loan Calculator',      icon: '🏦',  group: 'Hesaplama' },
  // Metin
  { id: 'diff-checker',      label: 'Metin Karşılaştırma',   labelEn: 'Text Diff',            icon: '🔍',  group: 'Metin' },
  { id: 'word-counter',      label: 'Kelime Sayacı',         labelEn: 'Word Counter',         icon: '📝',  group: 'Metin' },
  { id: 'text-editor',       label: 'Metin Editörü',         labelEn: 'Text Editor',          icon: '✏️',  group: 'Metin' },
  { id: 'markdown-preview',  label: 'Markdown Önizleme',     labelEn: 'Markdown Preview',     icon: 'M↓',  group: 'Metin' },
  // Analiz & Gereksinim
  { id: 'user-story',        label: 'User Story Yazıcı',     labelEn: 'User Story Writer',    icon: '📖',  group: 'Analiz & Gereksinim', groupEn: 'Analysis & Requirements' },
  { id: 'use-case',          label: 'Use Case Yazıcı',       labelEn: 'Use Case Writer',      icon: '🧷',  group: 'Analiz & Gereksinim', groupEn: 'Analysis & Requirements' },
  { id: 'ac-generator',      label: 'AC Üretici (Gherkin)',  labelEn: 'AC Generator (Gherkin)', icon: '✅', group: 'Analiz & Gereksinim', groupEn: 'Analysis & Requirements' },
  { id: 'raci-matrix',       label: 'RACI Matrisi',          labelEn: 'RACI Matrix',          icon: '🎯',  group: 'Analiz & Gereksinim', groupEn: 'Analysis & Requirements' },
  { id: 'bpmn-modeler',      label: 'BPMN Modeler',          labelEn: 'BPMN Modeler',         icon: '⬡',   group: 'Analiz & Gereksinim', groupEn: 'Analysis & Requirements' },
];

export function findTool(id) {
  return tools.find((t) => t.id === id);
}
