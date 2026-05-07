// Send-to handoff system.
//
// Lets a user pipe one tool's output straight into another tool's input,
// skipping the copy → switch tab → paste dance. The dropdown is dynamically
// injected into every panel that has a recognized output, listing only the
// tools whose accepted input type matches the source's output type.
//
// Registry shape:
//   TOOL_IO[toolId] = {
//     panelId:   'panel-<id>',                 // where to inject the trigger
//     anchor:    DOM id of the button to insert before/after (usually a Copy btn)
//     out?:      { type, getValue: () => string }
//     ins?:      [{ label, type, setValue: (v) => void }, ...]
//                  // an array because some tools accept multiple slots
//                  // (JSON Diff has Left/Right, Diff Checker has Original/New)
//   }
//
// Type matching is direct (json → json) plus a small `WIDENS` table — anything
// readable as text can be sent into a generic text consumer.

import { t, getLang } from '../i18n/index.js';
import { storageGet, storageSet } from './storage.js';
import { findTool } from './tool-registry.js';
import { openTab, getActiveTab } from './tabs.js';

const SEND_HISTORY_KEY = 'send-to-history';
const HISTORY_LIMIT = 10;

// Anything in this list is implicitly cast to "text" for matching purposes.
// "json" output can feed a text-only sink (Word Counter, Diff, Editor) because
// a JSON string is also valid text.
const TEXT_LIKE = new Set(['json', 'yaml', 'sql', 'kql', 'markdown', 'gherkin', 'csv', 'url', 'cron', 'base64']);

const $ = (id) => document.getElementById(id);
const getVal = (id) => { const el = $(id); return el ? (el.value ?? el.textContent ?? '') : ''; };
const setVal = (id, v) => {
  const el = $(id);
  if (!el) return;
  if ('value' in el) el.value = v;
  else el.textContent = v;
};

// Public registry. Order here drives dropdown order in the UI.
const TOOL_IO = {
  'json-formatter': {
    panelId: 'panel-json-formatter',
    out: { type: 'json', getValue: () => getVal('json-output') || getVal('json-input') },
    ins: [{ label: 'JSON Input', type: 'json', setValue: (v) => setVal('json-input', v) }],
  },
  'json-grid': {
    panelId: 'panel-json-grid',
    ins: [{ label: 'JSON Input', type: 'json', setValue: (v) => setVal('json-grid-input', v) }],
  },
  'json-diff': {
    panelId: 'panel-json-diff',
    ins: [
      { label: 'Left (A)',  type: 'json', setValue: (v) => setVal('json-diff-left', v) },
      { label: 'Right (B)', type: 'json', setValue: (v) => setVal('json-diff-right', v) },
    ],
  },
  'json-escape': {
    panelId: 'panel-json-escape',
    out: { type: 'text', getValue: () => getVal('json-escape-output') },
    ins: [{ label: 'Raw Text', type: 'text', setValue: (v) => setVal('json-escape-input', v) }],
  },
  'csv-to-json': {
    panelId: 'panel-csv-to-json',
    out: { type: 'json', getValue: () => getVal('csv-output') },
    ins: [{ label: 'CSV', type: 'csv', setValue: (v) => setVal('csv-input', v) }],
  },
  'yaml-json': {
    panelId: 'panel-yaml-json',
    out: { type: 'json', getValue: () => getVal('yaml-json-output') },
    ins: [
      { label: 'YAML', type: 'yaml', setValue: (v) => setVal('yaml-input', v) },
      { label: 'JSON', type: 'json', setValue: (v) => setVal('yaml-json-output', v) },
    ],
  },
  'base64': {
    panelId: 'panel-base64',
    out: { type: 'base64', getValue: () => getVal('b64-encoded') },
    ins: [
      { label: 'Raw Text', type: 'text',   setValue: (v) => setVal('b64-raw', v) },
      { label: 'Base64',   type: 'base64', setValue: (v) => setVal('b64-encoded', v) },
    ],
  },
  'sql-formatter': {
    panelId: 'panel-sql-formatter',
    out: { type: 'sql', getValue: () => getVal('sql-output') },
    ins: [{ label: 'SQL', type: 'sql', setValue: (v) => setVal('sql-input', v) }],
  },
  'kql-formatter': {
    panelId: 'panel-kql-formatter',
    out: { type: 'kql', getValue: () => getVal('kql-output') },
    ins: [{ label: 'KQL', type: 'kql', setValue: (v) => setVal('kql-input', v) }],
  },
  'uuid-generator': {
    panelId: 'panel-uuid-generator',
    out: { type: 'text', getValue: () => getVal('uuid-output') },
  },
  'url-encoder': {
    panelId: 'panel-url-encoder',
    out: { type: 'text', getValue: () => getVal('url-encoded') || getVal('url-raw') },
    ins: [{ label: 'Raw URL', type: 'text', setValue: (v) => setVal('url-raw', v) }],
  },
  'url-shortener': {
    panelId: 'panel-url-shortener',
    out: { type: 'url', getValue: () => $('url-short-output')?.textContent || '' },
    ins: [{ label: 'Long URL', type: 'url', setValue: (v) => setVal('url-short-input', v) }],
  },
  'jwt-decoder': {
    panelId: 'panel-jwt-decoder',
    out: { type: 'json', getValue: () => getVal('jwt-payload') },
    ins: [{ label: 'JWT', type: 'text', setValue: (v) => setVal('jwt-input', v) }],
  },
  'regex-builder': {
    panelId: 'panel-regex-builder',
    ins: [{ label: 'Sample Text', type: 'text', setValue: (v) => setVal('regex-sample', v) }],
  },
  'cron-decoder': {
    panelId: 'panel-cron-decoder',
    ins: [{ label: 'Cron', type: 'cron', setValue: (v) => setVal('cron-input', v) }],
  },
  'curl-parser': {
    panelId: 'panel-curl-parser',
    ins: [{ label: 'cURL Command', type: 'text', setValue: (v) => setVal('curl-input', v) }],
  },
  'diff-checker': {
    panelId: 'panel-diff-checker',
    ins: [
      { label: 'Original (A)', type: 'text', setValue: (v) => setVal('diff-original', v) },
      { label: 'New (B)',      type: 'text', setValue: (v) => setVal('diff-new', v) },
    ],
  },
  'word-counter': {
    panelId: 'panel-word-counter',
    ins: [{ label: 'Text', type: 'text', setValue: (v) => setVal('wc-input', v) }],
  },
  'text-editor': {
    panelId: 'panel-text-editor',
    out: { type: 'text', getValue: () => getVal('editor-content') },
    ins: [{ label: 'Editor Content', type: 'text', setValue: (v) => setVal('editor-content', v) }],
  },
  'markdown-preview': {
    panelId: 'panel-markdown-preview',
    ins: [{ label: 'Markdown', type: 'markdown', setValue: (v) => setVal('md-input', v) }],
  },
  'use-case': {
    panelId: 'panel-use-case',
    out: { type: 'markdown', getValue: () => getVal('uc-output') },
  },
  'ac-generator': {
    panelId: 'panel-ac-generator',
    out: { type: 'gherkin', getValue: () => getVal('ac-output') },
  },
  'user-story': {
    panelId: 'panel-user-story',
    out: { type: 'text', getValue: () => getVal('us-output') },
  },
};

/** True if a value of `outType` can be fed into an input expecting `inType`. */
function isCompatible(outType, inType) {
  if (outType === inType) return true;
  if (inType === 'text' && TEXT_LIKE.has(outType)) return true;
  if (inType === 'markdown' && (outType === 'gherkin' || outType === 'text')) return true;
  return false;
}

/**
 * @returns {{toolId, slotIndex, label, fullLabel}[]} every (target tool, input slot)
 * pair that accepts a value of `outType`. Always excludes the source tool itself.
 */
export function getCompatibleTargets(sourceToolId, outType) {
  const list = [];
  for (const [toolId, io] of Object.entries(TOOL_IO)) {
    if (toolId === sourceToolId) continue;
    if (!io.ins) continue;
    io.ins.forEach((slot, i) => {
      if (!isCompatible(outType, slot.type)) return;
      const tool = findTool(toolId);
      const toolLabel = (getLang() === 'en' && tool?.labelEn) ? tool.labelEn : (tool?.label || toolId);
      const fullLabel = io.ins.length > 1 ? `${toolLabel} → ${slot.label}` : toolLabel;
      list.push({ toolId, slotIndex: i, label: slot.label, fullLabel });
    });
  }
  return list;
}

function pushHistory(sourceId, targetId, slotIndex) {
  let history;
  try { history = JSON.parse(storageGet(SEND_HISTORY_KEY) || '[]'); } catch { history = []; }
  const key = `${sourceId}→${targetId}#${slotIndex}`;
  history = [key, ...history.filter((k) => k !== key)].slice(0, HISTORY_LIMIT);
  storageSet(SEND_HISTORY_KEY, JSON.stringify(history));
}

/** Compares two history keys for sort: most-recently-used first. */
function recentRank(history, key) {
  const idx = history.indexOf(key);
  return idx === -1 ? Infinity : idx;
}

/**
 * Send the source tool's current output into target tool's slot. Opens (or
 * switches to) the target tab, sets the input, and records the action in history.
 * Silently no-ops if the source has no output value.
 */
export function sendTo(sourceId, targetId, slotIndex = 0) {
  const sourceIO = TOOL_IO[sourceId];
  const targetIO = TOOL_IO[targetId];
  if (!sourceIO?.out || !targetIO?.ins?.[slotIndex]) return false;

  const value = sourceIO.out.getValue();
  if (!value) return false;

  openTab(targetId); // opens or switches; bounded by MAX_TABS
  // openTab makes the panel visible synchronously, so setValue runs against the right DOM.
  targetIO.ins[slotIndex].setValue(value);
  pushHistory(sourceId, targetId, slotIndex);
  return true;
}

// ----- DOM injection -----

let openMenu = null;

function closeOpenMenu() {
  if (openMenu) {
    openMenu.remove();
    openMenu = null;
  }
}

function buildSendToMenu(sourceId) {
  const io = TOOL_IO[sourceId];
  if (!io?.out) return null;

  const targets = getCompatibleTargets(sourceId, io.out.type);
  let history;
  try { history = JSON.parse(storageGet(SEND_HISTORY_KEY) || '[]'); } catch { history = []; }
  // Sort recent-first, stable for ties.
  targets.sort((a, b) =>
    recentRank(history, `${sourceId}→${a.toolId}#${a.slotIndex}`) -
    recentRank(history, `${sourceId}→${b.toolId}#${b.slotIndex}`),
  );

  const menu = document.createElement('div');
  menu.className = 'send-to-menu';
  menu.setAttribute('role', 'menu');

  if (targets.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'send-to-empty';
    empty.textContent = t('send.empty');
    menu.appendChild(empty);
    return menu;
  }

  targets.forEach((tgt, i) => {
    const item = document.createElement('button');
    item.className = 'send-to-item';
    item.setAttribute('role', 'menuitem');
    item.type = 'button';
    item.textContent = tgt.fullLabel;
    if (i === 0 && history.length && history[0].startsWith(`${sourceId}→${tgt.toolId}#`)) {
      // The most-recently-used target gets a subtle marker so power users learn the shortcut.
      item.classList.add('recent');
    }
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      closeOpenMenu();
      sendTo(sourceId, tgt.toolId, tgt.slotIndex);
    });
    menu.appendChild(item);
  });

  return menu;
}

function showSendToMenu(trigger, sourceId) {
  closeOpenMenu();
  const menu = buildSendToMenu(sourceId);
  if (!menu) return;
  document.body.appendChild(menu);
  openMenu = menu;

  // Position below the trigger, right-aligned.
  const rect = trigger.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const top = rect.bottom + window.scrollY + 4;
  let left = rect.right + window.scrollX - menuRect.width;
  if (left < 8) left = 8; // keep on screen on narrow viewports
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
}

function injectTriggerInto(panel, sourceId) {
  // Strategy: append the trigger to whatever .btn-group the panel has that
  // already contains a Copy button. If no such group exists, append a new one
  // to the .tool-card. This keeps the button visually near the output.
  const card = panel.querySelector('.tool-card');
  if (!card) return;

  // Avoid double-injection on language switch / rebuild.
  if (panel.querySelector('.send-to-trigger')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-secondary btn-sm send-to-trigger';
  btn.setAttribute('aria-haspopup', 'menu');
  btn.dataset.sendFrom = sourceId;
  btn.textContent = `📤 ${t('send.to')} ▾`;
  btn.title = t('send.tooltip');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (openMenu) { closeOpenMenu(); return; }
    showSendToMenu(btn, sourceId);
  });

  // Look for an existing copy-button group; if none, fall back to appending a new row.
  const copyBtn = panel.querySelector('button[onclick*="copyToClipboard"], #url-short-copy-btn');
  const group = copyBtn?.closest('.btn-group');
  if (group) {
    group.appendChild(btn);
  } else {
    const row = document.createElement('div');
    row.className = 'btn-group send-to-row';
    row.appendChild(btn);
    card.appendChild(row);
  }
}

/**
 * Walk every tool that has an `out` declaration and inject a Send-to trigger
 * into its panel. Idempotent — safe to call after language switches that
 * rebuild static labels.
 */
export function initSendTo() {
  for (const [toolId, io] of Object.entries(TOOL_IO)) {
    if (!io.out) continue;
    const panel = document.getElementById(io.panelId);
    if (panel) injectTriggerInto(panel, toolId);
  }

  // Close menu on Escape or outside-click.
  document.addEventListener('click', (e) => {
    if (openMenu && !openMenu.contains(e.target) && !e.target.classList?.contains('send-to-trigger')) {
      closeOpenMenu();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOpenMenu();
  });
}

/**
 * Re-translate trigger labels after a language switch.
 * Called from the i18n post-apply hook in main.js.
 */
export function refreshSendToLabels() {
  document.querySelectorAll('.send-to-trigger').forEach((btn) => {
    btn.textContent = `📤 ${t('send.to')} ▾`;
    btn.title = t('send.tooltip');
  });
}
