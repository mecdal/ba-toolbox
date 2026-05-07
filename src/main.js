// BA Toolbox — sole entry point.
//
// Loaded by index.html as <script type="module" src="src/main.js">.
// Wires together everything in src/core/* and src/tools/*, exposes the
// public surface on `window` so inline HTML handlers (onclick="…") still
// work, then runs DOMContentLoaded init.
//
// History note: in Sprint 5a we incrementally moved everything out of the
// legacy monolithic app.js (which was 4180 lines) into ~30 focused modules.
// Faz 4 finished the job by folding app.js's last 220 lines (imports,
// applyLang wrapper, init, window bridge) into this file.
//
// Architecture summary:
//   src/i18n/*       Translation maps + DOM-attribute application
//   src/core/*       Cross-cutting helpers (storage, util, theme, nav, tabs, ...)
//   src/tools/data/  JSON / CSV / Base64 / YAML
//   src/tools/db/    SQL + KQL formatters and cheatsheets
//   src/tools/dev/   UUID / Timestamp / JWT / URL / Regex / Cron / HTTP / cURL
//   src/tools/text/  Diff / Word counter / Editor / Markdown
//   src/tools/finance/ Interest / Loan
//   src/tools/ba/    User Story / Use Case / AC Generator / RACI / BPMN
//
// Compatibility note: src/core/storage.js runs migrateLegacyStorage() at module
// load, so it must be imported FIRST (before anything else that reads storage,
// notably i18n which restores the saved language). Below the storage import,
// order doesn't matter — modules read each other's exports lazily at call time.

import './core/storage.js'; // first: migrate legacy keys before any consumer reads them

import {
  t,
  applyDomI18n,
  setLang,
  getLang,
  groupKeyMap,
} from './i18n/index.js';
import {
  copyToClipboard,
  showError,
  hideError,
  setEmptyState,
  escapeHtml,
  debounce,
} from './core/util.js';
import { initTheme, toggleTheme, updateThemeBtn } from './core/theme.js';
import { tools, findTool } from './core/tool-registry.js';
import { buildNav, navigate } from './core/nav.js';
import {
  MAX_TABS,
  renderTabs,
  openTab,
  switchTab,
  closeTab,
  saveRecent,
  getActiveTab,
  getTabs,
} from './core/tabs.js';
import { initSearch } from './core/search.js';
import { initTabs } from './core/tab-helper.js';
import { toggleFeedbackMenu } from './core/feedback.js';
import { addClearButtons, clearPanel, noClearPanels } from './core/clear.js';
import { utf8ToBase64, base64ToUtf8 } from './core/base64-codec.js';

// Tool modules
import { generateUUIDs } from './tools/dev/uuid.js';
import { tsToDate, dateToTs, setNow, initTimestampNow } from './tools/dev/timestamp.js';
import { decodeJWT } from './tools/dev/jwt.js';
import { initUrlEncoder } from './tools/dev/url-encoder.js';
import { shortenUrl, copyShortUrl } from './tools/dev/url-shortener.js';
import { runRegex, syncRegexFlags } from './tools/dev/regex-builder.js';
import { setCron, decodeCron } from './tools/dev/cron.js';
import { setHttpFilter, filterHttpStatus } from './tools/dev/http-status.js';
import { parseCurl } from './tools/dev/curl-parser.js';
import { runDiff } from './tools/text/diff-checker.js';
import { countWords } from './tools/text/word-counter.js';
import { downloadTextFile, updateEditorStats } from './tools/text/text-editor.js';
import { renderMarkdown } from './tools/text/markdown.js';
import { onTaxChange, onKistChange, calcSimpleInterest } from './tools/finance/interest.js';
import { calcLoanPayment } from './tools/finance/loan.js';
import { getCurrencyConfig } from './tools/finance/currency.js';
import {
  jsonBeautify,
  jsonMinify,
  jsonValidate,
  jsonRemoveNulls,
  setJsonView,
  initJsonTreeSearch,
} from './tools/data/json-formatter.js';
import { renderJsonGrid } from './tools/data/json-grid.js';
import { diffJson } from './tools/data/json-diff.js';
import { jsonEscapeStr, jsonUnescapeStr, jsonSwap } from './tools/data/json-escape.js';
import { csvToJson } from './tools/data/csv.js';
import { base64Encode, base64Decode, fileToBase64, base64ToFile } from './tools/data/base64.js';
import { yamlToJson, jsonToYaml } from './tools/data/yaml.js';
import { formatSQL } from './tools/db/sql-formatter.js';
import { formatKQL } from './tools/db/kql-formatter.js';
import { buildSqlCheatsheet } from './tools/db/sql-cheatsheet.js';
import { buildKqlCheatsheet } from './tools/db/kql-cheatsheet.js';
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
} from './tools/ba/user-story.js';
import { renderUseCase, copyUseCaseMd, clearUseCase } from './tools/ba/use-case.js';
import { addScenario, removeScenario, renderAC } from './tools/ba/ac-generator.js';
import { buildRaciMatrix, cycleRaci, copyRaciMd, copyRaciCsv } from './tools/ba/raci.js';
import { initBpmn, bpmnNew, bpmnExportXml, bpmnExportSvg, bpmnImport } from './tools/ba/bpmn.js';


// ===== applyLang wrapper =====
//
// applyDomI18n in src/i18n/index.js handles every element with a data-i18n
// attribute. The wrapper below adds the dynamic refreshes that core i18n can't
// know about: nav group labels (built from a registry), tool labels (which
// have separate TR/EN strings on the tool object), the topbar title, theme
// button text, and tools that re-render their own dynamic content
// (cheatsheets, http-status filter, word counter, loan table headers).
//
// Long-term this should become a post-apply hook system — i18n would expose
// `addPostApplyHook(fn)` (it already does!) and each tool that needs a
// re-render would register itself. For now this single wrapper is fine.

function applyLang() {
  applyDomI18n();
  document.querySelectorAll('.tool-group-label').forEach((el) => {
    const key = el.dataset.groupKey;
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll('.tool-nav-item').forEach((el) => {
    const tool = tools.find((t2) => t2.id === el.dataset.tool);
    if (!tool) return;
    const label = (getLang() === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
    el.querySelector('span:last-child').textContent = label;
  });
  const activeItem = document.querySelector('.tool-nav-item.active');
  if (activeItem) {
    const tool = tools.find((t2) => t2.id === activeItem.dataset.tool);
    if (tool) {
      const label = (getLang() === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
      document.getElementById('topbar-title').textContent = label;
    }
  }
  updateThemeBtn(document.documentElement.getAttribute('data-theme'));
  buildSqlCheatsheet();
  buildKqlCheatsheet();
  if (typeof filterHttpStatus === 'function' && document.getElementById('http-status-list')) filterHttpStatus();
  if (document.getElementById('wc-input') && document.getElementById('wc-input').value) {
    countWords();
  }
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

  // Per-tool bootstrappers — tools register listeners or pre-fill defaults.
  initUrlEncoder();
  initTimestampNow();
  initJsonTreeSearch();

  // First-render for tools that show static content (so the panel isn't blank).
  if (document.getElementById('http-status-list')) filterHttpStatus();
  if (document.getElementById('regex-pattern')) runRegex();
  if (document.getElementById('md-input')) renderMarkdown();
  // AC Generator opens with one empty scenario card.
  if (document.getElementById('ac-scenarios')) addScenario();

  // PWA: register the service worker; failure is silent and the app still works.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* registration failed; app still works */ });
  }

  // Deep-link: if the URL has a hash matching a tool id, open that tool's tab.
  const hash = window.location.hash.replace('#', '');
  if (hash && tools.find((tool) => tool.id === hash)) {
    navigate(hash);
  }
});


// ===== Public API — window bridge =====
//
// Inline HTML handlers (onclick="…") need these on `window`. This is the
// authoritative inventory of "what HTML is allowed to call". When you add an
// inline handler in index.html, add the function here. Functions called from
// runtime-injected HTML (renderTabs's tab-close, RACI cells, AC scenario
// remove buttons) are also listed even though static grep misses them.

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
