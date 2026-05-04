// Sidebar navigation: renders tool list grouped by category, wires click → openTab.
//
// navigate() is the single entry point used by both sidebar clicks and URL-hash
// routing on initial load. Keeping the sidebar's "click → tab" plumbing here
// (rather than baked into the tab system) lets us swap in alternate UIs later
// (e.g. command palette) without touching the tab module.

import { tools } from './tool-registry.js';
import { t, getLang, groupKeyMap } from '../i18n/index.js';
import { openTab } from './tabs.js';

export function buildNav() {
  const list = document.getElementById('tool-list');
  if (!list) return;
  const groups = {};
  tools.forEach((tool) => {
    if (!groups[tool.group]) groups[tool.group] = [];
    groups[tool.group].push(tool);
  });

  Object.entries(groups).forEach(([group, items]) => {
    const label = document.createElement('div');
    const groupKey = groupKeyMap[group] || group;
    label.className = 'tool-group-label';
    label.dataset.groupKey = groupKey;
    label.textContent = t(groupKey);
    list.appendChild(label);

    items.forEach((tool) => {
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

export function navigate(toolId) {
  openTab(toolId);
}
