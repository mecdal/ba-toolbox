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
  { id: 'json-formatter',    label: 'JSON Formatlayıcı',    icon: '{}',  group: 'Temel Araçlar' },
  { id: 'uuid-generator',    label: 'UUID Üretici',          icon: '🔑',  group: 'Temel Araçlar' },
  { id: 'interest-calc',     label: 'Faiz Hesaplama',        icon: '💰',  group: 'Temel Araçlar' },
  { id: 'timestamp',         label: 'Timestamp Dönüştürücü', icon: '🕐',  group: 'Veri Araçları' },
  { id: 'base64',            label: 'Base64 Encode/Decode',  icon: '🔐',  group: 'Veri Araçları' },
  { id: 'csv-to-json',       label: 'CSV → JSON',            icon: '📊',  group: 'Veri Araçları' },
  { id: 'diff-checker',      label: 'Metin Karşılaştırma',   icon: '🔍',  group: 'Metin Araçları' },
  { id: 'regex-tester',      label: 'Regex Test',            icon: '.*',  group: 'Metin Araçları' },
  { id: 'word-counter',      label: 'Kelime Sayacı',         icon: '📝',  group: 'Metin Araçları' },
  { id: 'sql-formatter',     label: 'SQL Formatlayıcı',      icon: '🗄️',  group: 'Metin Araçları' },
  { id: 'jwt-decoder',       label: 'JWT Decoder',           icon: '🎟️',  group: 'Geliştirici' },
  { id: 'url-encoder',       label: 'URL Encode/Decode',     icon: '🔗',  group: 'Geliştirici' },
  { id: 'hash-generator',    label: 'Hash Üretici',          icon: '#',   group: 'Geliştirici' },
  { id: 'color-picker',      label: 'Renk Dönüştürücü',      icon: '🎨',  group: 'Ekstra' },
  { id: 'lorem-ipsum',       label: 'Lorem Ipsum',           icon: '📄',  group: 'Ekstra' },
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

// ===== Tool: Interest Calculator =====

function calcSimpleInterest() {
  hideError('interest-error');
  const P = parseFloat(document.getElementById('si-principal').value);
  const R = parseFloat(document.getElementById('si-rate').value);
  const T = parseFloat(document.getElementById('si-time').value);
  const unit = document.getElementById('si-unit').value;

  if (isNaN(P) || isNaN(R) || isNaN(T)) {
    showError('interest-error', 'Lütfen tüm alanları doldurun.');
    return;
  }

  let t = T;
  if (unit === 'month') t = T / 12;
  if (unit === 'day') t = T / 365;

  const interest = P * (R / 100) * t;
  const total = P + interest;

  document.getElementById('si-result').innerHTML =
    `<div>Faiz Tutarı: <strong>${interest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong></div>
     <div>Toplam Tutar: <strong>${total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong></div>`;

  buildSimpleTable(P, R / 100, t, T, unit);
}

function buildSimpleTable(P, r, tYears, T, unit) {
  const steps = Math.min(T, 12);
  let rows = '';
  for (let i = 1; i <= steps; i++) {
    let tStep = i;
    if (unit === 'month') tStep = i / 12;
    if (unit === 'day') tStep = i / 365;
    const interest = P * r * tStep;
    const total = P + interest;
    const label = unit === 'year' ? `${i}. Yıl` : unit === 'month' ? `${i}. Ay` : `${i}. Gün`;
    rows += `<tr><td>${label}</td><td>${P.toLocaleString('tr-TR')}</td><td>${interest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td><td>${total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td></tr>`;
  }
  document.getElementById('interest-table').innerHTML = rows;
}

function calcCompoundInterest() {
  hideError('interest-error');
  const P = parseFloat(document.getElementById('ci-principal').value);
  const R = parseFloat(document.getElementById('ci-rate').value);
  const T = parseFloat(document.getElementById('ci-time').value);
  const n = parseInt(document.getElementById('ci-freq').value);

  if (isNaN(P) || isNaN(R) || isNaN(T)) {
    showError('interest-error', 'Lütfen tüm alanları doldurun.');
    return;
  }

  const A = P * Math.pow(1 + (R / 100) / n, n * T);
  const interest = A - P;

  document.getElementById('ci-result').innerHTML =
    `<div>Faiz Tutarı: <strong>${interest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong></div>
     <div>Toplam Tutar: <strong>${A.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong></div>`;

  buildCompoundTable(P, R / 100, T, n);
}

function buildCompoundTable(P, r, T, n) {
  const steps = Math.min(T, 20);
  let rows = '';
  for (let i = 1; i <= steps; i++) {
    const A = P * Math.pow(1 + r / n, n * i);
    const interest = A - P;
    rows += `<tr><td>${i}. Yıl</td><td>${P.toLocaleString('tr-TR')}</td><td>${interest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td><td>${A.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td></tr>`;
  }
  document.getElementById('compound-table').innerHTML = rows;
}

// ===== Tool: Savings Account =====

function calcSavings() {
  hideError('interest-error');
  const P = parseFloat(document.getElementById('sa-initial').value) || 0;
  const M = parseFloat(document.getElementById('sa-monthly').value);
  const R = parseFloat(document.getElementById('sa-rate').value);
  const months = parseInt(document.getElementById('sa-months').value);
  const n = parseInt(document.getElementById('sa-freq').value);

  if (isNaN(M) || isNaN(R) || isNaN(months)) {
    showError('interest-error', 'Lütfen tüm alanları doldurun.');
    return;
  }

  const monthlyRate = R / 100 / 12;
  let balance = P;
  let totalContrib = P;
  let totalInterest = 0;
  let rows = '';

  for (let i = 1; i <= months; i++) {
    balance += M;
    totalContrib += M;
    const interest = balance * monthlyRate;
    balance += interest;
    totalInterest += interest;

    rows += `<tr>
      <td>${i}. Ay</td>
      <td>${M.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
      <td>${totalContrib.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
      <td>${totalInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
      <td><strong>${balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong></td>
    </tr>`;
  }

  document.getElementById('sa-result').innerHTML =
    `<div>Toplam Katkı: <strong>${totalContrib.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong></div>
     <div>Kazanılan Faiz: <strong>${totalInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong></div>
     <div>Son Bakiye: <strong>${balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong></div>`;

  document.getElementById('savings-table').innerHTML = rows;
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

// ===== Init =====

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  buildNav();
  initSearch();
  initColorPicker();
  initTabs('interest-tabs');

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
