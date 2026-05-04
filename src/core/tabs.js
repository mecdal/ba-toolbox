// Multi-tab system: open/switch/close tools as tabs (max 5).
//
// Module-private state: `_tabs` (ordered list of open tool IDs) and `_activeTab`.
// renderTabs writes inline onclick="switchTab(...)" / closeTab(...) handlers, so
// those two functions must be on `window`. The window-bridge for them lives in
// app.js (Phase 2 still wires bridges from there).
//
// saveRecent lives here too: "recent tools" tracks tab-switching, not navigation
// in general. Putting it here also avoids a circular import nav <-> tabs.

import { storageGet, storageSet } from './storage.js';
import { t, getLang } from '../i18n/index.js';
import { findTool } from './tool-registry.js';

export const MAX_TABS = 5;

let _tabs = [];
let _activeTab = null;

export function getTabs() { return [..._tabs]; }
export function getActiveTab() { return _activeTab; }

export function renderTabs() {
  const bar = document.getElementById('tab-bar');
  if (!bar) return;
  bar.style.display = _tabs.length > 0 ? 'flex' : 'none';
  bar.innerHTML = _tabs.map((id) => {
    const tool = findTool(id);
    if (!tool) return '';
    const label = (getLang() === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
    const isActive = id === _activeTab;
    const closeAria = `${t('aria.tab-close')}: ${label}`;
    return `<div class="tab${isActive ? ' active' : ''}" data-tool="${id}" role="tab" aria-selected="${isActive}" tabindex="0" onclick="switchTab('${id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();switchTab('${id}')}">
      <span class="tab-icon" aria-hidden="true">${tool.icon}</span>
      <span class="tab-label">${label}</span>
      <button class="tab-close" type="button" aria-label="${closeAria}" title="${closeAria}" onclick="event.stopPropagation();closeTab('${id}')">×</button>
    </div>`;
  }).join('') + (_tabs.length >= MAX_TABS
    ? `<div class="tab-limit-hint" id="tab-limit-hint" style="display:none">MAX ${MAX_TABS}</div>`
    : '');
}

export function openTab(toolId) {
  if (_tabs.includes(toolId)) {
    switchTab(toolId);
    return;
  }
  if (_tabs.length >= MAX_TABS) {
    // Briefly flash a hint instead of silently dropping the click.
    const hint = document.getElementById('tab-limit-hint');
    if (hint) {
      hint.style.display = 'flex';
      clearTimeout(hint._timer);
      hint._timer = setTimeout(() => { hint.style.display = 'none'; }, 1800);
    }
    return;
  }
  _tabs = [..._tabs, toolId];
  switchTab(toolId);
}

export function switchTab(toolId) {
  _activeTab = toolId;
  renderTabs();

  // Show the right panel.
  document.querySelectorAll('.tool-panel').forEach((el) => el.classList.remove('active'));
  const panel = document.getElementById('panel-' + toolId);
  if (panel) panel.classList.add('active');

  // Mirror in the sidebar.
  document.querySelectorAll('.tool-nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.tool === toolId);
  });

  // Topbar title.
  const tool = findTool(toolId);
  if (tool) {
    const label = (getLang() === 'en' && tool.labelEn) ? tool.labelEn : tool.label;
    document.getElementById('topbar-title').textContent = label;
  }

  // Hide welcome screen on first tool open.
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.style.display = 'none';

  window.location.hash = toolId;
  saveRecent(toolId);

  // BPMN modeler is lazy-loaded on first activation. We resolve via window
  // rather than importing to avoid a tabs <-> app circular dependency.
  if (toolId === 'bpmn-modeler' && typeof window.initBpmn === 'function') window.initBpmn();
}

export function closeTab(toolId) {
  const idx = _tabs.indexOf(toolId);
  _tabs = _tabs.filter((id) => id !== toolId);

  if (_activeTab === toolId) {
    if (_tabs.length > 0) {
      // Switch to the nearest surviving tab so the user lands somewhere sensible.
      switchTab(_tabs[Math.min(idx, _tabs.length - 1)]);
    } else {
      _activeTab = null;
      renderTabs();
      document.querySelectorAll('.tool-panel').forEach((el) => el.classList.remove('active'));
      document.querySelectorAll('.tool-nav-item').forEach((el) => el.classList.remove('active'));
      const welcome = document.getElementById('welcome');
      if (welcome) welcome.style.display = '';
      const titleEl = document.getElementById('topbar-title');
      if (titleEl) titleEl.textContent = t('topbar.welcome');
      window.location.hash = '';
    }
  } else {
    renderTabs();
  }
}

export function saveRecent(toolId) {
  let recents = JSON.parse(storageGet('recents') || '[]');
  recents = [toolId, ...recents.filter((r) => r !== toolId)].slice(0, 5);
  storageSet('recents', JSON.stringify(recents));
}
