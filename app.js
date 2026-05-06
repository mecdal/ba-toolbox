// app.js — last-mile glue layer. All tools now live in src/tools/*.
//
// Status (Sprint 5a):
//   Faz 1 ✅ extracted i18n + storage helpers
//   Faz 2 ✅ extracted core utilities (util, theme, nav, tabs, search, tab-helper, clear, feedback)
//   Faz 3a ✅ extracted dev (9), text (4), finance (2) tools
//   Faz 3b ✅ extracted db (4), data (7), ba (5) tools
//   Faz 4 ⏳ fold this file into src/main.js and delete
//
// Inline HTML handlers (onclick="…") still drive most interactions, so the
// public functions listed at the bottom of this file are bridged onto `window`
// for compatibility. As tools move into src/tools/*, their bridge entry follows
// them and the corresponding code disappears from this file.

import { storageGet, storageSet } from './src/core/storage.js';
import {
  t,
  applyDomI18n,
  setLang,
  getLang,
  groupKeyMap,
} from './src/i18n/index.js';
import {
  copyToClipboard,
  showError,
  hideError,
  setEmptyState,
  escapeHtml,
  debounce,
} from './src/core/util.js';
import { initTheme, toggleTheme, updateThemeBtn } from './src/core/theme.js';
import { tools, findTool } from './src/core/tool-registry.js';
import { buildNav, navigate } from './src/core/nav.js';
import {
  MAX_TABS,
  renderTabs,
  openTab,
  switchTab,
  closeTab,
  saveRecent,
  getActiveTab,
  getTabs,
} from './src/core/tabs.js';
import { initSearch } from './src/core/search.js';
import { initTabs } from './src/core/tab-helper.js';
import { toggleFeedbackMenu } from './src/core/feedback.js';
import { addClearButtons, clearPanel, noClearPanels } from './src/core/clear.js';
import { utf8ToBase64, base64ToUtf8 } from './src/core/base64-codec.js';

// Faz 3a tool imports
import { generateUUIDs } from './src/tools/dev/uuid.js';
import { tsToDate, dateToTs, setNow, initTimestampNow } from './src/tools/dev/timestamp.js';
import { decodeJWT } from './src/tools/dev/jwt.js';
import { initUrlEncoder } from './src/tools/dev/url-encoder.js';
import { shortenUrl, copyShortUrl } from './src/tools/dev/url-shortener.js';
import { runRegex, syncRegexFlags } from './src/tools/dev/regex-builder.js';
import { setCron, decodeCron } from './src/tools/dev/cron.js';
import { setHttpFilter, filterHttpStatus } from './src/tools/dev/http-status.js';
import { parseCurl } from './src/tools/dev/curl-parser.js';
import { runDiff } from './src/tools/text/diff-checker.js';
import { countWords } from './src/tools/text/word-counter.js';
import { downloadTextFile, updateEditorStats } from './src/tools/text/text-editor.js';
import { renderMarkdown } from './src/tools/text/markdown.js';
import { onTaxChange, onKistChange, calcSimpleInterest } from './src/tools/finance/interest.js';
import { calcLoanPayment } from './src/tools/finance/loan.js';
import { getCurrencyConfig } from './src/tools/finance/currency.js';

// Faz 3b tool imports
import {
  jsonBeautify,
  jsonMinify,
  jsonValidate,
  jsonRemoveNulls,
  setJsonView,
  initJsonTreeSearch,
} from './src/tools/data/json-formatter.js';
import { renderJsonGrid } from './src/tools/data/json-grid.js';
import { diffJson } from './src/tools/data/json-diff.js';
import { jsonEscapeStr, jsonUnescapeStr, jsonSwap } from './src/tools/data/json-escape.js';
import { csvToJson } from './src/tools/data/csv.js';
import { base64Encode, base64Decode, fileToBase64, base64ToFile } from './src/tools/data/base64.js';
import { yamlToJson, jsonToYaml } from './src/tools/data/yaml.js';
import { formatSQL } from './src/tools/db/sql-formatter.js';
import { formatKQL } from './src/tools/db/kql-formatter.js';
import { buildSqlCheatsheet } from './src/tools/db/sql-cheatsheet.js';
import { buildKqlCheatsheet } from './src/tools/db/kql-cheatsheet.js';
import {
  setAcMode,
  addAcBlock,
  removeAcBlock,
  addChecklistItem,
  removeChecklistItem,
  toggleInvest,
  buildUserStory,
  clearUserStory,
  copyUserStory,
  copyUserStoryMd,
  copyUserStoryJira,
} from './src/tools/ba/user-story.js';
import { renderUseCase, copyUseCaseMd, clearUseCase } from './src/tools/ba/use-case.js';
import { addScenario, removeScenario, renderAC } from './src/tools/ba/ac-generator.js';
import { buildRaciMatrix, cycleRaci, copyRaciMd, copyRaciCsv } from './src/tools/ba/raci.js';
import { initBpmn, bpmnNew, bpmnExportXml, bpmnExportSvg, bpmnImport } from './src/tools/ba/bpmn.js';


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

  // URL Encoder + Timestamp now-default — bootstrapped via their tool modules.
  initUrlEncoder();
  initTimestampNow();
  // JSON tree search input — module installs the debounced listener.
  initJsonTreeSearch();

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
  initBpmn, bpmnNew, bpmnImport, bpmnExportXml, bpmnExportSvg,

  // Tab management (renderTabs injects HTML that calls these by name)
  switchTab, closeTab,
});

