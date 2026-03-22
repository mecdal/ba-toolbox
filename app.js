// ===== Utility Functions =====

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = t('copied');
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('btn-success');
    }, 2000);
  } catch {
    alert(t('copy.failed'));
  }
}

function showError(boxId, msg) {
  const el = document.getElementById(boxId);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError(boxId) {
  const el = document.getElementById(boxId);
  if (el) el.style.display = 'none';
}

// ===== Theme =====

function initTheme() {
  const saved = localStorage.getItem('ba-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ba-theme', next);
  updateThemeBtn(next);
}

function updateThemeBtn(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? t('theme.light') : t('theme.dark');
}

// ===== Language / i18n =====

let currentLang = localStorage.getItem('ba-lang') || 'tr';

const translations = {
  tr: {
    // Nav / global
    'welcome.title': 'BA Toolbox\'a Hoş Geldiniz',
    'welcome.subtitle': 'Sol menüden bir araç seçerek başlayın. Tüm araçlar tarayıcınızda çalışır, internet bağlantısı gerekmez.',
    'search.placeholder': 'Araç ara...',
    'theme.dark': '🌙 Karanlık Mod',
    'theme.light': '☀️ Açık Mod',
    'group.veri': 'Veri & Format',
    'group.veritabani': 'Veritabanı',
    'group.gelistirici': 'Geliştirici',
    'group.hesaplama': 'Hesaplama',
    'group.metin': 'Metin',
    // Shared actions
    'copy': 'Kopyala',
    'copied': 'Kopyalandı!',
    'copy.failed': 'Kopyalama başarısız. Manuel olarak seçip kopyalayın.',
    'clear': 'Temizle',
    'calculate': 'Hesapla',
    'format': 'Formatla',
    'convert': 'Dönüştür',
    'compare': 'Karşılaştır',
    'download': '↓ İndir',
    'generate': 'Üret',
    'shorten': 'Kısalt',
    'output': 'Çıktı',
    'keyword.guide': 'Anahtar Kelime Rehberi',
    'error.fill-fields': 'Lütfen tüm alanları doğru doldurun.',
    // JSON status / errors
    'json.valid': '✓ Geçerli JSON',
    'json.invalid': '✗ Geçersiz JSON',
    'json.error': 'JSON Hatası: ',
    'csv.error': 'CSV Hatası: ',
    // JSON Formatter
    'json-fmt.title': 'JSON Formatlayıcı',
    'json-fmt.input': 'JSON Giriş',
    'json-fmt.beautify': 'Güzelleştir',
    'json-fmt.minify': 'Sıkıştır',
    'json-fmt.validate': 'Doğrula',
    // UUID
    'uuid.title': 'UUID Üretici (v4)',
    'uuid.count': 'Adet (1-100)',
    'uuid.placeholder': 'Üretilen UUID\'ler burada görünecek...',
    // Interest
    'interest.title': 'Basit Faiz Hesaplama',
    'interest.principal': 'Ana Para (₺)',
    'interest.rate': 'Yıllık Faiz (%)',
    'interest.term': 'Vade',
    'interest.day': 'Gün',
    'interest.month': 'Ay',
    'interest.year': 'Yıl',
    'interest.tax': 'Vergi',
    'interest.tax.none': 'Vergisiz',
    'interest.tax.tr': '🇹🇷 Türkiye — Stopaj',
    'interest.tax.de': '🇩🇪 Almanya — Abgeltungssteuer (KPMG)',
    'interest.stopaj': 'Stopaj Oranı (%)',
    'interest.result.title': 'FAİZ HESAPLAMA SONUCU',
    'interest.gross': 'Brüt Faiz Geliri',
    'interest.net': 'Net Faiz Geliri',
    'interest.total': 'VADE SONU TOPLAM',
    'interest.principal.label': 'Ana Para',
    // Loan
    'loan.title': 'Kredi Hesaplama',
    'loan.subtitle': '— Aylık taksit ve amortisman tablosu',
    'loan.amount': 'Kredi Tutarı (₺)',
    'loan.rate': 'Yıllık Faiz (%)',
    'loan.months': 'Vade (Ay)',
    'loan.result.title': 'KREDİ HESAPLAMA SONUCU',
    'loan.amount.label': 'Kredi Tutarı',
    'loan.monthly': 'Aylık Taksit',
    'loan.total.payment': 'Toplam Geri Ödeme',
    'loan.total.interest': 'Toplam Faiz Maliyeti',
    'loan.interest.ratio': 'FAİZ YÜK ORANI',
    'loan.th.month': 'Ay',
    'loan.th.installment': 'Taksit',
    'loan.th.principal': 'Anapara Payı',
    'loan.th.interest': 'Faiz Payı',
    'loan.th.remaining': 'Kalan Borç',
    // Timestamp
    'ts.title': 'Unix Timestamp ↔ Tarih',
    'ts.to-date': 'Timestamp → Tarih',
    'ts.now': 'Şimdi',
    'ts.to-ts': 'Tarih → Timestamp',
    'ts.invalid': 'Geçersiz timestamp',
    // Base64
    'b64.title': 'Base64 / Dosya',
    'b64.tab.text': 'Metin',
    'b64.tab.file-to': 'Dosya → Base64',
    'b64.tab.to-file': 'Base64 → Dosya',
    'b64.raw': 'Ham Metin',
    'b64.raw.placeholder': 'Metni buraya yazın...',
    'b64.output.placeholder': 'Base64 çıktısı...',
    'b64.file-select': 'Dosya Seç',
    'b64.convert': 'Base64\'e Çevir',
    'b64.file-output.label': 'Base64 Çıktı',
    'b64.file-output.placeholder': 'Base64 çıktısı burada görünecek...',
    'b64.filename': 'Kaydedilecek Dosya Adı',
    'b64.data': 'Base64 Veri',
    'b64.paste.placeholder': 'Base64 kodunu buraya yapıştırın...',
    'b64.download': '↓ Dosyayı İndir',
    'b64.error.encode': 'Encode hatası: ',
    'b64.error.decode': 'Geçersiz Base64 verisi.',
    // CSV
    'csv.title': 'CSV → JSON Dönüştürücü',
    'csv.delimiter': 'Ayraç',
    'csv.comma': 'Virgül (,)',
    'csv.semicolon': 'Noktalı Virgül (;)',
    'csv.header': 'İlk satır başlık',
    'csv.input': 'CSV Giriş',
    'csv.output': 'JSON Çıktı',
    // Diff Checker
    'diff.title': 'Metin Karşılaştırma',
    'diff.original': 'Orijinal',
    'diff.original.placeholder': 'Orijinal metin...',
    'diff.new': 'Yeni',
    'diff.new.placeholder': 'Yeni metin...',
    'diff.added': 'eklendi',
    'diff.removed': 'silindi',
    // Word Counter
    'wc.title': 'Kelime Sayacı',
    'wc.placeholder': 'Metni buraya yazın...',
    'wc.chars': 'KARAKTER',
    'wc.no-space': 'BOŞLUKSUZ',
    'wc.words': 'KELİME',
    'wc.sentences': 'CÜMLE',
    'wc.paragraphs': 'PARAGRAF',
    'wc.readtime': 'OKUMA SÜRESİ',
    'wc.readtime.unit': 'dk',
    'wc.stats': '{chars} karakter · {words} kelime · {lines} satır',
    // SQL Formatter
    'sql-fmt.title': 'SQL Formatlayıcı',
    'sql-fmt.input': 'SQL Giriş',
    // JWT
    'jwt.subtitle': '(Sadece okuma — imza doğrulaması yapılmaz)',
    'jwt.decode': 'Decode Et',
    // URL Encoder
    'url-enc.raw': 'Ham URL / Metin',
    'url-enc.encoded': 'Encoded',
    'url-enc.copy': 'Encoded\'ı Kopyala',
    // KQL Formatter
    'kql-fmt.title': 'KQL Formatlayıcı',
    'kql-fmt.input': 'KQL Giriş',
    // KQL Cheatsheet
    'kql-cs.subtitle': '— Hazır sorgular, tek tıkla KQL Formatlayıcı\'ya aktar',
    'kql.export': 'KQL\'e Aktar',
    // Text Editor
    'editor.title': 'Metin Editörü',
    'editor.filename': 'Dosya Adı',
    'editor.format': 'Format',
    'editor.placeholder': 'Metni buraya yazın...',
    // URL Shortener
    'url-short.title': 'URL Kısaltıcı',
    'url-short.label': 'Uzun URL',
    'url-short.result.label': 'Kısaltılmış URL',
    'url-short.footer': 'İnternet bağlantısı gerektirir · Powered by TinyURL',
    // JSON Grid
    'json-grid.title': 'JSON Grid Görünümü',
    'json-grid.subtitle': '— Altova XMLSpy tarzı tablo görünümü',
    'json-grid.input': 'JSON Giriş',
    'json-grid.show': 'Grid Göster',
    // JSON Escape
    'json-esc.raw': 'Ham Metin',
    'json-esc.escaped.label': 'Escape Edilmiş (JSON String)',
    // JWT
    'jwt.error.format': 'Geçersiz JWT formatı. 3 parça (header.payload.signature) olmalı.',
    'jwt.error.decode': 'Decode hatası: ',
    // JSON Escape
    'json-esc.error': 'Parse hatası: ',
    // URL Shortener
    'url-short.error.invalid': 'Geçerli bir URL girin (https:// ile başlamalı).',
    'url-short.error.failed': 'Kısaltılamadı: ',
    // JSON Diff
    'json-diff.title': 'JSON Karşılaştırma',
    'json-diff.subtitle': '— Yapısal JSON diff (path bazlı)',
    'json-diff.left': 'Sol JSON (Eski / A)',
    'json-diff.right': 'Sağ JSON (Yeni / B)',
    'json-diff.identical': '✓ İki JSON aynı — fark yok.',
    'json-diff.found': '{n} fark bulundu',
    'json-diff.error.empty': 'Her iki alana da JSON girin.',
    'json-diff.error.left': 'Sol JSON hatalı: ',
    'json-diff.error.right': 'Sağ JSON hatalı: ',
    // SQL Cheatsheet
    'sql-cs.subtitle': '— Hazır sorgular, tek tıkla SQL Formatlayıcı\'ya aktar',
    'sql.export': 'SQL\'e Aktar',
  },
  en: {
    // Nav / global
    'welcome.title': 'Welcome to BA Toolbox',
    'welcome.subtitle': 'Select a tool from the left menu to get started. All tools run in your browser — no internet required.',
    'search.placeholder': 'Search tools...',
    'theme.dark': '🌙 Dark Mode',
    'theme.light': '☀️ Light Mode',
    'group.veri': 'Data & Format',
    'group.veritabani': 'Database',
    'group.gelistirici': 'Developer',
    'group.hesaplama': 'Calculation',
    'group.metin': 'Text',
    // Shared actions
    'copy': 'Copy',
    'copied': 'Copied!',
    'copy.failed': 'Copy failed. Please select and copy manually.',
    'clear': 'Clear',
    'calculate': 'Calculate',
    'format': 'Format',
    'convert': 'Convert',
    'compare': 'Compare',
    'download': '↓ Download',
    'generate': 'Generate',
    'shorten': 'Shorten',
    'output': 'Output',
    'keyword.guide': 'Keyword Reference',
    'error.fill-fields': 'Please fill in all fields correctly.',
    // JSON status / errors
    'json.valid': '✓ Valid JSON',
    'json.invalid': '✗ Invalid JSON',
    'json.error': 'JSON Error: ',
    'csv.error': 'CSV Error: ',
    // JSON Formatter
    'json-fmt.title': 'JSON Formatter',
    'json-fmt.input': 'JSON Input',
    'json-fmt.beautify': 'Beautify',
    'json-fmt.minify': 'Minify',
    'json-fmt.validate': 'Validate',
    // UUID
    'uuid.title': 'UUID Generator (v4)',
    'uuid.count': 'Count (1-100)',
    'uuid.placeholder': 'Generated UUIDs will appear here...',
    // Interest
    'interest.title': 'Simple Interest Calculator',
    'interest.principal': 'Principal (₺)',
    'interest.rate': 'Annual Rate (%)',
    'interest.term': 'Term',
    'interest.day': 'Day',
    'interest.month': 'Month',
    'interest.year': 'Year',
    'interest.tax': 'Tax',
    'interest.tax.none': 'No Tax',
    'interest.tax.tr': '🇹🇷 Turkey — Withholding Tax',
    'interest.tax.de': '🇩🇪 Germany — Abgeltungssteuer (KPMG)',
    'interest.stopaj': 'Withholding Rate (%)',
    'interest.result.title': 'INTEREST CALCULATION RESULT',
    'interest.gross': 'Gross Interest Income',
    'interest.net': 'Net Interest Income',
    'interest.total': 'MATURITY TOTAL',
    'interest.principal.label': 'Principal',
    // Loan
    'loan.title': 'Loan Calculator',
    'loan.subtitle': '— Monthly installment & amortization table',
    'loan.amount': 'Loan Amount (₺)',
    'loan.rate': 'Annual Rate (%)',
    'loan.months': 'Term (Months)',
    'loan.result.title': 'LOAN CALCULATION RESULT',
    'loan.amount.label': 'Loan Amount',
    'loan.monthly': 'Monthly Installment',
    'loan.total.payment': 'Total Payment',
    'loan.total.interest': 'Total Interest Cost',
    'loan.interest.ratio': 'INTEREST BURDEN RATIO',
    'loan.th.month': 'Month',
    'loan.th.installment': 'Installment',
    'loan.th.principal': 'Principal',
    'loan.th.interest': 'Interest',
    'loan.th.remaining': 'Remaining',
    // Timestamp
    'ts.title': 'Unix Timestamp ↔ Date',
    'ts.to-date': 'Timestamp → Date',
    'ts.now': 'Now',
    'ts.to-ts': 'Date → Timestamp',
    'ts.invalid': 'Invalid timestamp',
    // Base64
    'b64.title': 'Base64 / File',
    'b64.tab.text': 'Text',
    'b64.tab.file-to': 'File → Base64',
    'b64.tab.to-file': 'Base64 → File',
    'b64.raw': 'Raw Text',
    'b64.raw.placeholder': 'Type text here...',
    'b64.output.placeholder': 'Base64 output...',
    'b64.file-select': 'Select File',
    'b64.convert': 'Convert to Base64',
    'b64.file-output.label': 'Base64 Output',
    'b64.file-output.placeholder': 'Base64 output will appear here...',
    'b64.filename': 'File Name to Save',
    'b64.data': 'Base64 Data',
    'b64.paste.placeholder': 'Paste Base64 code here...',
    'b64.download': '↓ Download File',
    'b64.error.encode': 'Encode error: ',
    'b64.error.decode': 'Invalid Base64 data.',
    // CSV
    'csv.title': 'CSV → JSON Converter',
    'csv.delimiter': 'Delimiter',
    'csv.comma': 'Comma (,)',
    'csv.semicolon': 'Semicolon (;)',
    'csv.header': 'First row is header',
    'csv.input': 'CSV Input',
    'csv.output': 'JSON Output',
    // Diff Checker
    'diff.title': 'Text Comparison',
    'diff.original': 'Original',
    'diff.original.placeholder': 'Original text...',
    'diff.new': 'New',
    'diff.new.placeholder': 'New text...',
    'diff.added': 'added',
    'diff.removed': 'removed',
    // Word Counter
    'wc.title': 'Word Counter',
    'wc.placeholder': 'Type text here...',
    'wc.chars': 'CHARACTERS',
    'wc.no-space': 'NO SPACES',
    'wc.words': 'WORDS',
    'wc.sentences': 'SENTENCES',
    'wc.paragraphs': 'PARAGRAPHS',
    'wc.readtime': 'READ TIME',
    'wc.readtime.unit': 'min',
    'wc.stats': '{chars} chars · {words} words · {lines} lines',
    // SQL Formatter
    'sql-fmt.title': 'SQL Formatter',
    'sql-fmt.input': 'SQL Input',
    // JWT
    'jwt.error.format': 'Invalid JWT format. Must have 3 parts (header.payload.signature).',
    'jwt.error.decode': 'Decode error: ',
    // JSON Escape
    'json-esc.error': 'Parse error: ',
    // URL Shortener
    'url-short.error.invalid': 'Enter a valid URL (must start with https://).',
    'url-short.error.failed': 'Shortening failed: ',
    // JWT
    'jwt.subtitle': '(Read-only — signature not verified)',
    'jwt.decode': 'Decode',
    // URL Encoder
    'url-enc.raw': 'Raw URL / Text',
    'url-enc.encoded': 'Encoded',
    'url-enc.copy': 'Copy Encoded',
    // KQL Formatter
    'kql-fmt.title': 'KQL Formatter',
    'kql-fmt.input': 'KQL Input',
    // KQL Cheatsheet
    'kql-cs.subtitle': '— Ready queries, export to KQL Formatter in one click',
    'kql.export': 'Export to KQL',
    // Text Editor
    'editor.title': 'Text Editor',
    'editor.filename': 'File Name',
    'editor.format': 'Format',
    'editor.placeholder': 'Type text here...',
    // URL Shortener
    'url-short.title': 'URL Shortener',
    'url-short.label': 'Long URL',
    'url-short.result.label': 'Shortened URL',
    'url-short.footer': 'Requires internet connection · Powered by TinyURL',
    // JSON Grid
    'json-grid.title': 'JSON Grid View',
    'json-grid.subtitle': '— Altova XMLSpy-style table view',
    'json-grid.input': 'JSON Input',
    'json-grid.show': 'Show Grid',
    // JSON Escape
    'json-esc.raw': 'Raw Text',
    'json-esc.escaped.label': 'Escaped (JSON String)',
    // JSON Diff
    'json-diff.title': 'JSON Diff',
    'json-diff.subtitle': '— Structural JSON diff (path-based)',
    'json-diff.left': 'Left JSON (Old / A)',
    'json-diff.right': 'Right JSON (New / B)',
    'json-diff.identical': '✓ Both JSONs are identical — no differences.',
    'json-diff.found': '{n} difference(s) found',
    'json-diff.error.empty': 'Enter JSON in both fields.',
    'json-diff.error.left': 'Left JSON error: ',
    'json-diff.error.right': 'Right JSON error: ',
    // SQL Cheatsheet
    'sql-cs.subtitle': '— Ready queries, export to SQL Formatter in one click',
    'sql.export': 'Export to SQL',
  },
};

const groupKeyMap = {
  'Veri & Format': 'group.veri',
  'Veritabanı': 'group.veritabani',
  'Geliştirici': 'group.gelistirici',
  'Hesaplama': 'group.hesaplama',
  'Metin': 'group.metin',
};

function t(key) {
  return (translations[currentLang] || translations.tr)[key] || key;
}

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = currentLang === 'tr' ? '🌐 EN' : '🌐 TR';

  // Refresh nav group labels
  document.querySelectorAll('.tool-group-label').forEach(el => {
    const key = el.dataset.groupKey;
    if (key) el.textContent = t(key);
  });

  // Refresh nav item labels
  document.querySelectorAll('.tool-nav-item').forEach(el => {
    const toolId = el.dataset.tool;
    const tool = tools.find(t2 => t2.id === toolId);
    if (!tool) return;
    const label = (currentLang === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
    el.querySelector('span:last-child').textContent = label;
  });

  // Update topbar title if currently showing a tool
  const activeItem = document.querySelector('.tool-nav-item.active');
  if (activeItem) {
    const toolId = activeItem.dataset.tool;
    const tool = tools.find(t2 => t2.id === toolId);
    if (tool) {
      const label = (currentLang === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
      document.getElementById('topbar-title').textContent = label;
    }
  }

  // Update theme button text
  updateThemeBtn(document.documentElement.getAttribute('data-theme'));

  // Rebuild dynamic content with new language
  buildSqlCheatsheet();
  buildKqlCheatsheet();

  // Refresh word counter stats if there is text
  if (document.getElementById('wc-input') && document.getElementById('wc-input').value) {
    countWords();
  }

  // Update loan table headers if visible
  const loanTh = document.querySelectorAll('#panel-loan-calc thead th');
  const loanHeaders = ['loan.th.month', 'loan.th.installment', 'loan.th.principal', 'loan.th.interest', 'loan.th.remaining'];
  loanTh.forEach((th, i) => { if (loanHeaders[i]) th.textContent = t(loanHeaders[i]); });
}

function toggleLang() {
  currentLang = currentLang === 'tr' ? 'en' : 'tr';
  localStorage.setItem('ba-lang', currentLang);
  applyLang();
}

// ===== Navigation =====

const tools = [
  // Veri & Format
  { id: 'json-formatter',    label: 'JSON Formatlayıcı',     labelEn: 'JSON Formatter',      icon: '{}',  group: 'Veri & Format' },
  { id: 'json-grid',         label: 'JSON Grid Görünüm',     labelEn: 'JSON Grid View',       icon: '⊞',   group: 'Veri & Format' },
  { id: 'json-diff',         label: 'JSON Karşılaştırma',    labelEn: 'JSON Diff',            icon: '⟺',   group: 'Veri & Format' },
  { id: 'json-escape',       label: 'JSON Escape/Unescape',  labelEn: 'JSON Escape/Unescape', icon: '\\{}', group: 'Veri & Format' },
  { id: 'csv-to-json',       label: 'CSV → JSON',            labelEn: 'CSV → JSON',           icon: '📊',  group: 'Veri & Format' },
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
  // Hesaplama
  { id: 'interest-calc',     label: 'Faiz Hesaplama',        labelEn: 'Interest Calculator',  icon: '💰',  group: 'Hesaplama' },
  { id: 'loan-calc',         label: 'Kredi Hesaplama',       labelEn: 'Loan Calculator',      icon: '🏦',  group: 'Hesaplama' },
  // Metin
  { id: 'diff-checker',      label: 'Metin Karşılaştırma',   labelEn: 'Text Diff',            icon: '🔍',  group: 'Metin' },
  { id: 'word-counter',      label: 'Kelime Sayacı',         icon: '📝',  group: 'Metin' },
  { id: 'text-editor',       label: 'Metin Editörü',         labelEn: 'Text Editor',          icon: '✏️',  group: 'Metin' },
];

function buildNav() {
  const list = document.getElementById('tool-list');
  const groups = {};
  tools.forEach(t => {
    if (!groups[t.group]) groups[t.group] = [];
    groups[t.group].push(t);
  });

  Object.entries(groups).forEach(([group, items]) => {
    const label = document.createElement('div');
    const groupKey = groupKeyMap[group] || group;
    label.className = 'tool-group-label';
    label.dataset.groupKey = groupKey;
    label.textContent = t(groupKey);
    list.appendChild(label);

    items.forEach(tool => {
      const item = document.createElement('div');
      item.className = 'tool-nav-item';
      item.dataset.tool = tool.id;
      const displayLabel = (currentLang === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
      item.innerHTML = `<span class="icon">${tool.icon}</span><span>${displayLabel}</span>`;
      item.addEventListener('click', () => navigate(tool.id));
      list.appendChild(item);
    });
  });
}

function navigate(toolId) {
  // Update nav active state
  document.querySelectorAll('.tool-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tool === toolId);
  });

  // Update panels
  document.querySelectorAll('.tool-panel').forEach(el => el.classList.remove('active'));
  const panel = document.getElementById('panel-' + toolId);
  if (panel) panel.classList.add('active');

  // Update topbar title
  const tool = tools.find(t2 => t2.id === toolId);
  if (tool) {
    const label = (currentLang === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
    document.getElementById('topbar-title').textContent = label;
  }

  // Hide welcome
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.style.display = 'none';

  // Update URL hash
  window.location.hash = toolId;

  // Save last used
  saveRecent(toolId);
}

function saveRecent(toolId) {
  let recents = JSON.parse(localStorage.getItem('ba-recents') || '[]');
  recents = [toolId, ...recents.filter(r => r !== toolId)].slice(0, 5);
  localStorage.setItem('ba-recents', JSON.stringify(recents));
}

// ===== Search =====

function initSearch() {
  const input = document.getElementById('search-box');
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    document.querySelectorAll('.tool-nav-item').forEach(el => {
      const match = el.textContent.toLowerCase().includes(q);
      el.style.display = match ? '' : 'none';
    });
    document.querySelectorAll('.tool-group-label').forEach(label => {
      label.style.display = '';
    });
  });
}

// ===== Tab helper =====

function initTabs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const scope = container.parentElement;
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      scope.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// ===== Tool: JSON Formatter =====

function jsonBeautify() {
  hideError('json-error');
  try {
    const input = document.getElementById('json-input').value.trim();
    if (!input) return;
    const parsed = JSON.parse(input);
    document.getElementById('json-output').value = JSON.stringify(parsed, null, 2);
    document.getElementById('json-status').textContent = t('json.valid');
    document.getElementById('json-status').style.color = 'var(--success)';
  } catch (e) {
    showError('json-error', t('json.error') + e.message);
    document.getElementById('json-status').textContent = t('json.invalid');
    document.getElementById('json-status').style.color = 'var(--error)';
  }
}

function jsonMinify() {
  hideError('json-error');
  try {
    const input = document.getElementById('json-input').value.trim();
    if (!input) return;
    const parsed = JSON.parse(input);
    document.getElementById('json-output').value = JSON.stringify(parsed);
  } catch (e) {
    showError('json-error', t('json.error') + e.message);
  }
}

function jsonValidate() {
  hideError('json-error');
  const input = document.getElementById('json-input').value.trim();
  try {
    JSON.parse(input);
    document.getElementById('json-status').textContent = t('json.valid');
    document.getElementById('json-status').style.color = 'var(--success)';
    hideError('json-error');
  } catch (e) {
    showError('json-error', t('json.error') + e.message);
    document.getElementById('json-status').textContent = t('json.invalid');
    document.getElementById('json-status').style.color = 'var(--error)';
  }
}

// ===== Tool: UUID Generator =====

function generateUUIDs() {
  const count = parseInt(document.getElementById('uuid-count').value) || 1;
  const clamped = Math.max(1, Math.min(100, count));
  const uuids = Array.from({ length: clamped }, () => crypto.randomUUID());
  document.getElementById('uuid-output').value = uuids.join('\n');
}

// ===== Tool: Interest Calculator — Tax Helpers =====

function onTaxChange(prefix) {
  const val = document.getElementById(prefix + '-tax').value;
  document.getElementById(prefix + '-tax-tr').style.display = val === 'tr' ? 'block' : 'none';
  document.getElementById(prefix + '-tax-de').style.display = val === 'de' ? 'block' : 'none';
}

function onKistChange(prefix) {
  document.getElementById(prefix + '-kist-rate').disabled = !document.getElementById(prefix + '-kist').checked;
}

function getTaxSettings(prefix) {
  const country = document.getElementById(prefix + '-tax').value;
  if (country === 'tr') {
    const rate = parseFloat(document.getElementById(prefix + '-stopaj').value) / 100 || 0.15;
    return { country: 'tr', stopajRate: rate };
  }
  if (country === 'de') {
    const hasSoli = document.getElementById(prefix + '-soli').checked;
    const hasKiSt = document.getElementById(prefix + '-kist').checked;
    const kiStRate = hasKiSt ? (parseFloat(document.getElementById(prefix + '-kist-rate').value) / 100 || 0.09) : 0;
    return { country: 'de', hasSoli, hasKiSt, kiStRate };
  }
  return { country: 'none' };
}

// KPMG Abgeltungssteuer calculation for Germany
function calcTaxAmount(grossInterest, ts) {
  if (ts.country === 'none' || grossInterest <= 0) return { totalTax: 0, netInterest: grossInterest, breakdown: [] };

  if (ts.country === 'tr') {
    const tax = grossInterest * ts.stopajRate;
    return {
      totalTax: tax, netInterest: grossInterest - tax,
      breakdown: [{ label: `🇹🇷 Stopaj Vergisi (%${(ts.stopajRate * 100).toFixed(1)})`, amount: tax }]
    };
  }

  if (ts.country === 'de') {
    // KPMG method: when KiSt applies, Abgelt rate is reduced because KiSt is deductible
    // Adjusted rate = 25% / (1 + KiSt_rate × 25%)
    let abgeltRate = 0.25;
    if (ts.hasKiSt && ts.kiStRate > 0) {
      abgeltRate = 0.25 / (1 + ts.kiStRate * 0.25);
    }
    const abgelt = grossInterest * abgeltRate;
    const soli = ts.hasSoli ? abgelt * 0.055 : 0;
    const kist = (ts.hasKiSt && ts.kiStRate > 0) ? abgelt * ts.kiStRate : 0;
    const totalTax = abgelt + soli + kist;
    const breakdown = [{ label: `🇩🇪 Abgeltungssteuer (%${(abgeltRate * 100).toFixed(3)})`, amount: abgelt }];
    if (soli > 0) breakdown.push({ label: 'Solidaritätszuschlag (5,5%)', amount: soli });
    if (kist > 0) breakdown.push({ label: `Kirchensteuer (%${(ts.kiStRate * 100).toFixed(1)})`, amount: kist });
    return { totalTax, netInterest: grossInterest - totalTax, breakdown };
  }

  return { totalTax: 0, netInterest: grossInterest, breakdown: [] };
}

function renderInterestResult(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const fmt = n => Math.abs(n).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
  let html = `<div class="irc-row irc-header"><span>${t('interest.result.title')}</span></div>`;
  html += `<div class="irc-row"><span>${data.principalLabel || t('interest.principal.label')}</span><span class="irc-val">₺ ${fmt(data.principal)}</span></div>`;
  html += `<div class="irc-row"><span>${t('interest.gross')}</span><span class="irc-val positive">+ ₺ ${fmt(data.grossInterest)}</span></div>`;
  if (data.breakdown && data.breakdown.length > 0) {
    data.breakdown.forEach(b => {
      html += `<div class="irc-row irc-tax"><span>${b.label}</span><span class="irc-val negative">− ₺ ${fmt(b.amount)}</span></div>`;
    });
    html += `<div class="irc-row"><span>${t('interest.net')}</span><span class="irc-val positive">+ ₺ ${fmt(data.netInterest)}</span></div>`;
  }
  html += `<div class="irc-row irc-total"><span>${t('interest.total')}</span><span class="irc-val total">₺ ${fmt(data.total)}</span></div>`;
  el.innerHTML = html;
  el.style.display = 'block';
}

function calcSimpleInterest() {
  hideError('interest-error');
  const P = parseFloat(document.getElementById('si-principal').value);
  const R = parseFloat(document.getElementById('si-rate').value);
  const T = parseFloat(document.getElementById('si-time').value);
  const unit = document.getElementById('si-unit').value;

  if (isNaN(P) || isNaN(R) || isNaN(T) || P <= 0 || T <= 0) {
    showError('interest-error', t('error.fill-fields'));
    return;
  }

  const tYears = unit === 'day' ? T / 365 : unit === 'month' ? T / 12 : T;
  const grossInterest = P * (R / 100) * tYears;
  const ts = getTaxSettings('si');
  const tax = calcTaxAmount(grossInterest, ts);

  renderInterestResult('si-result-card', { principal: P, grossInterest, breakdown: tax.breakdown, netInterest: tax.netInterest, total: P + tax.netInterest });
}

// ===== Tool: Timestamp =====

function tsToDate() {
  const val = document.getElementById('ts-input').value.trim();
  const num = parseInt(val);
  if (isNaN(num)) { document.getElementById('ts-result').textContent = t('ts.invalid'); return; }
  const ms = val.length >= 13 ? num : num * 1000;
  const d = new Date(ms);
  document.getElementById('ts-result').textContent =
    `Yerel: ${d.toLocaleString('tr-TR')}\nUTC: ${d.toUTCString()}\nISO: ${d.toISOString()}`;
}

function dateToTs() {
  const val = document.getElementById('date-input').value;
  if (!val) return;
  const d = new Date(val);
  document.getElementById('date-ts-result').textContent =
    `Unix (saniye): ${Math.floor(d.getTime() / 1000)}\nUnix (ms): ${d.getTime()}`;
}

function setNow() {
  document.getElementById('ts-input').value = Math.floor(Date.now() / 1000);
  tsToDate();
}

// ===== Tool: Base64 =====

function base64Encode() {
  hideError('base64-error');
  try {
    const input = document.getElementById('b64-raw').value;
    document.getElementById('b64-encoded').value = btoa(unescape(encodeURIComponent(input)));
  } catch (e) {
    showError('base64-error', t('b64.error.encode') + e.message);
  }
}

function base64Decode() {
  hideError('base64-error');
  try {
    const input = document.getElementById('b64-encoded').value.trim();
    document.getElementById('b64-raw').value = decodeURIComponent(escape(atob(input)));
  } catch (e) {
    showError('base64-error', t('b64.error.decode'));
  }
}

// ===== Tool: CSV to JSON =====

function csvToJson() {
  hideError('csv-error');
  try {
    const input = document.getElementById('csv-input').value.trim();
    if (!input) return;
    const hasHeaders = document.getElementById('csv-headers').checked;
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
    const delimiter = document.getElementById('csv-delimiter').value || ',';

    const parse = line => line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));

    let result;
    if (hasHeaders) {
      const headers = parse(lines[0]);
      result = lines.slice(1).map(line => {
        const vals = parse(line);
        const obj = {};
        headers.forEach((h, i) => obj[h] = vals[i] ?? '');
        return obj;
      });
    } else {
      result = lines.map(line => parse(line));
    }

    document.getElementById('csv-output').value = JSON.stringify(result, null, 2);
  } catch (e) {
    showError('csv-error', t('csv.error') + e.message);
  }
}

// ===== Tool: Diff Checker =====

function runDiff() {
  const a = document.getElementById('diff-original').value.split('\n');
  const b = document.getElementById('diff-new').value.split('\n');
  const out = document.getElementById('diff-output');
  out.innerHTML = '';

  const maxLen = Math.max(a.length, b.length);
  let added = 0, removed = 0;

  for (let i = 0; i < maxLen; i++) {
    const lineA = a[i];
    const lineB = b[i];
    if (lineA === lineB) {
      out.innerHTML += `<div class="diff-line diff-unchanged">${escapeHtml(lineB ?? '')}</div>`;
    } else {
      if (lineA !== undefined) {
        out.innerHTML += `<div class="diff-line diff-removed">- ${escapeHtml(lineA)}</div>`;
        removed++;
      }
      if (lineB !== undefined) {
        out.innerHTML += `<div class="diff-line diff-added">+ ${escapeHtml(lineB)}</div>`;
        added++;
      }
    }
  }

  document.getElementById('diff-stats').textContent = `+${added} ${t('diff.added')}, -${removed} ${t('diff.removed')}`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== Tool: Word Counter =====

function countWords() {
  const text = document.getElementById('wc-input').value;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
  const readTime = Math.ceil(words / 200);

  document.getElementById('wc-chars').textContent = chars;
  document.getElementById('wc-chars-no-space').textContent = charsNoSpace;
  document.getElementById('wc-words').textContent = words;
  document.getElementById('wc-sentences').textContent = sentences;
  document.getElementById('wc-paragraphs').textContent = paragraphs;
  document.getElementById('wc-readtime').textContent = readTime + ' ' + t('wc.readtime.unit');
}

// ===== Tool: SQL Formatter =====

function formatSQL() {
  const input = document.getElementById('sql-input').value;
  const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
    'OUTER JOIN', 'ON', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE',
    'DROP TABLE', 'ALTER TABLE', 'UNION', 'UNION ALL', 'AS', 'DISTINCT', 'NOT', 'IN',
    'IS NULL', 'IS NOT NULL', 'BETWEEN', 'LIKE', 'EXISTS'];

  let sql = input.replace(/\s+/g, ' ').trim();
  sql = sql.toUpperCase();

  const newlineKeywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
    'INNER JOIN', 'ON', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'UNION', 'UNION ALL'];

  newlineKeywords.forEach(kw => {
    sql = sql.replace(new RegExp(`\\b${kw}\\b`, 'g'), '\n' + kw);
  });

  sql = sql.replace(/,\s*/g, ',\n    ');
  document.getElementById('sql-output').value = sql.trim();
}

// ===== Tool: JWT Decoder =====

function decodeJWT() {
  hideError('jwt-error');
  const token = document.getElementById('jwt-input').value.trim();
  const parts = token.split('.');
  if (parts.length !== 3) {
    showError('jwt-error', t('jwt.error.format'));
    return;
  }

  try {
    const decode = str => JSON.parse(decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/')))));
    const header = decode(parts[0]);
    const payload = decode(parts[1]);

    document.getElementById('jwt-header').value = JSON.stringify(header, null, 2);
    document.getElementById('jwt-payload').value = JSON.stringify(payload, null, 2);

    if (payload.exp) {
      const exp = new Date(payload.exp * 1000);
      const expired = exp < new Date();
      document.getElementById('jwt-exp').textContent =
        `Son kullanma: ${exp.toLocaleString('tr-TR')} — ${expired ? '❌ Süresi dolmuş' : '✅ Geçerli'}`;
    } else {
      document.getElementById('jwt-exp').textContent = 'Son kullanma tarihi yok';
    }
  } catch (e) {
    showError('jwt-error', t('jwt.error.decode') + e.message);
  }
}

// ===== Tool: URL Encoder =====
// (listeners initialized in DOMContentLoaded below)

// ===== Tool: JSON Grid =====

function renderJsonGrid() {
  hideError('json-grid-error');
  const input = document.getElementById('json-grid-input').value.trim();
  const container = document.getElementById('json-grid-output');
  container.innerHTML = '';
  if (!input) return;
  try {
    const data = JSON.parse(input);
    const toolbar = document.createElement('div');
    toolbar.className = 'json-grid-toolbar';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-secondary';
    copyBtn.style.cssText = 'font-size:11px; padding:4px 10px;';
    copyBtn.textContent = 'Tablo Kopyala (TSV)';
    copyBtn.addEventListener('click', () => copyJsonGridAsTable(copyBtn));
    toolbar.appendChild(copyBtn);
    container.appendChild(toolbar);
    container.appendChild(buildGridNode(data, 0));
  } catch (e) {
    showError('json-grid-error', t('json.error') + e.message);
  }
}

function copyJsonGridAsTable(btn) {
  const table = document.querySelector('#json-grid-output table');
  if (!table) { alert('Kopyalanacak tablo bulunamadı.'); return; }
  const rows = [...table.querySelectorAll('tr')];
  const tsv = rows.map(row =>
    [...row.querySelectorAll('th, td')]
      .map(cell => cell.textContent.trim().replace(/[\t\n]/g, ' '))
      .join('\t')
  ).join('\n');
  copyToClipboard(tsv, btn);
}

function buildGridNode(data, depth) {
  if (Array.isArray(data)) {
    if (data.length === 0) return createGridSpan('[]', 'json-grid-null');

    if (typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
      const keys = [...new Set(data.flatMap(obj => Object.keys(obj)))];
      const table = document.createElement('table');
      table.className = 'json-grid-table';
      const thead = table.createTHead();
      const headerRow = thead.insertRow();
      const thIdx = document.createElement('th');
      thIdx.textContent = '#';
      thIdx.className = 'json-grid-idx';
      headerRow.appendChild(thIdx);
      keys.forEach(k => {
        const th = document.createElement('th');
        th.textContent = k;
        headerRow.appendChild(th);
      });
      const tbody = table.createTBody();
      data.forEach((row, i) => {
        const tr = tbody.insertRow();
        const tdIdx = tr.insertCell();
        tdIdx.className = 'json-grid-idx';
        tdIdx.textContent = i;
        keys.forEach(k => {
          const td = tr.insertCell();
          setGridCell(td, row[k], depth);
        });
      });
      return table;
    }

    // Array of primitives / mixed
    const table = document.createElement('table');
    table.className = 'json-grid-table';
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const thIdx = document.createElement('th');
    thIdx.textContent = '#';
    thIdx.className = 'json-grid-idx';
    headerRow.appendChild(thIdx);
    const thVal = document.createElement('th');
    thVal.textContent = 'Değer';
    headerRow.appendChild(thVal);
    const tbody = table.createTBody();
    data.forEach((item, i) => {
      const tr = tbody.insertRow();
      const tdIdx = tr.insertCell();
      tdIdx.className = 'json-grid-idx';
      tdIdx.textContent = i;
      setGridCell(tr.insertCell(), item, depth);
    });
    return table;
  }

  if (typeof data === 'object' && data !== null) {
    const table = document.createElement('table');
    table.className = 'json-grid-table';
    const tbody = table.createTBody();
    Object.entries(data).forEach(([k, v]) => {
      const tr = tbody.insertRow();
      const tdKey = tr.insertCell();
      tdKey.className = 'json-grid-key';
      tdKey.textContent = k;
      setGridCell(tr.insertCell(), v, depth);
    });
    return table;
  }

  return createGridSpan(String(data), typeof data === 'number' ? 'json-grid-number' : typeof data === 'boolean' ? 'json-grid-bool' : '');
}

function setGridCell(td, val, depth) {
  if (val === undefined || val === null) {
    td.appendChild(createGridSpan('null', 'json-grid-null'));
  } else if (typeof val === 'object') {
    if (depth >= 2) {
      const isArr = Array.isArray(val);
      const count = isArr ? val.length : Object.keys(val).length;
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.className = 'json-grid-nested';
      summary.style.cursor = 'pointer';
      summary.textContent = isArr
        ? `[${count} ${currentLang === 'en' ? 'item' : 'öğe'}]`
        : `{${count} ${currentLang === 'en' ? 'field' : 'alan'}}`;
      details.appendChild(summary);
      details.appendChild(buildGridNode(val, depth + 1));
      td.appendChild(details);
    } else {
      td.appendChild(buildGridNode(val, depth + 1));
    }
  } else if (typeof val === 'boolean') {
    td.appendChild(createGridSpan(String(val), 'json-grid-bool'));
  } else if (typeof val === 'number') {
    td.appendChild(createGridSpan(String(val), 'json-grid-number'));
  } else {
    td.textContent = val;
  }
}

function createGridSpan(text, className) {
  const span = document.createElement('span');
  if (className) span.className = className;
  span.textContent = text;
  return span;
}

// ===== Tool: JSON Escape =====

function jsonEscapeStr() {
  hideError('json-escape-error');
  const input = document.getElementById('json-escape-input').value;
  document.getElementById('json-escape-output').value = JSON.stringify(input);
}

function jsonUnescapeStr() {
  hideError('json-escape-error');
  const input = document.getElementById('json-escape-output').value.trim();
  try {
    const parsed = JSON.parse(input);
    document.getElementById('json-escape-input').value =
      typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
  } catch (e) {
    showError('json-escape-error', t('json-esc.error') + e.message);
  }
}

// ===== Tool: JSON Diff =====

function diffJson() {
  hideError('json-diff-error');
  const leftText = document.getElementById('json-diff-left').value.trim();
  const rightText = document.getElementById('json-diff-right').value.trim();
  const output = document.getElementById('json-diff-output');

  if (!leftText || !rightText) {
    showError('json-diff-error', t('json-diff.error.empty'));
    return;
  }

  let leftObj, rightObj;
  try { leftObj = JSON.parse(leftText); } catch (e) {
    showError('json-diff-error', t('json-diff.error.left') + e.message); return;
  }
  try { rightObj = JSON.parse(rightText); } catch (e) {
    showError('json-diff-error', t('json-diff.error.right') + e.message); return;
  }

  const diffs = [];
  jsonDiffRecurse(leftObj, rightObj, '', diffs);

  if (diffs.length === 0) {
    output.innerHTML = `<div style="color:var(--success); padding:12px; font-weight:600;">${t('json-diff.identical')}</div>`;
    return;
  }

  const html = diffs.map(d => {
    const icons = { added: '＋', removed: '－', changed: '≠', type: '⚑' };
    const colors = { added: 'var(--success)', removed: 'var(--error)', changed: 'var(--accent)', type: '#e67e22' };
    const icon = icons[d.type] || '?';
    const color = colors[d.type] || 'var(--text)';
    let detail = '';
    if (d.type === 'changed') detail = `<span style="color:var(--error);">${escapeHtml(JSON.stringify(d.left))}</span> → <span style="color:var(--success);">${escapeHtml(JSON.stringify(d.right))}</span>`;
    else if (d.type === 'added') detail = `<span style="color:var(--success);">${escapeHtml(JSON.stringify(d.right))}</span>`;
    else if (d.type === 'removed') detail = `<span style="color:var(--error);">${escapeHtml(JSON.stringify(d.left))}</span>`;
    else if (d.type === 'type') detail = `<span style="color:var(--error);">${typeof d.left}</span> → <span style="color:var(--success);">${typeof d.right}</span>`;
    return `<div class="diff-row" style="border-left:3px solid ${color}; padding:6px 10px; margin-bottom:4px; background:var(--input-bg); border-radius:0 4px 4px 0;">
      <span style="color:${color}; font-weight:700; margin-right:8px;">${icon}</span>
      <code style="color:var(--accent); margin-right:8px;">${escapeHtml(d.path || '(root)')}</code>
      ${detail}
    </div>`;
  }).join('');

  output.innerHTML = `<div style="margin-bottom:8px; font-size:12px; color:var(--text-muted);">${t('json-diff.found').replace('{n}', diffs.length)}</div>` + html;
}

function jsonDiffRecurse(left, right, path, diffs) {
  if (typeof left !== typeof right || (Array.isArray(left) !== Array.isArray(right))) {
    diffs.push({ type: 'type', path, left, right });
    return;
  }
  if (left === null || right === null || typeof left !== 'object') {
    if (left !== right) diffs.push({ type: 'changed', path, left, right });
    return;
  }
  if (Array.isArray(left)) {
    const maxLen = Math.max(left.length, right.length);
    for (let i = 0; i < maxLen; i++) {
      const p = `${path}[${i}]`;
      if (i >= left.length) diffs.push({ type: 'added', path: p, right: right[i] });
      else if (i >= right.length) diffs.push({ type: 'removed', path: p, left: left[i] });
      else jsonDiffRecurse(left[i], right[i], p, diffs);
    }
    return;
  }
  const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of allKeys) {
    const p = path ? `${path}.${key}` : key;
    if (!(key in left)) diffs.push({ type: 'added', path: p, right: right[key] });
    else if (!(key in right)) diffs.push({ type: 'removed', path: p, left: left[key] });
    else jsonDiffRecurse(left[key], right[key], p, diffs);
  }
}

// ===== Tool: File to Base64 =====

function fileToBase64() {
  const fileInput = document.getElementById('file-to-b64-input');
  const file = fileInput.files[0];
  if (!file) { alert('Lütfen bir dosya seçin.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const b64 = reader.result.split(',')[1];
    document.getElementById('file-b64-output').value = b64;
    document.getElementById('file-b64-info').textContent =
      `${file.name} · ${formatBytes(file.size)} → ${b64.length} karakter`;
  };
  reader.readAsDataURL(file);
}

function base64ToFile() {
  const b64 = document.getElementById('b64-to-file-input').value.trim();
  const filename = document.getElementById('b64-target-filename').value.trim() || 'dosya';
  if (!b64) return;
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes]));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    showError('base64-error', t('b64.error.decode'));
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// ===== Tool: KQL Formatter =====

function formatKQL() {
  const input = document.getElementById('kql-input').value.trim();
  if (!input) return;

  // Handle multi-statement (semicolons between let statements)
  const statements = input.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
  const formatted = statements.map(stmt => {
    // Split on pipe, keeping let blocks together
    const parts = stmt.split(/\s*\|\s*/);
    return parts.map((part, i) => {
      part = part.trim();
      if (!part) return null;
      // Indent sub-clauses within each pipe: and/or on new lines
      part = part.replace(/\band\b/gi, '\n    and').replace(/\bor\b(?!\s*\()/gi, '\n    or');
      return i === 0 ? part : '| ' + part;
    }).filter(Boolean).join('\n');
  }).join('\n\n');

  document.getElementById('kql-output').value = formatted;
}

// ===== Tool: KQL Cheatsheet =====

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
    ]
  },
  {
    category: 'Sayma & Gruplama', categoryEn: 'Count & Group',
    templates: [
      { name: 'Alana göre kayıt sayısı', nameEn: 'Count records by field',    sql: `TableName\n| where TimeGenerated > ago(7d)\n| summarize Adet=count() by Kategori\n| order by Adet desc` },
      { name: 'Tekil değer sayısı',      nameEn: 'Unique value count',         sql: `TableName\n| where TimeGenerated > ago(30d)\n| summarize TekliKullanici=dcount(KullaniciId) by Departman\n| order by TekliKullanici desc` },
      { name: 'Top N',                   nameEn: 'Top N',                      sql: `TableName\n| where TimeGenerated > ago(7d)\n| summarize Adet=count() by Kategori\n| top 10 by Adet desc` },
    ]
  },
  {
    category: 'Zaman Bazlı Analiz', categoryEn: 'Time-Based Analysis',
    templates: [
      { name: 'Günlük kayıt özeti',  nameEn: 'Daily record summary',  sql: `TableName\n| where TimeGenerated > ago(30d)\n| summarize Adet=count() by bin(TimeGenerated, 1d)\n| order by TimeGenerated asc` },
      { name: 'Saatlik trend (grafik)', nameEn: 'Hourly trend (chart)',sql: `TableName\n| where TimeGenerated > ago(7d)\n| summarize Adet=count() by bin(TimeGenerated, 1h)\n| render timechart` },
      { name: 'Belirli tarih aralığı', nameEn: 'Specific date range', sql: `TableName\n| where TimeGenerated between (datetime(2024-01-01) .. datetime(2024-03-31))\n| summarize Adet=count() by Kategori\n| order by Adet desc` },
    ]
  },
  {
    category: 'Veri Keşfi', categoryEn: 'Data Exploration',
    templates: [
      { name: 'Tekil değerleri listele', nameEn: 'List unique values',   sql: `TableName\n| where TimeGenerated > ago(7d)\n| distinct Kategori, AltKategori\n| order by Kategori asc` },
      { name: 'Boş / NULL kayıtlar',    nameEn: 'Empty / NULL records',  sql: `TableName\n| where TimeGenerated > ago(30d)\n| where isempty(Deger) or isnull(Deger)\n| project TimeGenerated, Id, Deger` },
      { name: 'Örnek veri önizleme',    nameEn: 'Sample data preview',   sql: `TableName\n| take 20` },
    ]
  },
];

function buildKqlCheatsheet() {
  const container = document.getElementById('kql-template-grid');
  if (!container) return;
  container.innerHTML = '';

  buildKeywordCards(kqlKeywords, container);

  kqlTemplates.forEach(cat => {
    const section = document.createElement('div');
    section.style.marginBottom = '28px';
    const h4 = document.createElement('h4');
    h4.textContent = (currentLang === 'en' && cat.categoryEn) ? cat.categoryEn : cat.category;
    h4.style.cssText = 'font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border);';
    section.appendChild(h4);
    const grid = document.createElement('div');
    grid.className = 'sql-template-grid';

    cat.templates.forEach(tmpl => {
      const card = document.createElement('div');
      card.className = 'sql-template-card';
      const name = document.createElement('div');
      name.className = 'sql-template-name';
      name.textContent = (currentLang === 'en' && tmpl.nameEn) ? tmpl.nameEn : tmpl.name;
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

// ===== Tool: Text Editor =====

function downloadTextFile() {
  const content = document.getElementById('editor-content').value;
  const filename = document.getElementById('editor-filename').value.trim() || 'belge';
  const format = document.getElementById('editor-format').value;
  const mimeMap = { txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', json: 'application/json', html: 'text/html', sql: 'text/plain', kql: 'text/plain', xml: 'application/xml' };
  const blob = new Blob([content], { type: (mimeMap[format] || 'text/plain') + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename + '.' + format;
  a.click();
  URL.revokeObjectURL(url);
}

function updateEditorStats() {
  const content = document.getElementById('editor-content').value;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lines = content.split('\n').length;
  document.getElementById('editor-stats').textContent = t('wc.stats')
    .replace('{chars}', content.length)
    .replace('{words}', words)
    .replace('{lines}', lines);
}

// ===== Tool: URL Shortener =====

async function shortenUrl() {
  hideError('url-short-error');
  const url = document.getElementById('url-short-input').value.trim();
  if (!url) return;
  try { new URL(url); } catch {
    showError('url-short-error', t('url-short.error.invalid'));
    return;
  }
  const resultEl = document.getElementById('url-short-result');
  const outputEl = document.getElementById('url-short-output');
  resultEl.style.display = 'none';
  try {
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error('API hatası: ' + res.status);
    const shortUrl = (await res.text()).trim();
    if (!shortUrl.startsWith('http')) throw new Error('Beklenmedik yanıt');
    outputEl.textContent = shortUrl;
    outputEl.href = shortUrl;
    resultEl.style.display = 'block';
  } catch (e) {
    showError('url-short-error', t('url-short.error.failed') + e.message);
  }
}

function copyShortUrl() {
  copyToClipboard(document.getElementById('url-short-output').textContent, document.getElementById('url-short-copy-btn'));
}

// ===== Tool: Loan Calculator =====

function calcLoanPayment() {
  hideError('loan-error');
  const P = parseFloat(document.getElementById('loan-principal').value);
  const annualRate = parseFloat(document.getElementById('loan-rate').value);
  const months = parseInt(document.getElementById('loan-months').value);

  if (isNaN(P) || isNaN(annualRate) || isNaN(months) || P <= 0 || months <= 0) {
    showError('loan-error', t('error.fill-fields'));
    return;
  }

  const r = annualRate / 100 / 12;
  const monthlyPayment = r === 0 ? P / months
    : P * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  const totalPayment = monthlyPayment * months;
  const totalInterest = totalPayment - P;
  const fmt = n => n.toLocaleString('tr-TR', { minimumFractionDigits: 2 });

  const cardEl = document.getElementById('loan-result-card');
  let html = `<div class="irc-row irc-header"><span>${t('loan.result.title')}</span></div>`;
  html += `<div class="irc-row"><span>${t('loan.amount.label')}</span><span class="irc-val">₺ ${fmt(P)}</span></div>`;
  html += `<div class="irc-row"><span>${t('loan.monthly')}</span><span class="irc-val total">₺ ${fmt(monthlyPayment)}</span></div>`;
  html += `<div class="irc-row"><span>${t('loan.total.payment')}</span><span class="irc-val">₺ ${fmt(totalPayment)}</span></div>`;
  html += `<div class="irc-row irc-tax"><span>${t('loan.total.interest')}</span><span class="irc-val negative">− ₺ ${fmt(totalInterest)}</span></div>`;
  html += `<div class="irc-row irc-total"><span>${t('loan.interest.ratio')}</span><span class="irc-val total">${((totalInterest / P) * 100).toFixed(1)}%</span></div>`;
  cardEl.innerHTML = html;
  cardEl.style.display = 'block';

  let remaining = P;
  let rows = '';
  for (let i = 1; i <= months; i++) {
    const interestPayment = remaining * r;
    const principalPayment = monthlyPayment - interestPayment;
    remaining = Math.max(0, remaining - principalPayment);
    rows += `<tr><td>${i}</td><td>${fmt(monthlyPayment)}</td><td>${fmt(principalPayment)}</td><td style="color:var(--error);">${fmt(interestPayment)}</td><td><strong>${fmt(remaining)}</strong></td></tr>`;
  }
  document.getElementById('loan-table').innerHTML = rows;
  document.getElementById('loan-table-wrap').style.display = '';
}

// ===== Clear Panel =====

const noClearPanels = new Set(['panel-sql-cheatsheet', 'panel-kql-cheatsheet']);

function addClearButtons() {
  document.querySelectorAll('.tool-panel').forEach(panel => {
    if (noClearPanels.has(panel.id)) return;
    const card = panel.querySelector('.tool-card');
    if (!card) return;
    const footer = document.createElement('div');
    footer.className = 'panel-clear-footer';
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.style.cssText = 'font-size:11px; opacity:0.65;';
    btn.dataset.i18n = 'clear';
    btn.textContent = t('clear');
    btn.addEventListener('click', () => clearPanel(panel.id));
    footer.appendChild(btn);
    card.appendChild(footer);
  });
}

function clearPanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => { el.value = ''; });
  panel.querySelectorAll('textarea').forEach(el => { el.value = ''; });
  panel.querySelectorAll('.error-box').forEach(el => { el.textContent = ''; el.style.display = 'none'; });
  panel.querySelectorAll('.result-box').forEach(el => { el.innerHTML = ''; });
  panel.querySelectorAll('tbody').forEach(el => { el.innerHTML = ''; });
  ['json-grid-output', 'json-diff-output', 'diff-output', 'si-result-card', 'loan-result-card', 'editor-stats', 'diff-stats', 'file-b64-info', 'json-status', 'url-short-result'].forEach(id => {
    const el = panel.querySelector('#' + id);
    if (!el) return;
    if (id === 'url-short-result') { el.style.display = 'none'; }
    else if (id.endsWith('-card')) { el.innerHTML = ''; el.style.display = 'none'; }
    else { el.innerHTML = ''; el.textContent = ''; }
  });
  ['loan-table-wrap'].forEach(id => {
    const el = panel.querySelector('#' + id);
    if (el) el.style.display = 'none';
  });
}

// ===== Tool: SQL Cheatsheet =====

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
    ]
  },
  {
    category: 'JOIN Sorguları', categoryEn: 'JOIN Queries',
    templates: [
      { name: 'INNER JOIN',  nameEn: 'INNER JOIN',    sql: `SELECT\n    a.id,\n    a.ad,\n    b.sütun\nFROM tablo_a a\nINNER JOIN tablo_b b ON a.b_id = b.id\nWHERE a.aktif = 1;` },
      { name: 'LEFT JOIN',   nameEn: 'LEFT JOIN',     sql: `SELECT\n    a.id,\n    a.ad,\n    b.sütun\nFROM tablo_a a\nLEFT JOIN tablo_b b ON a.b_id = b.id;` },
      { name: 'Çoklu JOIN',  nameEn: 'Multiple JOINs',sql: `SELECT\n    s.id AS siparis_id,\n    k.ad AS musteri,\n    u.ad AS urun,\n    sd.adet,\n    sd.birim_fiyat\nFROM siparisler s\nINNER JOIN musteriler k ON s.musteri_id = k.id\nINNER JOIN siparis_detay sd ON s.id = sd.siparis_id\nINNER JOIN urunler u ON sd.urun_id = u.id\nWHERE s.tarih >= '2024-01-01'\nORDER BY s.tarih DESC;` },
    ]
  },
  {
    category: 'Agregasyon & Gruplama', categoryEn: 'Aggregation & Grouping',
    templates: [
      { name: 'GROUP BY + COUNT/SUM', nameEn: 'GROUP BY + COUNT/SUM', sql: `SELECT\n    kategori,\n    COUNT(*) AS adet,\n    SUM(tutar) AS toplam,\n    AVG(tutar) AS ortalama\nFROM siparisler\nWHERE tarih >= '2024-01-01'\nGROUP BY kategori\nHAVING COUNT(*) > 5\nORDER BY toplam DESC;` },
      { name: 'DISTINCT COUNT',       nameEn: 'DISTINCT COUNT',       sql: `SELECT\n    COUNT(*) AS toplam_siparis,\n    COUNT(DISTINCT musteri_id) AS tekil_musteri\nFROM siparisler\nWHERE YEAR(tarih) = 2024;` },
    ]
  },
  {
    category: 'Alt Sorgular & CTE', categoryEn: 'Subqueries & CTE',
    templates: [
      { name: 'WHERE IN (alt sorgu)', nameEn: 'WHERE IN (subquery)', sql: `SELECT *\nFROM urunler\nWHERE id IN (\n    SELECT urun_id\n    FROM siparis_detay\n    WHERE durum = 'tamamlandi'\n);` },
      { name: 'EXISTS',               nameEn: 'EXISTS',              sql: `SELECT *\nFROM musteriler k\nWHERE EXISTS (\n    SELECT 1\n    FROM siparisler s\n    WHERE s.musteri_id = k.id\n      AND s.tarih >= '2024-01-01'\n);` },
      { name: 'CTE (WITH)',           nameEn: 'CTE (WITH)',          sql: `WITH aylik_ozet AS (\n    SELECT\n        DATE_TRUNC('month', tarih) AS ay,\n        SUM(tutar) AS toplam\n    FROM siparisler\n    GROUP BY DATE_TRUNC('month', tarih)\n)\nSELECT ay, toplam,\n    LAG(toplam) OVER (ORDER BY ay) AS onceki_ay\nFROM aylik_ozet\nORDER BY ay;` },
    ]
  },
  {
    category: 'Analitik & Pencere Fonksiyonları', categoryEn: 'Analytics & Window Functions',
    templates: [
      { name: 'ROW_NUMBER / RANK', nameEn: 'ROW_NUMBER / RANK', sql: `SELECT\n    id, ad, satis, departman,\n    ROW_NUMBER() OVER (PARTITION BY departman ORDER BY satis DESC) AS sira,\n    RANK()       OVER (PARTITION BY departman ORDER BY satis DESC) AS rank\nFROM calisanlar;` },
      { name: 'LAG / LEAD',        nameEn: 'LAG / LEAD',        sql: `SELECT\n    tarih,\n    tutar,\n    LAG(tutar, 1)  OVER (ORDER BY tarih) AS onceki_gun,\n    LEAD(tutar, 1) OVER (ORDER BY tarih) AS sonraki_gun\nFROM gunluk_satis\nORDER BY tarih;` },
    ]
  },
];

function buildKeywordCards(keywords, container) {
  const section = document.createElement('div');
  section.style.marginBottom = '28px';
  const h4 = document.createElement('h4');
  h4.textContent = t('keyword.guide');
  h4.style.cssText = 'font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border);';
  section.appendChild(h4);
  const grid = document.createElement('div');
  grid.className = 'kw-grid';
  keywords.forEach(item => {
    const card = document.createElement('div');
    card.className = 'kw-card';
    const kw = document.createElement('div');
    kw.className = 'kw-name';
    kw.textContent = item.kw;
    const desc = document.createElement('div');
    desc.className = 'kw-desc';
    desc.textContent = (currentLang === 'en' && item.descEn) ? item.descEn : item.desc;
    card.appendChild(kw);
    card.appendChild(desc);
    grid.appendChild(card);
  });
  section.appendChild(grid);
  container.appendChild(section);
}

function buildSqlCheatsheet() {
  const container = document.getElementById('sql-template-grid');
  if (!container) return;
  container.innerHTML = '';

  buildKeywordCards(sqlKeywords, container);

  sqlTemplates.forEach(cat => {
    const section = document.createElement('div');
    section.style.marginBottom = '28px';

    const h4 = document.createElement('h4');
    h4.textContent = (currentLang === 'en' && cat.categoryEn) ? cat.categoryEn : cat.category;
    h4.style.cssText = 'font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border);';
    section.appendChild(h4);

    const grid = document.createElement('div');
    grid.className = 'sql-template-grid';

    cat.templates.forEach(tmpl => {
      const card = document.createElement('div');
      card.className = 'sql-template-card';

      const name = document.createElement('div');
      name.className = 'sql-template-name';
      name.textContent = (currentLang === 'en' && tmpl.nameEn) ? tmpl.nameEn : tmpl.name;

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

function insertSqlTemplate(sql) {
  navigate('sql-formatter');
  document.getElementById('sql-input').value = sql;
}

// ===== Init =====

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  buildNav();
  initSearch();
  applyLang();
  initTabs('base64-tabs');
  buildSqlCheatsheet();
  buildKqlCheatsheet();
  addClearButtons();

  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // URL Encoder listeners
  const rawEl = document.getElementById('url-raw');
  const encEl = document.getElementById('url-encoded');
  if (rawEl) rawEl.addEventListener('input', () => {
    try { encEl.value = encodeURIComponent(rawEl.value); } catch {}
  });
  if (encEl) encEl.addEventListener('input', () => {
    try { rawEl.value = decodeURIComponent(encEl.value); } catch {}
  });

  // Set current datetime in timestamp tool
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  const dateEl = document.getElementById('date-input');
  if (dateEl) dateEl.value = local.toISOString().slice(0, 16);

  // Restore from hash
  const hash = window.location.hash.replace('#', '');
  if (hash && tools.find(t => t.id === hash)) {
    navigate(hash);
  }
});
