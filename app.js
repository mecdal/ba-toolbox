// ===== Utility Functions =====

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = 'Kopyalandı!';
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('btn-success');
    }, 2000);
  } catch {
    alert('Kopyalama başarısız. Manuel olarak seçip kopyalayın.');
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
  if (btn) btn.textContent = theme === 'dark' ? '☀️ Açık Mod' : '🌙 Karanlık Mod';
}

// ===== Navigation =====

const tools = [
  // Veri & Format
  { id: 'json-formatter',    label: 'JSON Formatlayıcı',     icon: '{}',  group: 'Veri & Format' },
  { id: 'json-grid',         label: 'JSON Grid Görünüm',     icon: '⊞',   group: 'Veri & Format' },
  { id: 'json-escape',       label: 'JSON Escape/Unescape',  icon: '\\{}', group: 'Veri & Format' },
  { id: 'csv-to-json',       label: 'CSV → JSON',            icon: '📊',  group: 'Veri & Format' },
  { id: 'base64',            label: 'Base64 / Dosya',        icon: '🔐',  group: 'Veri & Format' },
  // Geliştirici
  { id: 'jwt-decoder',       label: 'JWT Decoder',           icon: '🎟️',  group: 'Geliştirici' },
  { id: 'url-encoder',       label: 'URL Encode/Decode',     icon: '🔗',  group: 'Geliştirici' },
  { id: 'hash-generator',    label: 'Hash Üretici',          icon: '#',   group: 'Geliştirici' },
  { id: 'uuid-generator',    label: 'UUID Üretici',          icon: '🔑',  group: 'Geliştirici' },
  { id: 'regex-tester',      label: 'Regex Test',            icon: '.*',  group: 'Geliştirici' },
  { id: 'timestamp',         label: 'Timestamp Dönüştürücü', icon: '🕐',  group: 'Geliştirici' },
  // Geliştirici (URL shortener eklendi)
  { id: 'url-shortener',     label: 'URL Kısaltıcı',         icon: '✂️',  group: 'Geliştirici' },
  // Veritabanı
  { id: 'sql-formatter',     label: 'SQL Formatlayıcı',      icon: '🗄️',  group: 'Veritabanı' },
  { id: 'sql-cheatsheet',    label: 'SQL Şablonları',        icon: '📋',  group: 'Veritabanı' },
  { id: 'kql-formatter',     label: 'KQL Formatlayıcı',      icon: '☁️',  group: 'Veritabanı' },
  { id: 'kql-cheatsheet',    label: 'KQL Şablonları',        icon: '📋',  group: 'Veritabanı' },
  // Metin
  { id: 'diff-checker',      label: 'Metin Karşılaştırma',   icon: '🔍',  group: 'Metin' },
  { id: 'word-counter',      label: 'Kelime Sayacı',         icon: '📝',  group: 'Metin' },
  { id: 'text-editor',       label: 'Metin Editörü',         icon: '✏️',  group: 'Metin' },
  { id: 'lorem-ipsum',       label: 'Lorem Ipsum',           icon: '📄',  group: 'Metin' },
  // Hesaplama
  { id: 'interest-calc',     label: 'Faiz Hesaplama',        icon: '💰',  group: 'Hesaplama' },
  { id: 'color-picker',      label: 'Renk Dönüştürücü',      icon: '🎨',  group: 'Hesaplama' },
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
    label.className = 'tool-group-label';
    label.textContent = group;
    list.appendChild(label);

    items.forEach(t => {
      const item = document.createElement('div');
      item.className = 'tool-nav-item';
      item.dataset.tool = t.id;
      item.innerHTML = `<span class="icon">${t.icon}</span><span>${t.label}</span>`;
      item.addEventListener('click', () => navigate(t.id));
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
  const tool = tools.find(t => t.id === toolId);
  document.getElementById('topbar-title').textContent = tool ? tool.label : '';

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
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
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
    document.getElementById('json-status').textContent = '✓ Geçerli JSON';
    document.getElementById('json-status').style.color = 'var(--success)';
  } catch (e) {
    showError('json-error', 'JSON Hatası: ' + e.message);
    document.getElementById('json-status').textContent = '✗ Geçersiz JSON';
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
    showError('json-error', 'JSON Hatası: ' + e.message);
  }
}

function jsonValidate() {
  hideError('json-error');
  const input = document.getElementById('json-input').value.trim();
  try {
    JSON.parse(input);
    document.getElementById('json-status').textContent = '✓ Geçerli JSON';
    document.getElementById('json-status').style.color = 'var(--success)';
    hideError('json-error');
  } catch (e) {
    showError('json-error', 'JSON Hatası: ' + e.message);
    document.getElementById('json-status').textContent = '✗ Geçersiz JSON';
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
  let html = '<div class="irc-row irc-header"><span>FAİZ HESAPLAMA SONUCU</span></div>';
  html += `<div class="irc-row"><span>${data.principalLabel || 'Ana Para'}</span><span class="irc-val">₺ ${fmt(data.principal)}</span></div>`;
  html += `<div class="irc-row"><span>Brüt Faiz Geliri</span><span class="irc-val positive">+ ₺ ${fmt(data.grossInterest)}</span></div>`;
  if (data.breakdown && data.breakdown.length > 0) {
    data.breakdown.forEach(b => {
      html += `<div class="irc-row irc-tax"><span>${b.label}</span><span class="irc-val negative">− ₺ ${fmt(b.amount)}</span></div>`;
    });
    html += `<div class="irc-row"><span>Net Faiz Geliri</span><span class="irc-val positive">+ ₺ ${fmt(data.netInterest)}</span></div>`;
  }
  html += `<div class="irc-row irc-total"><span>VADE SONU TOPLAM</span><span class="irc-val total">₺ ${fmt(data.total)}</span></div>`;
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
    showError('interest-error', 'Lütfen tüm alanları doğru doldurun.');
    return;
  }

  const tYears = unit === 'day' ? T / 365 : unit === 'month' ? T / 12 : T;
  const grossInterest = P * (R / 100) * tYears;
  const ts = getTaxSettings('si');
  const tax = calcTaxAmount(grossInterest, ts);

  renderInterestResult('si-result-card', { principal: P, grossInterest, breakdown: tax.breakdown, netInterest: tax.netInterest, total: P + tax.netInterest });

  const steps = Math.min(T, 12);
  const fmt = n => n.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
  let rows = '';
  for (let i = 1; i <= steps; i++) {
    const tStep = unit === 'day' ? i / 365 : unit === 'month' ? i / 12 : i;
    const gi = P * (R / 100) * tStep;
    const t = calcTaxAmount(gi, ts);
    const label = unit === 'year' ? `${i}. Yıl` : unit === 'month' ? `${i}. Ay` : `${i}. Gün`;
    rows += `<tr><td>${label}</td><td>${fmt(P)}</td><td>${fmt(gi)}</td><td style="color:var(--error);">${fmt(t.totalTax)}</td><td>${fmt(t.netInterest)}</td><td><strong>${fmt(P + t.netInterest)}</strong></td></tr>`;
  }
  document.getElementById('interest-table').innerHTML = rows;
  document.getElementById('si-table-wrap').style.display = '';
}

function calcCompoundInterest() {
  hideError('interest-error');
  const P = parseFloat(document.getElementById('ci-principal').value);
  const R = parseFloat(document.getElementById('ci-rate').value);
  const T = parseFloat(document.getElementById('ci-time').value);
  const n = parseInt(document.getElementById('ci-freq').value);

  if (isNaN(P) || isNaN(R) || isNaN(T) || P <= 0 || T <= 0) {
    showError('interest-error', 'Lütfen tüm alanları doğru doldurun.');
    return;
  }

  const A = P * Math.pow(1 + (R / 100) / n, n * T);
  const grossInterest = A - P;
  const ts = getTaxSettings('ci');
  const tax = calcTaxAmount(grossInterest, ts);

  renderInterestResult('ci-result-card', { principal: P, grossInterest, breakdown: tax.breakdown, netInterest: tax.netInterest, total: P + tax.netInterest });

  const steps = Math.min(T, 20);
  const fmt = n => n.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
  let rows = '';
  for (let i = 1; i <= steps; i++) {
    const Ai = P * Math.pow(1 + (R / 100) / n, n * i);
    const gi = Ai - P;
    const t = calcTaxAmount(gi, ts);
    rows += `<tr><td>${i}. Yıl</td><td>${fmt(P)}</td><td>${fmt(gi)}</td><td style="color:var(--error);">${fmt(t.totalTax)}</td><td>${fmt(t.netInterest)}</td><td><strong>${fmt(P + t.netInterest)}</strong></td></tr>`;
  }
  document.getElementById('compound-table').innerHTML = rows;
  document.getElementById('ci-table-wrap').style.display = '';
}

function calcSavings() {
  hideError('interest-error');
  const P = parseFloat(document.getElementById('sa-initial').value) || 0;
  const M = parseFloat(document.getElementById('sa-monthly').value);
  const R = parseFloat(document.getElementById('sa-rate').value);
  const months = parseInt(document.getElementById('sa-months').value);

  if (isNaN(M) || isNaN(R) || isNaN(months) || months <= 0) {
    showError('interest-error', 'Lütfen tüm alanları doğru doldurun.');
    return;
  }

  const monthlyRate = R / 100 / 12;
  const ts = getTaxSettings('sa');
  let balance = P;
  let totalContrib = P;
  let totalGross = 0, totalTaxAmt = 0;
  let rows = '';
  const fmt = x => x.toLocaleString('tr-TR', { minimumFractionDigits: 2 });

  for (let i = 1; i <= months; i++) {
    balance += M;
    totalContrib += M;
    const gi = balance * monthlyRate;
    totalGross += gi;
    const t = calcTaxAmount(gi, ts);
    totalTaxAmt += t.totalTax;
    balance += t.netInterest;
    rows += `<tr><td>${i}. Ay</td><td>${fmt(M)}</td><td>${fmt(totalContrib)}</td><td>${fmt(totalGross)}</td><td style="color:var(--error);">${fmt(totalTaxAmt)}</td><td>${fmt(totalGross - totalTaxAmt)}</td><td><strong>${fmt(balance)}</strong></td></tr>`;
  }

  const taxBreakdown = totalTaxAmt > 0 ? [{ label: 'Toplam Vergi Kesintisi', amount: totalTaxAmt }] : [];
  renderInterestResult('sa-result-card', { principalLabel: 'Toplam Yatırılan', principal: totalContrib, grossInterest: totalGross, breakdown: taxBreakdown, netInterest: totalGross - totalTaxAmt, total: balance });
  document.getElementById('savings-table').innerHTML = rows;
  document.getElementById('sa-table-wrap').style.display = '';
}

// ===== Tool: Timestamp =====

function tsToDate() {
  const val = document.getElementById('ts-input').value.trim();
  const num = parseInt(val);
  if (isNaN(num)) { document.getElementById('ts-result').textContent = 'Geçersiz timestamp'; return; }
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
    showError('base64-error', 'Encode hatası: ' + e.message);
  }
}

function base64Decode() {
  hideError('base64-error');
  try {
    const input = document.getElementById('b64-encoded').value.trim();
    document.getElementById('b64-raw').value = decodeURIComponent(escape(atob(input)));
  } catch (e) {
    showError('base64-error', 'Geçersiz Base64 verisi.');
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
    showError('csv-error', 'CSV Hatası: ' + e.message);
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

  document.getElementById('diff-stats').textContent = `+${added} eklendi, -${removed} silindi`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ===== Tool: Regex Tester =====

function runRegex() {
  hideError('regex-error');
  const pattern = document.getElementById('regex-pattern').value;
  const flags = [...document.querySelectorAll('.regex-flag:checked')].map(c => c.value).join('');
  const text = document.getElementById('regex-text').value;
  const preview = document.getElementById('regex-preview');

  if (!pattern) { preview.innerHTML = escapeHtml(text); return; }

  try {
    const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
    const matches = [...text.matchAll(re)];
    document.getElementById('regex-count').textContent = `${matches.length} eşleşme bulundu`;

    const highlighted = text.replace(new RegExp(pattern, flags.includes('g') ? flags : flags + 'g'),
      m => `<mark>${escapeHtml(m)}</mark>`);
    preview.innerHTML = highlighted.replace(/\n/g, '<br>');
  } catch (e) {
    showError('regex-error', 'Geçersiz regex: ' + e.message);
    preview.innerHTML = escapeHtml(text);
  }
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
  document.getElementById('wc-readtime').textContent = readTime + ' dk';
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
    showError('jwt-error', 'Geçersiz JWT formatı. 3 parça (header.payload.signature) olmalı.');
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
    showError('jwt-error', 'Decode hatası: ' + e.message);
  }
}

// ===== Tool: URL Encoder =====
// (listeners initialized in DOMContentLoaded below)

// ===== Tool: Hash Generator =====

async function generateHash() {
  const input = document.getElementById('hash-input').value;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  async function digest(algo) {
    const buf = await crypto.subtle.digest(algo, data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  document.getElementById('hash-sha256').textContent = await digest('SHA-256');
  document.getElementById('hash-sha512').textContent = await digest('SHA-512');
  try {
    document.getElementById('hash-sha1').textContent = await digest('SHA-1');
  } catch {
    document.getElementById('hash-sha1').textContent = '(Bu tarayıcıda desteklenmiyor)';
  }
}

// ===== Tool: Color Picker =====

function initColorPicker() {
  const picker = document.getElementById('color-picker-input');
  if (!picker) return;
  picker.addEventListener('input', () => updateColorFromHex(picker.value));
}

function updateColorFromHex(hex) {
  document.getElementById('color-picker-input').value = hex;
  document.getElementById('color-hex').value = hex;
  document.getElementById('color-preview').style.background = hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  document.getElementById('color-rgb').value = `rgb(${r}, ${g}, ${b})`;
  const hsl = rgbToHsl(r, g, b);
  document.getElementById('color-hsl').value = `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// ===== Tool: Lorem Ipsum =====

const loremWords = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure dolor reprehenderit voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');

function generateLorem() {
  const type = document.getElementById('lorem-type').value;
  const count = parseInt(document.getElementById('lorem-count').value) || 1;
  let result = '';

  if (type === 'words') {
    const words = [];
    for (let i = 0; i < count; i++) words.push(loremWords[i % loremWords.length]);
    result = words.join(' ');
  } else if (type === 'sentences') {
    for (let i = 0; i < count; i++) {
      const len = 8 + Math.floor(Math.random() * 8);
      const words = [];
      for (let j = 0; j < len; j++) words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      result += words.join(' ') + '. ';
    }
  } else {
    for (let i = 0; i < count; i++) {
      const sentenceCount = 3 + Math.floor(Math.random() * 4);
      const sentences = [];
      for (let s = 0; s < sentenceCount; s++) {
        const len = 8 + Math.floor(Math.random() * 8);
        const words = [];
        for (let j = 0; j < len; j++) words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        sentences.push(words.join(' ') + '.');
      }
      result += sentences.join(' ') + '\n\n';
    }
  }

  document.getElementById('lorem-output').value = result.trim();
}

// ===== Tool: JSON Grid =====

function renderJsonGrid() {
  hideError('json-grid-error');
  const input = document.getElementById('json-grid-input').value.trim();
  const container = document.getElementById('json-grid-output');
  container.innerHTML = '';
  if (!input) return;
  try {
    const data = JSON.parse(input);
    container.appendChild(buildGridNode(data, 0));
  } catch (e) {
    showError('json-grid-error', 'JSON Hatası: ' + e.message);
  }
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
    td.appendChild(depth < 3 ? buildGridNode(val, depth + 1) : createGridSpan(Array.isArray(val) ? '[…]' : '{…}', 'json-grid-nested'));
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
    showError('json-escape-error', 'Parse hatası: ' + e.message);
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
    showError('base64-error', 'Geçersiz Base64 verisi.');
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

const kqlTemplates = [
  {
    category: 'Temel Sorgular',
    templates: [
      { name: 'Basit sorgu', sql: `TableName\n| where TimeGenerated > ago(1h)\n| limit 100` },
      { name: 'Zaman aralığı + filtre', sql: `TableName\n| where TimeGenerated between (datetime(2024-01-01) .. datetime(2024-12-31))\n| where Level == "Error"\n| project TimeGenerated, Message, Level, Computer` },
      { name: 'DISTINCT değerler', sql: `TableName\n| distinct Category, Level\n| order by Category asc` },
      { name: 'TOP N kayıt', sql: `TableName\n| top 10 by TimeGenerated desc` },
    ]
  },
  {
    category: 'Zaman & Bin',
    templates: [
      { name: 'Son N saat/gün', sql: `TableName\n| where TimeGenerated > ago(24h)` },
      { name: 'Zaman serisi (5dk aralık)', sql: `TableName\n| where TimeGenerated > ago(1h)\n| summarize count() by bin(TimeGenerated, 5m)\n| render timechart` },
      { name: 'Günlük özet', sql: `TableName\n| summarize Count=count() by bin(TimeGenerated, 1d)\n| order by TimeGenerated asc\n| render barchart` },
    ]
  },
  {
    category: 'Agregasyon',
    templates: [
      { name: 'Count by field', sql: `TableName\n| summarize Count=count() by Category\n| order by Count desc` },
      { name: 'Çoklu metrik', sql: `TableName\n| summarize\n    Count=count(),\n    Avg=avg(Duration),\n    P95=percentile(Duration, 95),\n    Max=max(Duration)\n  by Computer` },
      { name: 'dcount (tekil sayı)', sql: `TableName\n| summarize UniqueUsers=dcount(UserId) by bin(TimeGenerated, 1h)` },
    ]
  },
  {
    category: 'Log Analytics & Azure Monitor',
    templates: [
      { name: 'Hata logları (AzureDiagnostics)', sql: `AzureDiagnostics\n| where Category == "ApplicationGatewayAccessLog"\n| where httpStatus_d >= 400\n| project TimeGenerated, requestUri_s, httpStatus_d, clientIP_s\n| order by TimeGenerated desc` },
      { name: 'VM CPU kullanımı', sql: `Perf\n| where ObjectName == "Processor"\n    and CounterName == "% Processor Time"\n    and InstanceName == "_Total"\n| where TimeGenerated > ago(1h)\n| summarize AvgCPU=avg(CounterValue) by Computer, bin(TimeGenerated, 5m)\n| render timechart` },
      { name: 'Heartbeat / VM uptime', sql: `Heartbeat\n| where TimeGenerated > ago(24h)\n| summarize LastSeen=max(TimeGenerated) by Computer\n| where LastSeen < ago(5m)` },
    ]
  },
  {
    category: 'Application Insights',
    templates: [
      { name: 'Exception tracking', sql: `exceptions\n| where timestamp > ago(24h)\n| summarize Count=count() by type, outerMessage\n| order by Count desc\n| take 20` },
      { name: 'Yavaş istekler (P95)', sql: `requests\n| where timestamp > ago(1h)\n| summarize P95=percentile(duration, 95), Count=count() by name\n| where P95 > 1000\n| order by P95 desc` },
      { name: 'Availability sonuçları', sql: `availabilityResults\n| where timestamp > ago(24h)\n| summarize\n    Total=count(),\n    Failed=countif(success == false)\n  by name\n| extend SuccessRate = round(100.0 * (Total - Failed) / Total, 2)` },
      { name: 'Bağımlılık hataları', sql: `dependencies\n| where timestamp > ago(1h)\n    and success == false\n| summarize Count=count() by target, name, type\n| order by Count desc` },
    ]
  },
  {
    category: 'Güvenlik & Sentinel',
    templates: [
      { name: 'Başarısız giriş denemeleri', sql: `SecurityEvent\n| where EventID == 4625\n    and TimeGenerated > ago(1h)\n| summarize Attempts=count() by Account, IpAddress\n| where Attempts > 10\n| order by Attempts desc` },
      { name: 'Yeni servis hesapları', sql: `SecurityEvent\n| where EventID == 4720\n    and TimeGenerated > ago(7d)\n| project TimeGenerated, TargetAccount, SubjectAccount, Computer` },
      { name: 'Ağ bağlantıları', sql: `NetworkCommunicationEvents\n| where TimeGenerated > ago(1h)\n| summarize Connections=count() by RemoteIP, RemotePort\n| order by Connections desc\n| take 50` },
    ]
  },
  {
    category: 'İleri Düzey',
    templates: [
      { name: 'Let değişkeni', sql: `let threshold = 1000;\nlet startTime = ago(24h);\nTableName\n| where TimeGenerated > startTime\n    and Duration > threshold\n| order by Duration desc` },
      { name: 'Join', sql: `TableA\n| join kind=inner (\n    TableB\n    | where Condition == true\n  ) on $left.Id == $right.TableAId\n| project TimeGenerated, FieldA, FieldB` },
      { name: 'Parse (regex)', sql: `TableName\n| parse Message with * "user=" User " " *\n| summarize count() by User` },
      { name: 'mv-expand (dizi açma)', sql: `TableName\n| mv-expand Tags\n| summarize count() by tostring(Tags)` },
    ]
  },
];

function buildKqlCheatsheet() {
  const container = document.getElementById('kql-template-grid');
  if (!container) return;
  container.innerHTML = '';

  kqlTemplates.forEach(cat => {
    const section = document.createElement('div');
    section.style.marginBottom = '28px';
    const h4 = document.createElement('h4');
    h4.textContent = cat.category;
    h4.style.cssText = 'font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border);';
    section.appendChild(h4);
    const grid = document.createElement('div');
    grid.className = 'sql-template-grid';

    cat.templates.forEach(tmpl => {
      const card = document.createElement('div');
      card.className = 'sql-template-card';
      const name = document.createElement('div');
      name.className = 'sql-template-name';
      name.textContent = tmpl.name;
      const pre = document.createElement('pre');
      pre.className = 'sql-template-preview';
      pre.textContent = tmpl.sql;
      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group';
      btnGroup.style.marginBottom = '0';
      const btnExport = document.createElement('button');
      btnExport.className = 'btn btn-primary';
      btnExport.style.cssText = 'font-size:11px; padding:5px 10px;';
      btnExport.textContent = "KQL'e Aktar";
      btnExport.addEventListener('click', () => {
        navigate('kql-formatter');
        document.getElementById('kql-input').value = tmpl.sql;
      });
      const btnCopy = document.createElement('button');
      btnCopy.className = 'btn btn-secondary';
      btnCopy.style.cssText = 'font-size:11px; padding:5px 10px;';
      btnCopy.textContent = 'Kopyala';
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
  document.getElementById('editor-stats').textContent = `${content.length} karakter · ${words} kelime · ${lines} satır`;
}

// ===== Tool: URL Shortener =====

async function shortenUrl() {
  hideError('url-short-error');
  const url = document.getElementById('url-short-input').value.trim();
  if (!url) return;
  try { new URL(url); } catch {
    showError('url-short-error', 'Geçerli bir URL girin (https:// ile başlamalı).');
    return;
  }
  const resultEl = document.getElementById('url-short-result');
  const outputEl = document.getElementById('url-short-output');
  resultEl.style.display = 'none';
  try {
    const res = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error('API hatası: ' + res.status);
    const shortUrl = (await res.text()).trim();
    if (!shortUrl.startsWith('http')) throw new Error(shortUrl);
    outputEl.textContent = shortUrl;
    outputEl.href = shortUrl;
    resultEl.style.display = 'block';
  } catch (e) {
    showError('url-short-error', 'Kısaltılamadı: ' + e.message);
  }
}

function copyShortUrl() {
  copyToClipboard(document.getElementById('url-short-output').textContent, document.getElementById('url-short-copy-btn'));
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
    btn.textContent = 'Temizle';
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
  ['json-grid-output', 'diff-output', 'regex-preview', 'si-result-card', 'ci-result-card', 'sa-result-card', 'editor-stats', 'regex-count', 'diff-stats', 'file-b64-info', 'json-status', 'url-short-result'].forEach(id => {
    const el = panel.querySelector('#' + id);
    if (!el) return;
    if (id === 'url-short-result') { el.style.display = 'none'; }
    else if (id.endsWith('-card')) { el.innerHTML = ''; el.style.display = 'none'; }
    else { el.innerHTML = ''; el.textContent = ''; }
  });
  ['si-table-wrap', 'ci-table-wrap', 'sa-table-wrap'].forEach(id => {
    const el = panel.querySelector('#' + id);
    if (el) el.style.display = 'none';
  });
}

// ===== Tool: SQL Cheatsheet =====

const sqlTemplates = [
  {
    category: 'Temel Sorgular',
    templates: [
      { name: 'SELECT *', sql: `SELECT *\nFROM tablo_adi\nWHERE koşul = 'değer'\nORDER BY sütun ASC\nLIMIT 100;` },
      { name: 'SELECT belirli sütunlar', sql: `SELECT\n    id,\n    ad,\n    email,\n    olusturma_tarihi\nFROM kullanicilar\nWHERE aktif = 1\nORDER BY ad ASC;` },
      { name: 'INSERT INTO', sql: `INSERT INTO tablo_adi (sütun1, sütun2, sütun3)\nVALUES ('değer1', 'değer2', 'değer3');` },
      { name: 'INSERT çoklu satır', sql: `INSERT INTO tablo_adi (sütun1, sütun2)\nVALUES\n    ('değer1a', 'değer1b'),\n    ('değer2a', 'değer2b'),\n    ('değer3a', 'değer3b');` },
      { name: 'UPDATE', sql: `UPDATE tablo_adi\nSET\n    sütun1 = 'yeni_değer1',\n    sütun2 = 'yeni_değer2'\nWHERE id = 1;` },
      { name: 'DELETE', sql: `DELETE FROM tablo_adi\nWHERE id = 1;` },
    ]
  },
  {
    category: 'JOIN Sorguları',
    templates: [
      { name: 'INNER JOIN', sql: `SELECT\n    a.id,\n    a.ad,\n    b.sütun\nFROM tablo_a a\nINNER JOIN tablo_b b ON a.b_id = b.id\nWHERE a.aktif = 1;` },
      { name: 'LEFT JOIN', sql: `SELECT\n    a.id,\n    a.ad,\n    b.sütun\nFROM tablo_a a\nLEFT JOIN tablo_b b ON a.b_id = b.id;` },
      { name: 'Çoklu JOIN', sql: `SELECT\n    s.id AS siparis_id,\n    k.ad AS musteri,\n    u.ad AS urun,\n    sd.adet,\n    sd.birim_fiyat\nFROM siparisler s\nINNER JOIN musteriler k ON s.musteri_id = k.id\nINNER JOIN siparis_detay sd ON s.id = sd.siparis_id\nINNER JOIN urunler u ON sd.urun_id = u.id\nWHERE s.tarih >= '2024-01-01'\nORDER BY s.tarih DESC;` },
      { name: 'SELF JOIN', sql: `SELECT\n    e.id,\n    e.ad AS calisan,\n    m.ad AS yonetici\nFROM calisanlar e\nLEFT JOIN calisanlar m ON e.yonetici_id = m.id;` },
    ]
  },
  {
    category: 'Agregasyon & Gruplama',
    templates: [
      { name: 'GROUP BY + COUNT/SUM', sql: `SELECT\n    kategori,\n    COUNT(*) AS adet,\n    SUM(tutar) AS toplam,\n    AVG(tutar) AS ortalama\nFROM siparisler\nWHERE tarih >= '2024-01-01'\nGROUP BY kategori\nHAVING COUNT(*) > 5\nORDER BY toplam DESC;` },
      { name: 'DISTINCT COUNT', sql: `SELECT\n    COUNT(*) AS toplam_siparis,\n    COUNT(DISTINCT musteri_id) AS tekil_musteri\nFROM siparisler\nWHERE YEAR(tarih) = 2024;` },
      { name: 'ROLLUP', sql: `SELECT\n    departman,\n    pozisyon,\n    COUNT(*) AS calisan_sayisi,\n    AVG(maas) AS ort_maas\nFROM calisanlar\nGROUP BY departman, pozisyon WITH ROLLUP;` },
    ]
  },
  {
    category: 'Alt Sorgular & CTE',
    templates: [
      { name: 'WHERE IN (alt sorgu)', sql: `SELECT *\nFROM urunler\nWHERE id IN (\n    SELECT urun_id\n    FROM siparis_detay\n    WHERE siparis_id IN (\n        SELECT id\n        FROM siparisler\n        WHERE durum = 'tamamlandi'\n    )\n);` },
      { name: 'EXISTS', sql: `SELECT *\nFROM musteriler k\nWHERE EXISTS (\n    SELECT 1\n    FROM siparisler s\n    WHERE s.musteri_id = k.id\n      AND s.tarih >= '2024-01-01'\n);` },
      { name: 'CTE (WITH)', sql: `WITH aylik_ozet AS (\n    SELECT\n        DATE_TRUNC('month', tarih) AS ay,\n        SUM(tutar) AS toplam\n    FROM siparisler\n    GROUP BY DATE_TRUNC('month', tarih)\n)\nSELECT\n    ay,\n    toplam,\n    LAG(toplam) OVER (ORDER BY ay) AS onceki_ay,\n    toplam - LAG(toplam) OVER (ORDER BY ay) AS degisim\nFROM aylik_ozet\nORDER BY ay;` },
    ]
  },
  {
    category: 'Analitik & Pencere Fonksiyonları',
    templates: [
      { name: 'ROW_NUMBER / RANK', sql: `SELECT\n    id, ad, satis, departman,\n    ROW_NUMBER() OVER (PARTITION BY departman ORDER BY satis DESC) AS sira,\n    RANK()       OVER (PARTITION BY departman ORDER BY satis DESC) AS rank,\n    DENSE_RANK() OVER (PARTITION BY departman ORDER BY satis DESC) AS dense_rank\nFROM calisanlar;` },
      { name: 'Kümülatif toplam', sql: `SELECT\n    tarih,\n    tutar,\n    SUM(tutar) OVER (ORDER BY tarih) AS kumulatif_toplam,\n    AVG(tutar) OVER (ORDER BY tarih ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS haftalik_ort\nFROM gunluk_satis\nORDER BY tarih;` },
      { name: 'LAG / LEAD', sql: `SELECT\n    tarih,\n    tutar,\n    LAG(tutar, 1)  OVER (ORDER BY tarih) AS onceki_gun,\n    LEAD(tutar, 1) OVER (ORDER BY tarih) AS sonraki_gun,\n    tutar - LAG(tutar, 1) OVER (ORDER BY tarih) AS degisim\nFROM gunluk_satis\nORDER BY tarih;` },
    ]
  },
  {
    category: 'DDL (Tablo Yapısı)',
    templates: [
      { name: 'CREATE TABLE', sql: `CREATE TABLE kullanicilar (\n    id         INT AUTO_INCREMENT PRIMARY KEY,\n    uuid       CHAR(36) NOT NULL UNIQUE,\n    ad         VARCHAR(100) NOT NULL,\n    email      VARCHAR(255) NOT NULL UNIQUE,\n    aktif      TINYINT(1) DEFAULT 1,\n    olusturma  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n    guncelleme TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n);` },
      { name: 'ALTER TABLE (sütun ekle)', sql: `ALTER TABLE tablo_adi\nADD COLUMN yeni_sutun VARCHAR(255) NULL AFTER mevcut_sutun;` },
      { name: 'INDEX oluştur', sql: `CREATE INDEX idx_tablo_sutun\n    ON tablo_adi (sutun_adi);\n\nCREATE UNIQUE INDEX idx_kullanici_email\n    ON kullanicilar (email);` },
      { name: 'FOREIGN KEY', sql: `ALTER TABLE siparis_detay\nADD CONSTRAINT fk_siparis\n    FOREIGN KEY (siparis_id)\n    REFERENCES siparisler (id)\n    ON DELETE CASCADE\n    ON UPDATE CASCADE;` },
    ]
  },
];

function buildSqlCheatsheet() {
  const container = document.getElementById('sql-template-grid');
  if (!container) return;
  container.innerHTML = '';

  sqlTemplates.forEach(cat => {
    const section = document.createElement('div');
    section.style.marginBottom = '28px';

    const h4 = document.createElement('h4');
    h4.textContent = cat.category;
    h4.style.cssText = 'font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border);';
    section.appendChild(h4);

    const grid = document.createElement('div');
    grid.className = 'sql-template-grid';

    cat.templates.forEach(tmpl => {
      const card = document.createElement('div');
      card.className = 'sql-template-card';

      const name = document.createElement('div');
      name.className = 'sql-template-name';
      name.textContent = tmpl.name;

      const pre = document.createElement('pre');
      pre.className = 'sql-template-preview';
      pre.textContent = tmpl.sql;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group';
      btnGroup.style.marginBottom = '0';

      const btnExport = document.createElement('button');
      btnExport.className = 'btn btn-primary';
      btnExport.style.cssText = 'font-size:11px; padding:5px 10px;';
      btnExport.textContent = "SQL'e Aktar";
      btnExport.addEventListener('click', () => insertSqlTemplate(tmpl.sql));

      const btnCopy = document.createElement('button');
      btnCopy.className = 'btn btn-secondary';
      btnCopy.style.cssText = 'font-size:11px; padding:5px 10px;';
      btnCopy.textContent = 'Kopyala';
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
  initColorPicker();
  initTabs('interest-tabs');
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
