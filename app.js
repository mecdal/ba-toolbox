// app.js — Sprint 5a Faz 1: now an ES module loaded from src/main.js.
// During the modularization sprint this monolithic file is being whittled down,
// one feature group at a time, into src/core/* and src/tools/*. Inline HTML
// handlers (onclick="…") still drive most interactions, so the public functions
// listed at the bottom of this file are bridged onto `window` for compatibility.
//
// Faz 1 extracts: storage helpers + i18n core + translations (TR/EN).

import { storageGet, storageSet } from './src/core/storage.js';
import {
  t,
  applyDomI18n,
  setLang,
  getLang,
  groupKeyMap,
} from './src/i18n/index.js';

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

function setEmptyState(elId, isEmpty) {
  const el = document.getElementById(elId);
  if (el) el.classList.toggle('visible', !!isEmpty);
}

// ===== Theme =====

function initTheme() {
  const saved = storageGet('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  storageSet('theme', next);
  updateThemeBtn(next);
}

function updateThemeBtn(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? t('theme.light') : t('theme.dark');
}

// ===== Language / i18n =====
//
// Translations + the t/setLang/getLang/applyDomI18n primitives now live in
// src/i18n/. The wrappers below add tool-specific refreshes (cheatsheets, word
// counter, loan headers) on top of applyDomI18n. They will move to per-tool
// post-apply hooks during Phase 3 of the modularization sprint.

function applyLang() {
  applyDomI18n();
  // Refresh nav group labels (built dynamically; their data-i18n key is
  // tracked on data-group-key, which i18n core doesn't know about).
  document.querySelectorAll('.tool-group-label').forEach((el) => {
    const key = el.dataset.groupKey;
    if (key) el.textContent = t(key);
  });
  // Refresh sidebar tool labels (TR/EN are stored on the tool object).
  document.querySelectorAll('.tool-nav-item').forEach((el) => {
    const tool = tools.find((t2) => t2.id === el.dataset.tool);
    if (!tool) return;
    const label = (getLang() === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
    el.querySelector('span:last-child').textContent = label;
  });
  // Update topbar title if a tool is currently active.
  const activeItem = document.querySelector('.tool-nav-item.active');
  if (activeItem) {
    const tool = tools.find((t2) => t2.id === activeItem.dataset.tool);
    if (tool) {
      const label = (getLang() === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
      document.getElementById('topbar-title').textContent = label;
    }
  }
  // Theme button text depends on current theme + language; updateThemeBtn picks the right key.
  updateThemeBtn(document.documentElement.getAttribute('data-theme'));
  // Tool-specific re-renders that consult t() at draw time.
  buildSqlCheatsheet();
  buildKqlCheatsheet();
  if (typeof filterHttpStatus === 'function' && document.getElementById('http-status-list')) filterHttpStatus();
  if (document.getElementById('wc-input') && document.getElementById('wc-input').value) {
    countWords();
  }
  // Loan amortization table headers (rendered statically in HTML once but with i18n keys).
  const loanTh = document.querySelectorAll('#panel-loan-calc thead th');
  const loanHeaders = ['loan.th.month', 'loan.th.installment', 'loan.th.principal', 'loan.th.interest', 'loan.th.remaining'];
  loanTh.forEach((th, i) => { if (loanHeaders[i]) th.textContent = t(loanHeaders[i]); });
}

function toggleLang() {
  setLang(getLang() === 'tr' ? 'en' : 'tr');
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
      const displayLabel = (getLang() === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
      item.innerHTML = `<span class="icon">${tool.icon}</span><span>${displayLabel}</span>`;
      item.addEventListener('click', () => navigate(tool.id));
      list.appendChild(item);
    });
  });
}

// ===== Tab System =====

const MAX_TABS = 5;
let tabs = [];       // ordered list of open tool IDs
let activeTab = null;

function renderTabs() {
  const bar = document.getElementById('tab-bar');
  if (!bar) return;
  bar.style.display = tabs.length > 0 ? 'flex' : 'none';
  bar.innerHTML = tabs.map(id => {
    const tool = tools.find(t2 => t2.id === id);
    if (!tool) return '';
    const label = (getLang() === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
    const isActive = id === activeTab;
    const closeAria = `${t('aria.tab-close')}: ${label}`;
    return `<div class="tab${isActive ? ' active' : ''}" data-tool="${id}" role="tab" aria-selected="${isActive}" tabindex="0" onclick="switchTab('${id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();switchTab('${id}')}">
      <span class="tab-icon" aria-hidden="true">${tool.icon}</span>
      <span class="tab-label">${label}</span>
      <button class="tab-close" type="button" aria-label="${closeAria}" title="${closeAria}" onclick="event.stopPropagation();closeTab('${id}')">×</button>
    </div>`;
  }).join('') + (tabs.length >= MAX_TABS
    ? `<div class="tab-limit-hint" id="tab-limit-hint" style="display:none">MAX ${MAX_TABS}</div>`
    : '');
}

function openTab(toolId) {
  if (tabs.includes(toolId)) {
    switchTab(toolId);
    return;
  }
  if (tabs.length >= MAX_TABS) {
    // Flash the limit hint briefly
    const hint = document.getElementById('tab-limit-hint');
    if (hint) {
      hint.style.display = 'flex';
      clearTimeout(hint._timer);
      hint._timer = setTimeout(() => { hint.style.display = 'none'; }, 1800);
    }
    return;
  }
  tabs = [...tabs, toolId];
  switchTab(toolId);
}

function switchTab(toolId) {
  activeTab = toolId;
  renderTabs();

  // Activate correct panel
  document.querySelectorAll('.tool-panel').forEach(el => el.classList.remove('active'));
  const panel = document.getElementById('panel-' + toolId);
  if (panel) panel.classList.add('active');

  // Sync sidebar highlight
  document.querySelectorAll('.tool-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tool === toolId);
  });

  // Update topbar title
  const tool = tools.find(t2 => t2.id === toolId);
  if (tool) {
    const label = (getLang() === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
    document.getElementById('topbar-title').textContent = label;
  }

  // Hide welcome
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.style.display = 'none';

  window.location.hash = toolId;
  saveRecent(toolId);

  if (toolId === 'bpmn-modeler') initBpmn();
}

function closeTab(toolId) {
  const idx = tabs.indexOf(toolId);
  const newTabs = tabs.filter(id => id !== toolId);
  tabs = newTabs;

  if (activeTab === toolId) {
    if (tabs.length > 0) {
      // Switch to the nearest tab
      switchTab(tabs[Math.min(idx, tabs.length - 1)]);
    } else {
      activeTab = null;
      renderTabs();
      document.querySelectorAll('.tool-panel').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tool-nav-item').forEach(el => el.classList.remove('active'));
      const welcome = document.getElementById('welcome');
      if (welcome) welcome.style.display = '';
      const titleEl = document.getElementById('topbar-title');
      titleEl.textContent = t('topbar.welcome');
      window.location.hash = '';
    }
  } else {
    renderTabs();
  }
}

function navigate(toolId) {
  openTab(toolId);
}

function saveRecent(toolId) {
  let recents = JSON.parse(storageGet('recents') || '[]');
  recents = [toolId, ...recents.filter(r => r !== toolId)].slice(0, 5);
  storageSet('recents', JSON.stringify(recents));
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

function removeNullsDeep(value) {
  if (Array.isArray(value)) {
    return value
      .filter(item => item !== null)
      .map(item => removeNullsDeep(item));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== null)
        .map(([k, v]) => [k, removeNullsDeep(v)])
    );
  }
  return value;
}

function jsonRemoveNulls() {
  hideError('json-error');
  try {
    const input = document.getElementById('json-input').value.trim();
    if (!input) return;
    const parsed = JSON.parse(input);
    const cleaned = removeNullsDeep(parsed);
    document.getElementById('json-output').value = JSON.stringify(cleaned, null, 2);
    document.getElementById('json-status').textContent = t('json.valid');
    document.getElementById('json-status').style.color = 'var(--success)';
    if (jsonViewMode === 'tree') {
      document.getElementById('json-tree-output').innerHTML = renderJsonTree(cleaned, '', true);
      setEmptyState('json-tree-empty', false);
    }
  } catch (e) {
    showError('json-error', t('json.error') + e.message);
    document.getElementById('json-status').textContent = t('json.invalid');
    document.getElementById('json-status').style.color = 'var(--error)';
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

// ===== JSON Formatter: Tree View =====

let jsonViewMode = 'raw';

function setJsonView(mode) {
  jsonViewMode = mode;
  document.getElementById('json-raw-view').style.display = mode === 'raw' ? '' : 'none';
  document.getElementById('json-tree-view').style.display = mode === 'tree' ? '' : 'none';
  document.getElementById('json-view-raw').classList.toggle('active', mode === 'raw');
  document.getElementById('json-view-tree').classList.toggle('active', mode === 'tree');
  if (mode === 'tree') refreshJsonTree();
}

function refreshJsonTree() {
  const container = document.getElementById('json-tree-output');
  try {
    const input = document.getElementById('json-input').value.trim();
    if (!input) { container.innerHTML = ''; setEmptyState('json-tree-empty', true); return; }
    const parsed = JSON.parse(input);
    container.innerHTML = renderJsonTree(parsed, '', true);
    setEmptyState('json-tree-empty', false);
  } catch (e) {
    container.innerHTML = '<span style="color:var(--error)">Invalid JSON</span>';
    setEmptyState('json-tree-empty', false);
  }
}

function renderJsonTree(data, key, isRoot) {
  if (data === null) return wrapTreeLeaf(key, '<span class="json-tree-null">null</span>');
  if (typeof data === 'boolean') return wrapTreeLeaf(key, `<span class="json-tree-bool">${data}</span>`);
  if (typeof data === 'number') return wrapTreeLeaf(key, `<span class="json-tree-number">${data}</span>`);
  if (typeof data === 'string') return wrapTreeLeaf(key, `<span class="json-tree-string">"${escapeHtml(data)}"</span>`);

  const isArray = Array.isArray(data);
  const entries = isArray ? data.map((v, i) => [i, v]) : Object.entries(data);
  const openBr = isArray ? '[' : '{';
  const closeBr = isArray ? ']' : '}';
  const count = entries.length;

  const keyHtml = key !== '' ? `<span class="json-tree-key">"${escapeHtml(String(key))}"</span>: ` : '';
  const summaryLabel = `${keyHtml}<span class="json-tree-bracket">${openBr}</span> <span style="color:var(--text-muted);font-size:11px;">${count} ${isArray ? 'items' : 'keys'}</span>`;

  let children = '';
  for (const [k, v] of entries) {
    children += renderJsonTree(v, String(k), false);
  }

  return `<details${isRoot ? ' open' : ''}>
    <summary>${summaryLabel}</summary>
    ${children}
    <div><span class="json-tree-bracket">${closeBr}</span></div>
  </details>`;
}

function wrapTreeLeaf(key, valueHtml) {
  const keyHtml = key !== '' ? `<span class="json-tree-key">"${escapeHtml(String(key))}"</span>: ` : '';
  return `<div style="margin-left:16px;">${keyHtml}${valueHtml}</div>`;
}

// Tree search (debounced to avoid re-walking the DOM on every keystroke)
function debounce(fn, delay) {
  let timer = null;
  return function debounced(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('json-tree-search');
  if (searchInput) {
    const debouncedSearch = debounce(function(value) {
      searchJsonTree(value);
    }, 200);
    searchInput.addEventListener('input', function() {
      debouncedSearch(this.value.trim().toLowerCase());
    });
  }
});

function searchJsonTree(query) {
  const container = document.getElementById('json-tree-output');
  // Remove existing highlights
  container.querySelectorAll('.json-tree-highlight').forEach(el => {
    el.replaceWith(el.textContent);
  });
  if (!query) return;

  // Highlight matching text in keys and values
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const matches = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.textContent.toLowerCase().includes(query)) {
      matches.push(node);
    }
  }
  for (const node of matches) {
    const text = node.textContent;
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) continue;
    const span = document.createElement('span');
    span.className = 'json-tree-highlight';
    span.textContent = text.substring(idx, idx + query.length);
    const after = document.createTextNode(text.substring(idx + query.length));
    const before = document.createTextNode(text.substring(0, idx));
    const parent = node.parentNode;
    parent.insertBefore(before, node);
    parent.insertBefore(span, node);
    parent.insertBefore(after, node);
    parent.removeChild(node);
    // Expand parent details
    let el = span.closest('details');
    while (el) { el.open = true; el = el.parentElement?.closest('details'); }
  }
}

// Override beautify to also update tree
const _origBeautify = jsonBeautify;
jsonBeautify = function() {
  _origBeautify();
  if (jsonViewMode === 'tree') refreshJsonTree();
};

// ===== Tool: UUID Generator =====

function uuidv4Fallback() {
  // RFC 4122 v4 — used when crypto.randomUUID() is unavailable (non-secure context, older browsers).
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function generateOneUUID() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch { /* secure-context guard threw; fall through */ }
  return uuidv4Fallback();
}

function generateUUIDs() {
  const count = parseInt(document.getElementById('uuid-count').value) || 1;
  const clamped = Math.max(1, Math.min(100, count));
  const uuids = Array.from({ length: clamped }, generateOneUUID);
  document.getElementById('uuid-output').value = uuids.join('\n');
}

// ===== Tool: Interest Calculator — Tax Helpers =====

function onTaxChange(prefix) {
  const val = document.getElementById(prefix + '-tax').value;
  document.getElementById(prefix + '-tax-tr').style.display = val === 'tr' ? 'block' : 'none';
  document.getElementById(prefix + '-tax-de').style.display = val === 'de' ? 'block' : 'none';
  const customEl = document.getElementById(prefix + '-tax-custom');
  if (customEl) customEl.style.display = val === 'custom' ? 'block' : 'none';
}

// ===== Currency Config =====
const currencyConfigs = {
  TRY: { symbol: '₺', locale: 'tr-TR' },
  EUR: { symbol: '€', locale: 'de-DE' },
  USD: { symbol: '$', locale: 'en-US' },
  GBP: { symbol: '£', locale: 'en-GB' }
};

function getCurrencyConfig(selectorId) {
  const code = document.getElementById(selectorId)?.value || 'TRY';
  return { code, ...currencyConfigs[code] };
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
  if (country === 'custom') {
    const rate = parseFloat(document.getElementById(prefix + '-custom-rate').value) / 100 || 0.20;
    return { country: 'custom', customRate: rate };
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
    const breakdown = [{ label: `🇩🇪 Abgeltungssteuer (${(abgeltRate * 100).toFixed(3)}%)`, amount: abgelt }];
    if (soli > 0) breakdown.push({ label: `${t('interest.de.soli')}`, amount: soli });
    if (kist > 0) breakdown.push({ label: `${t('interest.de.kist')} (${(ts.kiStRate * 100).toFixed(1)}%)`, amount: kist });
    return { totalTax, netInterest: grossInterest - totalTax, breakdown };
  }

  if (ts.country === 'custom') {
    const tax = grossInterest * ts.customRate;
    return {
      totalTax: tax, netInterest: grossInterest - tax,
      breakdown: [{ label: `${t('interest.tax.custom')} (${(ts.customRate * 100).toFixed(1)}%)`, amount: tax }]
    };
  }

  return { totalTax: 0, netInterest: grossInterest, breakdown: [] };
}

function renderInterestResult(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const cur = data.currency || { symbol: '₺', locale: 'tr-TR' };
  const fmt = n => Math.abs(n).toLocaleString(cur.locale, { minimumFractionDigits: 2 });
  let html = `<div class="irc-row irc-header"><span>${t('interest.result.title')}</span></div>`;
  html += `<div class="irc-row"><span>${data.principalLabel || t('interest.principal.label')}</span><span class="irc-val">${cur.symbol} ${fmt(data.principal)}</span></div>`;
  html += `<div class="irc-row"><span>${t('interest.gross')}</span><span class="irc-val positive">+ ${cur.symbol} ${fmt(data.grossInterest)}</span></div>`;
  if (data.breakdown && data.breakdown.length > 0) {
    data.breakdown.forEach(b => {
      html += `<div class="irc-row irc-tax"><span>${b.label}</span><span class="irc-val negative">− ${cur.symbol} ${fmt(b.amount)}</span></div>`;
    });
    html += `<div class="irc-row"><span>${t('interest.net')}</span><span class="irc-val positive">+ ${cur.symbol} ${fmt(data.netInterest)}</span></div>`;
  }
  html += `<div class="irc-row irc-total"><span>${t('interest.total')}</span><span class="irc-val total">${cur.symbol} ${fmt(data.total)}</span></div>`;
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

  const cur = getCurrencyConfig('si-currency');
  renderInterestResult('si-result-card', { principal: P, grossInterest, breakdown: tax.breakdown, netInterest: tax.netInterest, total: P + tax.netInterest, currency: cur });
}

// ===== Tool: Timestamp =====

function tsISOWeek(d) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
}

function tsRelative(ms) {
  const diff = Date.now() - ms;
  const abs  = Math.abs(diff);
  const future = diff < 0;
  const slots = [
    { u: 'year',   ms: 31536000000 },
    { u: 'month',  ms: 2592000000  },
    { u: 'day',    ms: 86400000    },
    { u: 'hour',   ms: 3600000     },
    { u: 'minute', ms: 60000       },
    { u: 'second', ms: 1000        },
  ];
  for (const { u, ms: unit } of slots) {
    const n = Math.floor(abs / unit);
    if (n >= 1) {
      const label = n === 1 ? u : u + 's';
      return future ? `in ${n} ${label}` : `${n} ${label} ago`;
    }
  }
  return 'just now';
}

function tsToDate() {
  const raw = document.getElementById('ts-input').value.trim();
  const out = document.getElementById('ts-result');
  if (!raw || isNaN(raw)) { out.innerHTML = t('ts.invalid'); return; }

  const unitInput = document.querySelector('input[name="ts-unit"]:checked');
  const unit = unitInput ? unitInput.value : 'auto';
  const num = parseInt(raw, 10);
  let ms;
  if (unit === 's') ms = num * 1000;
  else if (unit === 'ms') ms = num;
  // 'auto': prefer length-based heuristic, but fall back to magnitude so timestamps near year 3000 still classify.
  else ms = (raw.length >= 13 || num >= 1e12) ? num : num * 1000;
  const d  = new Date(ms);
  if (isNaN(d.getTime())) { out.innerHTML = t('ts.invalid'); return; }

  const pad = n => String(n).padStart(2, '0');
  const Y = d.getUTCFullYear(), M = pad(d.getUTCMonth() + 1), D = pad(d.getUTCDate());
  const h = pad(d.getUTCHours()), m = pad(d.getUTCMinutes()), s = pad(d.getUTCSeconds());

  const formats = [
    { label: 'Local',        value: d.toLocaleString(getLang() === 'tr' ? 'tr-TR' : 'en-GB') },
    { label: 'UTC',          value: d.toUTCString() },
    { label: 'ISO 8601',     value: d.toISOString() },
    { label: 'SQL Date',     value: `${Y}-${M}-${D}` },
    { label: 'SQL DateTime', value: `${Y}-${M}-${D} ${h}:${m}:${s}` },
    { label: 'Day of Week',  value: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
    { label: 'ISO Week',     value: `Week ${tsISOWeek(d)}, ${Y}` },
    { label: 'Relative',     value: tsRelative(ms) },
    { label: 'Unix (s)',     value: String(Math.floor(ms / 1000)) },
    { label: 'Unix (ms)',    value: String(ms) },
  ];

  out.innerHTML = formats.map(f =>
    `<div class="ts-row">
       <span class="ts-label">${f.label}</span>
       <span class="ts-value">${escapeHtml(f.value)}</span>
       <button class="btn ts-copy" data-value="${escapeHtml(f.value)}" onclick="copyToClipboard(this.dataset.value,this)">Copy</button>
     </div>`
  ).join('');
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

// Use TextEncoder/TextDecoder for full UTF-8 round-trips (emoji, surrogate pairs, rare scripts).
// The legacy unescape(encodeURIComponent(...)) trick mishandles some code points and is deprecated.
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToUtf8(b64) {
  // Tolerate base64url and missing padding (common in JWTs and copy/pasted tokens).
  const normalized = b64.trim().replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

function base64Encode() {
  hideError('base64-error');
  try {
    const input = document.getElementById('b64-raw').value;
    document.getElementById('b64-encoded').value = utf8ToBase64(input);
  } catch (e) {
    showError('base64-error', t('b64.error.encode') + e.message);
  }
}

function base64Decode() {
  hideError('base64-error');
  try {
    const input = document.getElementById('b64-encoded').value;
    document.getElementById('b64-raw').value = base64ToUtf8(input);
  } catch (e) {
    showError('base64-error', t('b64.error.decode'));
  }
}

// ===== Tool: CSV to JSON =====

/**
 * RFC 4180-compliant CSV parser. Handles:
 *  - Quoted fields (commas / delimiters inside quotes)
 *  - Escaped quotes inside quoted fields ("" -> ")
 *  - CRLF / LF / CR line endings
 *  - Multiline fields when wrapped in quotes
 * @param {string} text - raw CSV input
 * @param {string} delimiter - field separator (default ',')
 * @returns {string[][]} array of rows, each row an array of cell strings
 */
function parseCSV(text, delimiter) {
  const sep = (delimiter || ',').charAt(0) || ',';
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQuotes = false;
  const n = text.length;

  while (i < n) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === sep) { row.push(field); field = ''; i++; continue; }
    if (ch === '\r') {
      // Treat CRLF as one terminator
      row.push(field); field = ''; rows.push(row); row = [];
      if (text[i + 1] === '\n') i++;
      i++; continue;
    }
    if (ch === '\n') {
      row.push(field); field = ''; rows.push(row); row = [];
      i++; continue;
    }
    field += ch; i++;
  }
  // Flush trailing field/row (no final newline case)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop fully-empty trailing rows
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }
  return rows;
}

function csvToJson() {
  hideError('csv-error');
  try {
    const input = document.getElementById('csv-input').value;
    if (!input.trim()) return;
    const hasHeaders = document.getElementById('csv-headers').checked;
    const delimiter = document.getElementById('csv-delimiter').value || ',';

    const rows = parseCSV(input, delimiter);
    if (rows.length === 0) { document.getElementById('csv-output').value = '[]'; return; }

    let result;
    if (hasHeaders) {
      const headers = rows[0];
      result = rows.slice(1).map(vals => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = vals[i] ?? '');
        return obj;
      });
    } else {
      result = rows;
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

// Replace string literals, quoted identifiers, and comments with placeholders so the formatter
// only touches actual SQL keywords. Restored after newline insertion.
function maskSqlLiterals(sql) {
  const literals = [];
  const masked = sql.replace(
    // single-quoted strings (with doubled-quote escapes), double-quoted identifiers,
    // backtick identifiers, line comments, block comments
    /'(?:[^']|'')*'|"(?:[^"]|"")*"|`(?:[^`]|``)*`|--[^\n]*|\/\*[\s\S]*?\*\//g,
    (match) => {
      const token = `SQLLIT${literals.length}`;
      literals.push(match);
      return token;
    }
  );
  return { masked, literals };
}

function unmaskSqlLiterals(text, literals) {
  return text.replace(/SQLLIT(\d+)/g, (_, idx) => literals[Number(idx)]);
}

function formatSQL() {
  const input = document.getElementById('sql-input').value;

  // Mask literals so 'SELECT' inside a string doesn't get reformatted.
  const { masked, literals } = maskSqlLiterals(input);

  let sql = masked.replace(/\s+/g, ' ').trim();
  sql = sql.toUpperCase();

  const newlineKeywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
    'INNER JOIN', 'ON', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'UNION', 'UNION ALL'];

  newlineKeywords.forEach(kw => {
    sql = sql.replace(new RegExp(`\\b${kw}\\b`, 'g'), '\n' + kw);
  });

  sql = sql.replace(/,\s*/g, ',\n    ');
  sql = unmaskSqlLiterals(sql, literals);
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
    // base64url -> utf-8 -> JSON (padding-safe via base64ToUtf8 helper)
    const decode = str => JSON.parse(base64ToUtf8(str));
    const header = decode(parts[0]);
    const payload = decode(parts[1]);

    document.getElementById('jwt-header').value = JSON.stringify(header, null, 2);
    document.getElementById('jwt-payload').value = JSON.stringify(payload, null, 2);

    if (payload.exp) {
      const exp = new Date(payload.exp * 1000);
      const expired = exp < new Date();
      const locale = getLang() === 'tr' ? 'tr-TR' : 'en-GB';
      const status = expired ? `❌ ${t('jwt.exp.expired')}` : `✅ ${t('jwt.exp.valid')}`;
      document.getElementById('jwt-exp').textContent =
        `${t('jwt.exp.label')}: ${exp.toLocaleString(locale)} — ${status}`;
    } else {
      document.getElementById('jwt-exp').textContent = t('jwt.exp.none');
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
    const isArr = Array.isArray(val);
    const count = isArr ? val.length : Object.keys(val).length;
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.className = 'json-grid-nested';
    summary.style.cursor = 'pointer';
    summary.textContent = isArr
      ? `[${count} ${getLang() === 'en' ? 'item' : 'öğe'}]`
      : `{${count} ${getLang() === 'en' ? 'field' : 'alan'}}`;
    details.appendChild(summary);
    details.appendChild(buildGridNode(val, depth + 1));
    if (depth < 1) details.open = true;
    td.appendChild(details);
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
  // JSON.stringify wraps with outer quotes — strip them to give just the escaped content
  document.getElementById('json-escape-output').value = JSON.stringify(input).slice(1, -1);
}

function jsonUnescapeStr() {
  hideError('json-escape-error');
  const raw = document.getElementById('json-escape-output').value.trim();
  if (!raw) return;
  // Wrap in quotes if not already present, so JSON.parse can handle bare escaped strings
  const toparse = (raw.startsWith('"') && raw.endsWith('"')) ? raw : '"' + raw + '"';
  try {
    const parsed = JSON.parse(toparse);
    document.getElementById('json-escape-input').value = parsed;
  } catch (e) {
    showError('json-escape-error', t('json-esc.error') + e.message);
  }
}

function jsonSwap() {
  const top = document.getElementById('json-escape-input');
  const bot = document.getElementById('json-escape-output');
  const tmp = top.value;
  top.value = bot.value;
  bot.value = tmp;
  hideError('json-escape-error');
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

// Deep equality check used by the LCS array-diff matcher.
function deepEquals(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEquals(a[i], b[i])) return false;
    return true;
  }
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!deepEquals(a[k], b[k])) return false;
  return true;
}

// Longest Common Subsequence over two arrays — same shape used by Git/Diff tools.
// Returns a script of {type: 'eq'|'add'|'del', li, ri} steps, where li/ri are indices in left/right.
function lcsArrayDiff(left, right) {
  const n = left.length, m = right.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = deepEquals(left[i], right[j])
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const script = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (deepEquals(left[i], right[j])) { script.push({ type: 'eq',  li: i,    ri: j    }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { script.push({ type: 'del', li: i,    ri: null }); i++; }
    else                                     { script.push({ type: 'add', li: null, ri: j    }); j++; }
  }
  while (i < n) script.push({ type: 'del', li: i++, ri: null });
  while (j < m) script.push({ type: 'add', li: null, ri: j++ });
  return script;
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
    // LCS-based diffing: an insertion at index 0 no longer cascades a "changed" verdict
    // across every subsequent element.
    const script = lcsArrayDiff(left, right);
    for (const step of script) {
      if (step.type === 'eq') continue;
      if (step.type === 'add') {
        diffs.push({ type: 'added',   path: `${path}[+${step.ri}]`, right: right[step.ri] });
      } else if (step.type === 'del') {
        diffs.push({ type: 'removed', path: `${path}[-${step.li}]`, left:  left[step.li] });
      }
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
    h4.textContent = (getLang() === 'en' && cat.categoryEn) ? cat.categoryEn : cat.category;
    h4.style.cssText = 'font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border);';
    section.appendChild(h4);
    const grid = document.createElement('div');
    grid.className = 'sql-template-grid';

    cat.templates.forEach(tmpl => {
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

// Provider chain: try TinyURL first, fall back to is.gd. Each call is bounded by an AbortController
// so a hung provider doesn't lock the UI.
async function fetchShortUrl(provider, originalUrl, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(provider.endpoint(originalUrl), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`${provider.name} HTTP ${res.status}`);
    const text = (await res.text()).trim();
    if (!text.startsWith('http')) throw new Error(`${provider.name}: unexpected response`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function shortenUrl() {
  hideError('url-short-error');
  const url = document.getElementById('url-short-input').value.trim();
  const btn = document.getElementById('url-short-btn');
  if (!url) return;
  try { new URL(url); } catch {
    showError('url-short-error', t('url-short.error.invalid'));
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    showError('url-short-error', t('url-short.error.offline'));
    return;
  }
  const resultEl = document.getElementById('url-short-result');
  const outputEl = document.getElementById('url-short-output');
  resultEl.style.display = 'none';

  // Disable button to prevent double-submits / race conditions
  if (btn) { btn.disabled = true; btn.classList.add('btn-loading'); }

  const providers = [
    { name: 'TinyURL', endpoint: u => `https://tinyurl.com/api-create.php?url=${encodeURIComponent(u)}` },
    { name: 'is.gd',   endpoint: u => `https://is.gd/create.php?format=simple&url=${encodeURIComponent(u)}` },
  ];

  const errors = [];
  try {
    for (const provider of providers) {
      try {
        const shortUrl = await fetchShortUrl(provider, url, 8000);
        outputEl.textContent = shortUrl;
        outputEl.href = shortUrl;
        resultEl.style.display = 'block';
        return;
      } catch (e) {
        errors.push(e && e.name === 'AbortError' ? `${provider.name}: timeout` : (e.message || String(e)));
      }
    }
    showError('url-short-error', `${t('url-short.error.failed')}${errors.join(' · ')}`);
  } finally {
    if (btn) { btn.disabled = false; btn.classList.remove('btn-loading'); }
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
  const cur = getCurrencyConfig('loan-currency');
  const fmt = n => n.toLocaleString(cur.locale, { minimumFractionDigits: 2 });

  const cardEl = document.getElementById('loan-result-card');
  let html = `<div class="irc-row irc-header"><span>${t('loan.result.title')}</span></div>`;
  html += `<div class="irc-row"><span>${t('loan.amount.label')}</span><span class="irc-val">${cur.symbol} ${fmt(P)}</span></div>`;
  html += `<div class="irc-row"><span>${t('loan.monthly')}</span><span class="irc-val total">${cur.symbol} ${fmt(monthlyPayment)}</span></div>`;
  html += `<div class="irc-row"><span>${t('loan.total.payment')}</span><span class="irc-val">${cur.symbol} ${fmt(totalPayment)}</span></div>`;
  html += `<div class="irc-row irc-tax"><span>${t('loan.total.interest')}</span><span class="irc-val negative">− ${cur.symbol} ${fmt(totalInterest)}</span></div>`;
  html += `<div class="irc-row irc-total"><span>${t('loan.interest.ratio')}</span><span class="irc-val total">${((totalInterest / P) * 100).toFixed(1)}%</span></div>`;
  cardEl.innerHTML = html;
  cardEl.style.display = 'block';

  // Build amortization with cent-precision rounding. Final installment absorbs the rounding drift
  // so the closing balance is exactly 0.00 — matches what banks print on schedules.
  const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
  let remaining = round2(P);
  let rows = '';
  for (let i = 1; i <= months; i++) {
    const isLast = i === months;
    let interestPayment = round2(remaining * r);
    let principalPayment = round2(monthlyPayment - interestPayment);
    let installment = round2(interestPayment + principalPayment);
    if (isLast) {
      // Settle whatever cents are left on the final row.
      principalPayment = round2(remaining);
      installment = round2(principalPayment + interestPayment);
      remaining = 0;
    } else {
      remaining = round2(Math.max(0, remaining - principalPayment));
    }
    rows += `<tr><td>${i}</td><td>${fmt(installment)}</td><td>${fmt(principalPayment)}</td><td style="color:var(--error);">${fmt(interestPayment)}</td><td><strong>${fmt(remaining)}</strong></td></tr>`;
  }
  document.getElementById('loan-table').innerHTML = rows;
  document.getElementById('loan-table-wrap').style.display = '';
  setEmptyState('loan-empty', false);
}

// ===== User Story Writer =====

let acCount = 0;
let checklistCount = 0;
let acMode = 'gherkin';

function setAcMode(mode) {
  acMode = mode;
  document.getElementById('ac-gherkin-mode').style.display = mode === 'gherkin' ? '' : 'none';
  document.getElementById('ac-checklist-mode').style.display = mode === 'checklist' ? '' : 'none';
  document.getElementById('ac-mode-gherkin').classList.toggle('active', mode === 'gherkin');
  document.getElementById('ac-mode-checklist').classList.toggle('active', mode === 'checklist');
}

function addAcBlock() {
  acCount++;
  const n = acCount;
  const list = document.getElementById('ac-list');
  const block = document.createElement('div');
  block.className = 'ac-block';
  block.dataset.ac = n;
  block.innerHTML = `
    <div class="ac-block-title">${t('us.ac-label')} #${n}</div>
    <button class="ac-remove" onclick="removeAcBlock(${n})" title="Kaldır">✕</button>
    <div class="ac-row">
      <label>${t('us.given')}</label>
      <input type="text" id="us-given-${n}" placeholder="${t('us.given.ph')}">
    </div>
    <div class="ac-row">
      <label>${t('us.when')}</label>
      <input type="text" id="us-when-${n}" placeholder="${t('us.when.ph')}">
    </div>
    <div class="ac-row">
      <label>${t('us.then')}</label>
      <input type="text" id="us-then-${n}" placeholder="${t('us.then.ph')}">
    </div>`;
  list.appendChild(block);
}

function removeAcBlock(n) {
  const block = document.querySelector(`.ac-block[data-ac="${n}"]`);
  if (block) block.remove();
}

function addChecklistItem() {
  checklistCount++;
  const n = checklistCount;
  const list = document.getElementById('ac-checklist-list');
  const item = document.createElement('div');
  item.className = 'checklist-item';
  item.dataset.cl = n;
  item.innerHTML = `
    <input type="text" id="us-cl-${n}" data-i18n-placeholder="us.checklist-item.ph" placeholder="${t('us.checklist-item.ph') || 'Kabul kriteri...'}">
    <button class="ac-remove" onclick="removeChecklistItem(${n})" title="Kaldır">✕</button>`;
  list.appendChild(item);
}

function removeChecklistItem(n) {
  const item = document.querySelector(`.checklist-item[data-cl="${n}"]`);
  if (item) item.remove();
}

function toggleInvest(btn) {
  btn.classList.toggle('active');
  const score = document.querySelectorAll('.invest-chip.active').length;
  const scoreEl = document.getElementById('invest-score');
  scoreEl.textContent = `${score}/6`;
  scoreEl.className = 'invest-score ' + (score < 4 ? 'low' : score < 6 ? 'mid' : 'high');
}

function getInvestScore() {
  const chips = document.querySelectorAll('.invest-chip.active');
  return Array.from(chips).map(c => c.dataset.invest).join('');
}

function buildUserStory() {
  const storyId = document.getElementById('us-story-id').value.trim();
  const storyTitle = document.getElementById('us-story-title').value.trim();
  const epic = document.getElementById('us-epic').value.trim();
  const priority = document.getElementById('us-priority').value;
  const points = document.getElementById('us-points').value;
  const role = document.getElementById('us-role').value.trim();
  const action = document.getElementById('us-action').value.trim();
  const benefit = document.getElementById('us-benefit').value.trim();

  if (!role && !action && !benefit) return;

  let text = '';

  // Header
  if (storyId || storyTitle) {
    text += `${storyId ? '[' + storyId + '] ' : ''}${storyTitle || ''}\n`;
  }
  if (epic) text += `Epic: ${epic}\n`;
  if (priority) {
    const pMap = { must: 'Must Have', should: 'Should Have', could: 'Could Have', wont: "Won't Have" };
    text += `Priority: ${pMap[priority] || priority}\n`;
  }
  if (points) text += `Story Points: ${points}\n`;
  if (storyId || storyTitle || epic || priority || points) text += '\n';

  // Core story
  text += `As a ${role || '...'},\nI want to ${action || '...'},\nSo that ${benefit || '...'}.`;

  // AC
  if (acMode === 'gherkin') {
    const blocks = document.querySelectorAll('#ac-list .ac-block');
    if (blocks.length > 0) {
      text += '\n\nAcceptance Criteria:';
      blocks.forEach(block => {
        const n = block.dataset.ac;
        const given = document.getElementById(`us-given-${n}`)?.value.trim() || '...';
        const when  = document.getElementById(`us-when-${n}`)?.value.trim()  || '...';
        const then  = document.getElementById(`us-then-${n}`)?.value.trim()  || '...';
        text += `\n  Given ${given},\n  When ${when},\n  Then ${then}.`;
      });
    }
  } else {
    const items = document.querySelectorAll('#ac-checklist-list .checklist-item');
    if (items.length > 0) {
      text += '\n\nAcceptance Criteria:';
      items.forEach(item => {
        const n = item.dataset.cl;
        const val = document.getElementById(`us-cl-${n}`)?.value.trim() || '...';
        text += `\n  [ ] ${val}`;
      });
    }
  }

  // Additional sections
  const rules = document.getElementById('us-business-rules').value.trim();
  const nfr = document.getElementById('us-nfr').value.trim();
  const deps = document.getElementById('us-dependencies').value.trim();
  if (rules) text += `\n\nBusiness Rules:\n${rules}`;
  if (nfr) text += `\n\nNon-Functional Requirements:\n${nfr}`;
  if (deps) text += `\n\nDependencies & Assumptions:\n${deps}`;

  // INVEST
  const invest = getInvestScore();
  if (invest) text += `\n\nINVEST: ${invest} (${invest.length}/6)`;

  // DoD
  const dodItems = document.querySelectorAll('.dod-item');
  const dodChecked = Array.from(dodItems).filter(i => i.checked);
  if (dodChecked.length > 0) {
    text += '\n\nDefinition of Done:';
    dodChecked.forEach(item => {
      text += `\n  [x] ${item.parentElement.textContent.trim()}`;
    });
  }

  const out = document.getElementById('us-output');
  out.value = text;
  document.getElementById('us-output-card').style.display = '';
}

function clearUserStory() {
  ['us-role','us-action','us-benefit','us-story-id','us-story-title','us-epic','us-business-rules','us-nfr','us-dependencies'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('us-priority').value = '';
  document.getElementById('us-points').value = '';
  document.getElementById('ac-list').innerHTML = '';
  document.getElementById('ac-checklist-list').innerHTML = '';
  acCount = 0;
  checklistCount = 0;
  document.querySelectorAll('.invest-chip').forEach(c => c.classList.remove('active'));
  const scoreEl = document.getElementById('invest-score');
  scoreEl.textContent = '0/6';
  scoreEl.className = 'invest-score';
  document.querySelectorAll('.dod-item').forEach(i => { i.checked = false; });
  document.getElementById('us-output').value = '';
  document.getElementById('us-output-card').style.display = 'none';
}

function copyUserStory() {
  const out = document.getElementById('us-output');
  if (!out.value) return;
  navigator.clipboard.writeText(out.value);
}

function copyUserStoryMd() {
  const out = document.getElementById('us-output');
  if (!out.value) return;
  let md = out.value;
  md = md.replace(/^(\[.+?\].*)$/m, '## $1');
  md = md.replace(/^(As a .+)$/m, '**$1**');
  md = md.replace(/^(I want to .+)$/m, '**$1**');
  md = md.replace(/^(So that .+)$/m, '**$1**');
  md = md.replace(/^(Acceptance Criteria:)$/m, '\n### $1');
  md = md.replace(/^(Business Rules:)$/m, '\n### $1');
  md = md.replace(/^(Non-Functional Requirements:)$/m, '\n### $1');
  md = md.replace(/^(Dependencies & Assumptions:)$/m, '\n### $1');
  md = md.replace(/^(Definition of Done:)$/m, '\n### $1');
  md = md.replace(/^  (Given|When|Then) /gm, '- **$1** ');
  md = md.replace(/^  \[( |x)\] /gm, '- [$1] ');
  navigator.clipboard.writeText(md);
}

function copyUserStoryJira() {
  const out = document.getElementById('us-output');
  if (!out.value) return;
  let jira = out.value;
  jira = jira.replace(/^(\[.+?\].*)$/m, 'h2. $1');
  jira = jira.replace(/^(Acceptance Criteria:)$/m, 'h3. $1');
  jira = jira.replace(/^(Business Rules:)$/m, 'h3. $1');
  jira = jira.replace(/^(Non-Functional Requirements:)$/m, 'h3. $1');
  jira = jira.replace(/^(Dependencies & Assumptions:)$/m, 'h3. $1');
  jira = jira.replace(/^(Definition of Done:)$/m, 'h3. $1');
  jira = jira.replace(/^  (Given|When|Then) /gm, '* *$1* ');
  jira = jira.replace(/^  \[( |x)\] /gm, '* ');
  navigator.clipboard.writeText(jira);
}

// ===== Feedback Widget =====

function toggleFeedbackMenu() {
  document.getElementById('feedback-widget').classList.toggle('open');
}

document.addEventListener('click', function(e) {
  const widget = document.getElementById('feedback-widget');
  if (widget && !widget.contains(e.target)) {
    widget.classList.remove('open');
  }
});

// ===== Clear Panel =====

const noClearPanels = new Set(['panel-sql-cheatsheet', 'panel-kql-cheatsheet', 'panel-user-story']);

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
    desc.textContent = (getLang() === 'en' && item.descEn) ? item.descEn : item.desc;
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
    h4.textContent = (getLang() === 'en' && cat.categoryEn) ? cat.categoryEn : cat.category;
    h4.style.cssText = 'font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border);';
    section.appendChild(h4);

    const grid = document.createElement('div');
    grid.className = 'sql-template-grid';

    cat.templates.forEach(tmpl => {
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

  // Sprint 3 tool initial render (so panels aren't blank when first opened)
  if (document.getElementById('http-status-list')) filterHttpStatus();
  if (document.getElementById('regex-pattern')) runRegex();
  if (document.getElementById('md-input')) renderMarkdown();
  // Sprint 4: AC Generator starts with one empty scenario
  if (document.getElementById('ac-scenarios')) addScenario();

  // Register PWA service worker (offline-first cache)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* registration failed; app still works */ });
  }

  // Restore from hash
  const hash = window.location.hash.replace('#', '');
  if (hash && tools.find(t => t.id === hash)) {
    navigate(hash);
  }
});

// ===== Tool: Regex Builder =====

function syncRegexFlags() {
  const flags = ['g','i','m','s']
    .filter(f => document.getElementById(`regex-flag-${f}`).checked)
    .join('');
  document.getElementById('regex-flags').value = flags;
  runRegex();
}

function runRegex() {
  hideError('regex-error');
  const pattern = document.getElementById('regex-pattern').value;
  const flags = document.getElementById('regex-flags').value;
  const sample = document.getElementById('regex-sample').value;
  const highlightEl = document.getElementById('regex-highlight');
  const groupsEl = document.getElementById('regex-groups');
  const statsEl = document.getElementById('regex-stats');

  // Sync flag checkboxes (in case user typed flags directly)
  ['g','i','m','s'].forEach(f => {
    const cb = document.getElementById(`regex-flag-${f}`);
    if (cb) cb.checked = flags.includes(f);
  });

  highlightEl.textContent = sample;
  groupsEl.innerHTML = '';
  statsEl.style.display = 'none';

  if (!pattern) return;

  let regex;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e) {
    showError('regex-error', `${t('regex.error.invalid')}: ${e.message}`);
    return;
  }

  // Collect matches (matchAll requires global flag)
  const matches = [];
  if (flags.includes('g')) {
    for (const m of sample.matchAll(regex)) matches.push(m);
  } else {
    const m = sample.match(regex);
    if (m) matches.push(m);
  }

  // Render highlighted output
  let html = '';
  let cursor = 0;
  for (const m of matches) {
    if (m.index === undefined) continue;
    html += escapeHtml(sample.slice(cursor, m.index));
    html += `<span class="regex-match">${escapeHtml(m[0])}</span>`;
    cursor = m.index + m[0].length;
  }
  html += escapeHtml(sample.slice(cursor));
  highlightEl.innerHTML = html || escapeHtml(sample);

  // Stats + groups (from first match)
  statsEl.style.display = 'block';
  statsEl.textContent = `${t('regex.matches')}: ${matches.length}`;

  if (matches.length > 0) {
    const first = matches[0];
    let rows = '';
    for (let i = 0; i < first.length; i++) {
      rows += `<div class="regex-group-row"><span class="gname">$${i}</span><span class="gidx">${i === 0 ? 'full' : 'group'}</span><span>${escapeHtml(first[i] === undefined ? '(undefined)' : first[i])}</span></div>`;
    }
    if (first.groups) {
      for (const [name, val] of Object.entries(first.groups)) {
        rows += `<div class="regex-group-row"><span class="gname">${escapeHtml(name)}</span><span class="gidx">named</span><span>${escapeHtml(val === undefined ? '(undefined)' : val)}</span></div>`;
      }
    }
    groupsEl.innerHTML = rows;
  }
}

// ===== Tool: Cron Expression =====

const CRON_FIELD_NAMES = ['minute', 'hour', 'dom', 'month', 'dow'];
const CRON_FIELD_RANGES = [[0,59], [0,23], [1,31], [1,12], [0,6]];
const CRON_MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CRON_DOW_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function setCron(expr) {
  document.getElementById('cron-input').value = expr;
  decodeCron();
}

function parseCronField(field, idx) {
  const [min, max] = CRON_FIELD_RANGES[idx];
  // Normalize month/dow aliases
  let f = field.toUpperCase();
  if (idx === 3) CRON_MONTH_NAMES.forEach((n, i) => { f = f.replace(new RegExp(`\\b${n.toUpperCase()}\\b`, 'g'), String(i + 1)); });
  if (idx === 4) CRON_DOW_NAMES.forEach((n, i) => { f = f.replace(new RegExp(`\\b${n.toUpperCase()}\\b`, 'g'), String(i)); });

  const allowed = new Set();
  for (const part of f.split(',')) {
    let stepMatch = part.match(/^(.+)\/(\d+)$/);
    let step = 1, base = part;
    if (stepMatch) { base = stepMatch[1]; step = parseInt(stepMatch[2], 10); }

    let from, to;
    if (base === '*') { from = min; to = max; }
    else if (base.includes('-')) {
      const [a, b] = base.split('-').map(s => parseInt(s, 10));
      from = a; to = b;
    } else {
      const v = parseInt(base, 10);
      if (isNaN(v)) throw new Error(`Invalid cron field: ${field}`);
      from = v; to = v;
    }
    if (from < min || to > max || from > to) throw new Error(`Cron field "${field}" out of range [${min}-${max}]`);
    for (let v = from; v <= to; v += step) allowed.add(v);
  }
  return Array.from(allowed).sort((a, b) => a - b);
}

function describeCronField(field, idx, parsed) {
  const [min, max] = CRON_FIELD_RANGES[idx];
  if (parsed.length === max - min + 1) return null; // every
  if (field === '*') return null;
  if (idx === 3) return parsed.map(v => CRON_MONTH_NAMES[v - 1]).join(', ');
  if (idx === 4) return parsed.map(v => CRON_DOW_NAMES[v]).join(', ');
  return parsed.join(', ');
}

function nextCronRuns(parsed, count) {
  const [mins, hours, doms, months, dows] = parsed;
  const runs = [];
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  const limitMs = d.getTime() + 366 * 24 * 60 * 60 * 1000; // 1 year safety net
  while (runs.length < count && d.getTime() < limitMs) {
    if (
      mins.includes(d.getMinutes()) &&
      hours.includes(d.getHours()) &&
      doms.includes(d.getDate()) &&
      months.includes(d.getMonth() + 1) &&
      dows.includes(d.getDay())
    ) {
      runs.push(new Date(d));
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  return runs;
}

function decodeCron() {
  hideError('cron-error');
  const input = document.getElementById('cron-input').value.trim();
  const result = document.getElementById('cron-result');
  if (!input) { result.style.display = 'none'; return; }
  const fields = input.split(/\s+/);
  if (fields.length !== 5) {
    showError('cron-error', t('cron.error.fields'));
    result.style.display = 'none';
    return;
  }
  let parsed;
  try {
    parsed = fields.map((f, i) => parseCronField(f, i));
  } catch (e) {
    showError('cron-error', `${t('cron.error.invalid')}: ${e.message}`);
    result.style.display = 'none';
    return;
  }

  // Human-readable
  const labels = [t('cron.field.minute'), t('cron.field.hour'), t('cron.field.dom'), t('cron.field.month'), t('cron.field.dow')];
  const descs = parsed.map((p, i) => describeCronField(fields[i], i, p));
  let human;
  if (descs.every(d => d === null)) {
    human = t('cron.human.everyMin');
  } else {
    const minPart = descs[0] === null ? t('cron.human.everyMin') : `${t('cron.at')} :${parsed[0].map(v => String(v).padStart(2,'0')).join(',:')}`;
    const hourPart = descs[1] === null ? '' : ` ${t('cron.hour')} ${parsed[1].join(',')}`;
    const domPart = descs[2] === null ? '' : ` ${t('cron.onDom')} ${parsed[2].join(',')}`;
    const monthPart = descs[3] === null ? '' : ` ${t('cron.inMonths')} ${descs[3]}`;
    const dowPart = descs[4] === null ? '' : ` ${t('cron.onDow')} ${descs[4]}`;
    human = `${minPart}${hourPart}${domPart}${monthPart}${dowPart}`.trim();
  }

  const runs = nextCronRuns(parsed, 5);
  const locale = getLang() === 'tr' ? 'tr-TR' : 'en-GB';

  let html = `<div class="cron-human">${escapeHtml(human)}</div>`;
  html += `<div class="cron-fields">`;
  CRON_FIELD_NAMES.forEach((n, i) => {
    html += `<div class="cron-field"><div class="label">${escapeHtml(labels[i])}</div><div class="value">${escapeHtml(fields[i])}</div></div>`;
  });
  html += `</div>`;
  html += `<div class="cron-next">${escapeHtml(t('cron.next'))}<ul>`;
  runs.forEach(r => { html += `<li>${escapeHtml(r.toLocaleString(locale))}</li>`; });
  html += `</ul></div>`;
  result.innerHTML = html;
  result.style.display = 'block';
}

// ===== Tool: HTTP Status Codes =====

const HTTP_STATUS_CODES = [
  { code: 100, name: 'Continue', desc: { tr: 'Sunucu başlığı aldı; istemci gövdeyi göndermeye devam edebilir.', en: 'Server got headers; client should proceed to send body.' } },
  { code: 101, name: 'Switching Protocols', desc: { tr: 'Protokol değişimi onaylandı (örn. WebSocket upgrade).', en: 'Protocol upgrade accepted (e.g. WebSocket upgrade).' } },
  { code: 200, name: 'OK', desc: { tr: 'Standart başarılı yanıt.', en: 'Standard success response.' } },
  { code: 201, name: 'Created', desc: { tr: 'Kaynak oluşturuldu (genelde POST sonrası).', en: 'Resource created (typically after POST).' } },
  { code: 202, name: 'Accepted', desc: { tr: 'İstek alındı, işlem asenkron olarak devam ediyor.', en: 'Request accepted, processing continues async.' } },
  { code: 204, name: 'No Content', desc: { tr: 'Başarılı, ama gövde yok (genelde DELETE / PUT).', en: 'Success with no body (typically DELETE / PUT).' } },
  { code: 301, name: 'Moved Permanently', desc: { tr: 'Kaynak kalıcı olarak taşındı; yeni URL’i kullanın.', en: 'Resource moved permanently; use new URL.' } },
  { code: 302, name: 'Found', desc: { tr: 'Geçici yönlendirme.', en: 'Temporary redirect.' } },
  { code: 304, name: 'Not Modified', desc: { tr: 'Cache geçerli; yeniden indirmeye gerek yok.', en: 'Cache still valid; no re-download needed.' } },
  { code: 307, name: 'Temporary Redirect', desc: { tr: 'Geçici yönlendirme; istek metodu korunur.', en: 'Temporary redirect; method preserved.' } },
  { code: 308, name: 'Permanent Redirect', desc: { tr: 'Kalıcı yönlendirme; metot korunur.', en: 'Permanent redirect; method preserved.' } },
  { code: 400, name: 'Bad Request', desc: { tr: 'İstek bozuk (eksik/hatalı parametre, geçersiz JSON).', en: 'Malformed request (missing/invalid params, bad JSON).' } },
  { code: 401, name: 'Unauthorized', desc: { tr: 'Kimlik doğrulama gerekli ya da token geçersiz.', en: 'Authentication required or token invalid.' } },
  { code: 403, name: 'Forbidden', desc: { tr: 'Kimlik doğrulandı ama yetki yok.', en: 'Authenticated but not authorized.' } },
  { code: 404, name: 'Not Found', desc: { tr: 'Kaynak yok.', en: 'Resource does not exist.' } },
  { code: 405, name: 'Method Not Allowed', desc: { tr: 'HTTP metodu bu kaynak için izinli değil.', en: 'HTTP method not allowed on this resource.' } },
  { code: 408, name: 'Request Timeout', desc: { tr: 'Sunucu istek için çok uzun bekledi.', en: 'Server timed out waiting for request.' } },
  { code: 409, name: 'Conflict', desc: { tr: 'Kaynak çakışması (örn. duplicate, version mismatch).', en: 'Resource conflict (e.g. duplicate, version mismatch).' } },
  { code: 410, name: 'Gone', desc: { tr: 'Kaynak kalıcı olarak silindi.', en: 'Resource permanently removed.' } },
  { code: 413, name: 'Payload Too Large', desc: { tr: 'İstek gövdesi sunucu limitini aşıyor.', en: 'Request body exceeds server limit.' } },
  { code: 415, name: 'Unsupported Media Type', desc: { tr: 'Content-Type desteklenmiyor.', en: 'Content-Type not supported.' } },
  { code: 422, name: 'Unprocessable Entity', desc: { tr: 'İstek anlaşıldı ama validasyon başarısız.', en: 'Request understood but validation failed.' } },
  { code: 429, name: 'Too Many Requests', desc: { tr: 'Rate limit aşıldı.', en: 'Rate limit exceeded.' } },
  { code: 500, name: 'Internal Server Error', desc: { tr: 'Sunucu beklenmedik hata; loglarda detay aranmalı.', en: 'Unexpected server error; check logs.' } },
  { code: 501, name: 'Not Implemented', desc: { tr: 'Sunucu bu özelliği henüz desteklemiyor.', en: 'Feature not yet implemented.' } },
  { code: 502, name: 'Bad Gateway', desc: { tr: 'Upstream sunucudan geçersiz yanıt (proxy/LB sorunu).', en: 'Invalid response from upstream (proxy/LB issue).' } },
  { code: 503, name: 'Service Unavailable', desc: { tr: 'Servis geçici olarak kapalı (bakım, aşırı yük).', en: 'Service temporarily unavailable (maintenance, overload).' } },
  { code: 504, name: 'Gateway Timeout', desc: { tr: 'Upstream sunucu zamanında yanıt vermedi.', en: 'Upstream server did not respond in time.' } },
  { code: 507, name: 'Insufficient Storage', desc: { tr: 'Sunucuda yeterli depolama alanı yok.', en: 'Server out of storage.' } },
];

let httpStatusFilter = 'all';

function setHttpFilter(cls) {
  httpStatusFilter = cls;
  document.querySelectorAll('.http-filter').forEach(b => b.classList.toggle('active', b.dataset.class === cls));
  filterHttpStatus();
}

function filterHttpStatus() {
  const list = document.getElementById('http-status-list');
  if (!list) return;
  const q = (document.getElementById('http-search').value || '').trim().toLowerCase();
  const lang = getLang() === 'en' ? 'en' : 'tr';
  const matches = HTTP_STATUS_CODES.filter(s => {
    const classOk = httpStatusFilter === 'all' || String(s.code).startsWith(httpStatusFilter);
    if (!classOk) return false;
    if (!q) return true;
    return String(s.code).includes(q)
      || s.name.toLowerCase().includes(q)
      || s.desc[lang].toLowerCase().includes(q);
  });
  list.innerHTML = matches.map(s => `
    <div class="http-status-item c-${String(s.code)[0]}">
      <div class="code">${s.code}</div>
      <div>
        <div class="name">${escapeHtml(s.name)}</div>
        <div class="desc">${escapeHtml(s.desc[lang])}</div>
      </div>
    </div>
  `).join('');
  if (matches.length === 0) list.innerHTML = `<div class="empty-state visible">${escapeHtml(t('http.empty'))}</div>`;
}

// ===== Tool: cURL Parser =====

/**
 * Tokenize a curl command, honoring single/double quotes, backticks, and shell line continuations.
 * Cross-line continuations (a backslash at end-of-line) are stripped before tokenizing.
 */
function tokenizeCurl(text) {
  const cleaned = text.replace(/\\\r?\n\s*/g, ' ').trim();
  const tokens = [];
  let current = '';
  let quote = null;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (quote) {
      if (ch === quote) { quote = null; continue; }
      if (quote === '"' && ch === '\\' && i + 1 < cleaned.length) { current += cleaned[++i]; continue; }
      current += ch; continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (/\s/.test(ch)) {
      if (current.length > 0) { tokens.push(current); current = ''; }
      continue;
    }
    current += ch;
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function parseCurl() {
  hideError('curl-error');
  const raw = document.getElementById('curl-input').value.trim();
  const out = document.getElementById('curl-result');
  if (!raw) { out.style.display = 'none'; return; }

  let tokens;
  try { tokens = tokenizeCurl(raw); }
  catch (e) { showError('curl-error', `${t('curl.error.parse')}: ${e.message}`); return; }

  if (!tokens.length || !/^curl/i.test(tokens[0])) {
    showError('curl-error', t('curl.error.notcurl'));
    return;
  }

  let url = '';
  let method = 'GET';
  const headers = [];
  let body = '';
  let bodyType = null;
  let user = null;
  let followRedirects = false;
  let insecure = false;

  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i];
    const next = () => tokens[++i];
    if (tok === '-X' || tok === '--request') method = (next() || 'GET').toUpperCase();
    else if (tok === '-H' || tok === '--header') headers.push(next() || '');
    else if (tok === '-d' || tok === '--data' || tok === '--data-raw') { body = next() || ''; bodyType = 'data'; if (method === 'GET') method = 'POST'; }
    else if (tok === '--data-binary') { body = next() || ''; bodyType = 'binary'; if (method === 'GET') method = 'POST'; }
    else if (tok === '--data-urlencode') { body = next() || ''; bodyType = 'urlencoded'; if (method === 'GET') method = 'POST'; }
    else if (tok === '-u' || tok === '--user') user = next() || '';
    else if (tok === '-L' || tok === '--location') followRedirects = true;
    else if (tok === '-k' || tok === '--insecure') insecure = true;
    else if (tok === '--compressed' || tok === '-i' || tok === '--include' || tok === '-s' || tok === '--silent' || tok === '-v' || tok === '--verbose') { /* ignored */ }
    else if (tok.startsWith('-')) {
      // Unknown flag, attempt to skip its value if it doesn't start with -
      if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) i++;
    }
    else if (!url) url = tok;
  }

  if (!url) { showError('curl-error', t('curl.error.nourl')); return; }

  // Parse URL for query string breakdown
  let parsedUrl = null;
  let queryPairs = [];
  try {
    parsedUrl = new URL(url);
    parsedUrl.searchParams.forEach((v, k) => queryPairs.push({ k, v }));
  } catch { /* leave as raw */ }

  let html = `<div class="curl-row"><span class="label">${t('curl.method')}</span><span class="value"><strong>${escapeHtml(method)}</strong></span></div>`;
  html += `<div class="curl-row"><span class="label">URL</span><span class="value">${escapeHtml(url)}</span></div>`;
  if (parsedUrl) {
    html += `<div class="curl-row"><span class="label">${t('curl.host')}</span><span class="value">${escapeHtml(parsedUrl.host)}</span></div>`;
    html += `<div class="curl-row"><span class="label">${t('curl.path')}</span><span class="value">${escapeHtml(parsedUrl.pathname)}</span></div>`;
    if (queryPairs.length) {
      html += `<div class="curl-row"><span class="label">${t('curl.query')}</span><div class="curl-headers">${queryPairs.map(p => `<div><span class="k">${escapeHtml(p.k)}</span>= ${escapeHtml(p.v)}</div>`).join('')}</div></div>`;
    }
  }
  if (headers.length) {
    html += `<div class="curl-row"><span class="label">${t('curl.headers')}</span><div class="curl-headers">${headers.map(h => {
      const idx = h.indexOf(':');
      const k = idx > 0 ? h.slice(0, idx).trim() : h;
      const v = idx > 0 ? h.slice(idx + 1).trim() : '';
      return `<div><span class="k">${escapeHtml(k)}:</span> ${escapeHtml(v)}</div>`;
    }).join('')}</div></div>`;
  }
  if (user) html += `<div class="curl-row"><span class="label">${t('curl.auth')}</span><span class="value">Basic — ${escapeHtml(user)}</span></div>`;
  if (body) {
    let bodyDisplay = body;
    try {
      if ((body.startsWith('{') || body.startsWith('['))) bodyDisplay = JSON.stringify(JSON.parse(body), null, 2);
    } catch { /* keep raw */ }
    html += `<div class="curl-row"><span class="label">${t('curl.body')} (${bodyType || 'data'})</span><span class="value"><pre style="white-space:pre-wrap; margin:0;">${escapeHtml(bodyDisplay)}</pre></span></div>`;
  }
  const flagsList = [];
  if (followRedirects) flagsList.push('-L (follow redirects)');
  if (insecure) flagsList.push('-k (skip TLS verify)');
  if (flagsList.length) html += `<div class="curl-row"><span class="label">${t('curl.flags')}</span><span class="value">${escapeHtml(flagsList.join(', '))}</span></div>`;

  out.innerHTML = html;
  out.style.display = 'block';
}

// ===== Tool: Markdown Preview =====

/**
 * Lightweight Markdown -> HTML renderer. Covers the dialect a BA needs day-to-day:
 * headings, bold/italic, inline code, fenced code blocks, links, lists, blockquotes,
 * horizontal rules, and pipe tables. Not a full GFM implementation.
 */
function renderMarkdown() {
  const out = document.getElementById('md-output');
  if (!out) return;
  const src = document.getElementById('md-input').value;
  out.innerHTML = markdownToHtml(src);
}

function markdownToHtml(src) {
  // 1) Extract fenced code blocks first so their internals aren't transformed.
  const codeBlocks = [];
  src = src.replace(/```([\s\S]*?)```/g, (_, code) => {
    const idx = codeBlocks.push(code) - 1;
    return ` CODE${idx} `;
  });

  // 2) Escape raw HTML
  src = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 3) Block-level: tables (must be before paragraphs)
  src = src.replace(/((?:^\|.*\|\s*\n)+)/gm, (block) => {
    const lines = block.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return block;
    const splitRow = (line) => line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    const headers = splitRow(lines[0]);
    const sep = lines[1];
    if (!/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(sep)) return block;
    const rows = lines.slice(2).map(splitRow);
    const th = headers.map(h => `<th>${h}</th>`).join('');
    const tb = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
    return `<table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table>\n`;
  });

  // 4) Headings
  src = src.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
           .replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
           .replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
           .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
           .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
           .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');

  // 5) Horizontal rules
  src = src.replace(/^\s*---\s*$/gm, '<hr>');

  // 6) Blockquotes (single-line; chained handled by simple grouping)
  src = src.replace(/^>\s?(.*)$/gm, '<blockquote>$1</blockquote>');
  src = src.replace(/(<\/blockquote>\n<blockquote>)/g, '\n');

  // 7) Lists
  src = src.replace(/(?:^[ \t]*[-*+] .*(?:\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map(l => l.replace(/^[ \t]*[-*+] /, ''));
    return `<ul>${items.map(it => `<li>${it}</li>`).join('')}</ul>\n`;
  });
  src = src.replace(/(?:^[ \t]*\d+\.\s.*(?:\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map(l => l.replace(/^[ \t]*\d+\.\s/, ''));
    return `<ol>${items.map(it => `<li>${it}</li>`).join('')}</ol>\n`;
  });

  // 8) Inline: bold/italic/code/links
  src = src.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  src = src.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  src = src.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  src = src.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  src = src.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // 9) Paragraphs: wrap raw text blocks; skip lines that start with a tag
  src = src.split(/\n\n+/).map(block => {
    if (/^\s*<(h\d|ul|ol|table|blockquote|hr|pre|p)/.test(block)) return block;
    if (block.includes(' CODE')) return block;
    if (!block.trim()) return '';
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  // 10) Restore code blocks
  src = src.replace(/ CODE(\d+) /g, (_, idx) => `<pre><code>${codeBlocks[Number(idx)].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`);

  return src;
}

// ===== Tool: YAML <-> JSON =====

const YAML_CDN = 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js';
let yamlScriptLoaded = false;

async function ensureYamlLoaded() {
  if (yamlScriptLoaded || (typeof jsyaml !== 'undefined')) { yamlScriptLoaded = true; return; }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error(t('yaml.error.offline'));
  }
  await loadBpmnScript(YAML_CDN, 8000); // reuse the timeout-aware loader from BPMN section
  yamlScriptLoaded = true;
}

async function yamlToJson() {
  hideError('yaml-error');
  const input = document.getElementById('yaml-input').value;
  const outEl = document.getElementById('yaml-json-output');
  if (!input.trim()) { outEl.value = ''; return; }
  try {
    await ensureYamlLoaded();
    const data = jsyaml.load(input);
    outEl.value = JSON.stringify(data, null, 2);
  } catch (e) {
    showError('yaml-error', `${t('yaml.error.parse')}: ${e.message}`);
  }
}

async function jsonToYaml() {
  hideError('yaml-error');
  const inputEl = document.getElementById('yaml-json-output');
  const yamlEl = document.getElementById('yaml-input');
  const text = inputEl.value.trim();
  if (!text) return;
  try {
    const data = JSON.parse(text);
    await ensureYamlLoaded();
    yamlEl.value = jsyaml.dump(data, { indent: 2, lineWidth: 100 });
  } catch (e) {
    showError('yaml-error', `${t('yaml.error.parse')}: ${e.message}`);
  }
}

// ===== Tool: Use Case Writer (Cockburn) =====

function getUseCaseModel() {
  const splitLines = (s) => (s || '').split('\n').map(l => l.trim()).filter(Boolean);
  return {
    id: document.getElementById('uc-id').value.trim() || 'UC-XXX',
    name: document.getElementById('uc-name').value.trim(),
    actor: document.getElementById('uc-actor').value.trim(),
    goal: document.getElementById('uc-goal').value.trim(),
    scope: document.getElementById('uc-scope').value.trim(),
    level: document.getElementById('uc-level').value,
    pre:  splitLines(document.getElementById('uc-pre').value),
    post: splitLines(document.getElementById('uc-post').value),
    main: splitLines(document.getElementById('uc-main').value),
    ext:  splitLines(document.getElementById('uc-ext').value),
    trigger: document.getElementById('uc-trigger').value.trim(),
  };
}

function useCaseToMarkdown() {
  const m = getUseCaseModel();
  const levelLabel = ({
    'user-goal':   t('uc.level.user'),
    'summary':     t('uc.level.summary'),
    'subfunction': t('uc.level.subfn'),
  })[m.level] || m.level;

  let md = `# ${m.id}: ${m.name || '(name)'}\n\n`;
  if (m.scope) md += `**${t('uc.scope')}:** ${m.scope}\n\n`;
  md += `**${t('uc.level')}:** ${levelLabel}\n\n`;
  md += `**${t('uc.actor')}:** ${m.actor || '(actor)'}\n\n`;
  md += `**${t('uc.goal')}:** ${m.goal || '(goal)'}\n\n`;
  if (m.pre.length)  md += `### ${t('uc.preconditions')}\n${m.pre.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`;
  if (m.trigger)     md += `**${t('uc.trigger')}:** ${m.trigger}\n\n`;
  md += `### ${t('uc.main')}\n${m.main.map((s, i) => `${i + 1}. ${s}`).join('\n') || '_(empty)_'}\n\n`;
  if (m.ext.length)  md += `### ${t('uc.ext')}\n${m.ext.map(e => `- ${e}`).join('\n')}\n\n`;
  if (m.post.length) md += `### ${t('uc.postconditions')}\n${m.post.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n`;
  return md;
}

function renderUseCase() {
  document.getElementById('uc-output').value = useCaseToMarkdown();
}

function copyUseCaseMd() {
  const md = useCaseToMarkdown();
  document.getElementById('uc-output').value = md;
  copyToClipboard(md, document.querySelector('#panel-use-case .btn-secondary'));
}

function clearUseCase() {
  ['uc-id','uc-name','uc-actor','uc-goal','uc-scope','uc-trigger','uc-pre','uc-post','uc-main','uc-ext','uc-output']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

// ===== Tool: AC Generator (Gherkin) =====

let acScenarioCounter = 0;

function addScenario() {
  acScenarioCounter += 1;
  const n = acScenarioCounter;
  const wrap = document.getElementById('ac-scenarios');
  if (!wrap) return;
  const div = document.createElement('div');
  div.className = 'ac-scenario';
  div.dataset.scenarioId = String(n);
  div.innerHTML = `
    <div class="ac-scenario-header">
      <span class="ac-scenario-title">${escapeHtml(t('ac.scenario'))} #${n}</span>
      <button class="ac-remove-btn" type="button" onclick="removeScenario(${n})">${escapeHtml(t('ac.remove'))}</button>
    </div>
    <input type="text" class="ac-name" placeholder="${escapeHtml(t('ac.scenario.name.ph'))}">
    <label>${escapeHtml(t('ac.given'))}</label>
    <textarea class="ac-given" rows="2" placeholder="${escapeHtml(t('ac.given.ph'))}"></textarea>
    <label>${escapeHtml(t('ac.when'))}</label>
    <textarea class="ac-when" rows="2" placeholder="${escapeHtml(t('ac.when.ph'))}"></textarea>
    <label>${escapeHtml(t('ac.then'))}</label>
    <textarea class="ac-then" rows="2" placeholder="${escapeHtml(t('ac.then.ph'))}"></textarea>
  `;
  wrap.appendChild(div);
}

function removeScenario(id) {
  const node = document.querySelector(`.ac-scenario[data-scenario-id="${id}"]`);
  if (node) node.remove();
}

function renderAC() {
  const feature = document.getElementById('ac-feature').value.trim() || '(feature)';
  const desc = document.getElementById('ac-desc').value.trim();
  let out = `Feature: ${feature}\n`;
  if (desc) out += `  ${desc.split('\n').join('\n  ')}\n`;
  out += '\n';

  const scenarios = document.querySelectorAll('.ac-scenario');
  if (scenarios.length === 0) addScenario();

  document.querySelectorAll('.ac-scenario').forEach(sc => {
    const name = sc.querySelector('.ac-name').value.trim() || '(scenario)';
    const givenLines = sc.querySelector('.ac-given').value.split('\n').map(s => s.trim()).filter(Boolean);
    const whenLines  = sc.querySelector('.ac-when').value.split('\n').map(s => s.trim()).filter(Boolean);
    const thenLines  = sc.querySelector('.ac-then').value.split('\n').map(s => s.trim()).filter(Boolean);
    out += `  Scenario: ${name}\n`;
    givenLines.forEach((line, i) => out += `    ${i === 0 ? 'Given' : 'And'} ${line}\n`);
    whenLines.forEach((line, i)  => out += `    ${i === 0 ? 'When'  : 'And'} ${line}\n`);
    thenLines.forEach((line, i)  => out += `    ${i === 0 ? 'Then'  : 'And'} ${line}\n`);
    out += '\n';
  });

  document.getElementById('ac-output').value = out.trimEnd();
}

// ===== Tool: RACI Matrix Builder =====

const RACI_VALUES = ['', 'R', 'A', 'C', 'I'];
let raciState = []; // 2D array; raciState[rowIdx][colIdx] = '' | 'R' | 'A' | 'C' | 'I'

function buildRaciMatrix() {
  hideError('raci-error');
  const splitLines = (s) => s.split('\n').map(l => l.trim()).filter(Boolean);
  const activities = splitLines(document.getElementById('raci-activities').value);
  const stakeholders = splitLines(document.getElementById('raci-stakeholders').value);
  if (activities.length === 0 || stakeholders.length === 0) {
    showError('raci-error', t('raci.error.empty'));
    document.getElementById('raci-matrix-wrap').innerHTML = '';
    return;
  }
  // Re-init state if shape changed; otherwise preserve user's selections.
  if (raciState.length !== activities.length || (raciState[0] && raciState[0].length !== stakeholders.length)) {
    raciState = activities.map(() => Array(stakeholders.length).fill(''));
  }
  renderRaciMatrix(activities, stakeholders);
  validateRaci();
}

function renderRaciMatrix(activities, stakeholders) {
  const wrap = document.getElementById('raci-matrix-wrap');
  let html = `<table><thead><tr><th class="activity">${escapeHtml(t('raci.col.activity'))}</th>`;
  stakeholders.forEach(s => { html += `<th>${escapeHtml(s)}</th>`; });
  html += `</tr></thead><tbody>`;
  activities.forEach((a, ri) => {
    html += `<tr><td class="activity">${escapeHtml(a)}</td>`;
    stakeholders.forEach((_, ci) => {
      const val = raciState[ri][ci] || '';
      const cls = val ? val.toLowerCase() : '';
      html += `<td class="raci-cell ${cls}" data-r="${ri}" data-c="${ci}" onclick="cycleRaci(${ri}, ${ci})" tabindex="0" role="button" aria-label="${escapeHtml(a)} / ${escapeHtml(stakeholders[ci])}">${val || '–'}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}

function cycleRaci(ri, ci) {
  const current = raciState[ri][ci] || '';
  const idx = RACI_VALUES.indexOf(current);
  const next = RACI_VALUES[(idx + 1) % RACI_VALUES.length];
  raciState[ri][ci] = next;
  // Update just this cell (avoid full re-render)
  const cell = document.querySelector(`.raci-cell[data-r="${ri}"][data-c="${ci}"]`);
  if (cell) {
    cell.classList.remove('r','a','c','i');
    if (next) cell.classList.add(next.toLowerCase());
    cell.textContent = next || '–';
  }
  validateRaci();
}

function validateRaci() {
  const el = document.getElementById('raci-validation');
  if (!el) return;
  const issues = [];
  raciState.forEach((row, ri) => {
    const aCount = row.filter(v => v === 'A').length;
    if (aCount === 0) issues.push(`${t('raci.issue.noA')} #${ri + 1}`);
    else if (aCount > 1) issues.push(`${t('raci.issue.multiA')} #${ri + 1}`);
  });
  if (issues.length === 0) {
    el.className = 'raci-validation ok';
    el.textContent = '✓ ' + t('raci.valid');
  } else {
    el.className = 'raci-validation warn';
    el.textContent = '⚠ ' + issues.join(' · ');
  }
}

function getRaciTable() {
  const splitLines = (s) => s.split('\n').map(l => l.trim()).filter(Boolean);
  const activities = splitLines(document.getElementById('raci-activities').value);
  const stakeholders = splitLines(document.getElementById('raci-stakeholders').value);
  return { activities, stakeholders };
}

function copyRaciMd() {
  const { activities, stakeholders } = getRaciTable();
  if (!activities.length || !stakeholders.length) return;
  let md = `| ${t('raci.col.activity')} | ${stakeholders.join(' | ')} |\n`;
  md += `| --- | ${stakeholders.map(() => '---').join(' | ')} |\n`;
  activities.forEach((a, ri) => {
    md += `| ${a} | ${(raciState[ri] || []).map(v => v || '–').join(' | ')} |\n`;
  });
  copyToClipboard(md, document.querySelector('#panel-raci-matrix [onclick="copyRaciMd()"]'));
}

function copyRaciCsv() {
  const { activities, stakeholders } = getRaciTable();
  if (!activities.length || !stakeholders.length) return;
  const escapeCsv = v => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  let csv = `${escapeCsv(t('raci.col.activity'))},${stakeholders.map(escapeCsv).join(',')}\n`;
  activities.forEach((a, ri) => {
    csv += `${escapeCsv(a)},${(raciState[ri] || []).map(v => v || '').join(',')}\n`;
  });
  copyToClipboard(csv, document.querySelector('#panel-raci-matrix [onclick="copyRaciCsv()"]'));
}

// ===== Tool: BPMN Modeler (bpmn-js) =====

const BPMN_CDN = 'https://unpkg.com/bpmn-js@17/dist/';
let bpmnInstance = null;
let bpmnInitStarted = false;

function loadBpmnScript(src, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    let timer = setTimeout(() => {
      s.onload = s.onerror = null;
      reject(new Error('Script load timeout: ' + src));
    }, timeoutMs);
    s.onload = () => { clearTimeout(timer); resolve(); };
    s.onerror = () => { clearTimeout(timer); reject(new Error('Script load failed: ' + src)); };
    document.head.appendChild(s);
  });
}

function loadBpmnCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}

async function initBpmn() {
  if (bpmnInstance) return;
  if (bpmnInitStarted) return;
  bpmnInitStarted = true;

  loadBpmnCSS(BPMN_CDN + 'assets/diagram-js.css');
  loadBpmnCSS(BPMN_CDN + 'assets/bpmn-js.css');
  loadBpmnCSS(BPMN_CDN + 'assets/bpmn-font/css/bpmn-embedded.css');

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    bpmnInitStarted = false;
    document.getElementById('bpmn-loading').style.display = 'none';
    showError('bpmn-error', t('bpmn.error.offline'));
    return;
  }

  try {
    await loadBpmnScript(BPMN_CDN + 'bpmn-modeler.production.min.js', 12000);

    bpmnInstance = new BpmnJS({
      container: '#bpmn-canvas',
      keyboard: { bindTo: window }
    });

    await bpmnInstance.createDiagram();
    document.getElementById('bpmn-loading').style.display = 'none';
  } catch (e) {
    bpmnInitStarted = false;
    document.getElementById('bpmn-loading').style.display = 'none';
    const msg = /timeout/i.test(e && e.message || '') ? t('bpmn.error.timeout') : t('bpmn.error.load');
    showError('bpmn-error', msg);
  }
}

async function bpmnNew() {
  if (!bpmnInstance) return;
  hideError('bpmn-error');
  await bpmnInstance.createDiagram();
}

async function bpmnExportXml() {
  if (!bpmnInstance) return;
  try {
    const { xml } = await bpmnInstance.saveXML({ format: true });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([xml], { type: 'application/xml' })),
      download: 'diagram.bpmn'
    });
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    showError('bpmn-error', 'Export failed: ' + e.message);
  }
}

async function bpmnExportSvg() {
  if (!bpmnInstance) return;
  try {
    const { svg } = await bpmnInstance.saveSVG();
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })),
      download: 'diagram.svg'
    });
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    showError('bpmn-error', 'Export failed: ' + e.message);
  }
}

function bpmnImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.bpmn,.xml';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      await bpmnInstance.importXML(text);
      hideError('bpmn-error');
    } catch {
      showError('bpmn-error', t('bpmn.error.import'));
    }
  };
  input.click();
}

// ===== Public API — window bridge =====
//
// app.js is now an ES module, so its top-level functions are scoped to the module.
// Inline HTML handlers (onclick="…") need them on `window`, so we explicitly expose
// the public surface here. This list is the authoritative inventory of "what HTML
// is allowed to call". When you delete a function (or move it to a tool module),
// also delete its entry here. Conversely, when you add an inline handler in
// index.html, add the function to this object.
//
// Functions called from runtime-injected HTML (renderTabs's tab-close, RACI cells,
// AC scenario remove buttons, etc.) are also listed even though static grep
// misses them.

Object.assign(window, {
  // i18n / theme / global UI
  applyLang, toggleLang, t,
  toggleFeedbackMenu,

  // JSON Formatter
  jsonBeautify, jsonMinify, jsonValidate, jsonRemoveNulls, setJsonView,

  // JSON Grid / Diff / Escape
  renderJsonGrid, diffJson, jsonEscapeStr, jsonUnescapeStr, jsonSwap,

  // CSV / Base64
  csvToJson, base64Encode, base64Decode, base64ToFile, fileToBase64,

  // YAML <-> JSON
  yamlToJson, jsonToYaml,

  // Developer tools
  generateUUIDs, copyToClipboard,
  tsToDate, dateToTs, setNow,
  decodeJWT,
  shortenUrl, copyShortUrl,
  runRegex, syncRegexFlags,
  setCron, decodeCron,
  filterHttpStatus, setHttpFilter,
  parseCurl,

  // Database
  formatSQL, formatKQL,

  // Calculation
  calcSimpleInterest, calcLoanPayment, onTaxChange, onKistChange,

  // Text
  runDiff, countWords, downloadTextFile, updateEditorStats, renderMarkdown,

  // BA / Analysis
  buildUserStory, copyUserStory, copyUserStoryMd, copyUserStoryJira, clearUserStory,
  setAcMode, addAcBlock, removeAcBlock, addChecklistItem, removeChecklistItem, toggleInvest,
  renderUseCase, copyUseCaseMd, clearUseCase,
  addScenario, removeScenario, renderAC,
  buildRaciMatrix, cycleRaci, copyRaciMd, copyRaciCsv,
  bpmnNew, bpmnImport, bpmnExportXml, bpmnExportSvg,

  // Tab management (renderTabs injects HTML that calls these by name)
  switchTab, closeTab,
});

