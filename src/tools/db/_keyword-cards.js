// Shared keyword reference card renderer used by SQL + KQL cheatsheets.
// Each cheatsheet provides its own keyword list; this just lays them out.

import { t, getLang } from '../../i18n/index.js';

export function buildKeywordCards(keywords, container) {
  const section = document.createElement('div');
  section.style.marginBottom = '28px';
  const h4 = document.createElement('h4');
  h4.textContent = t('keyword.guide');
  h4.style.cssText = 'font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border);';
  section.appendChild(h4);
  const grid = document.createElement('div');
  grid.className = 'kw-grid';
  keywords.forEach((item) => {
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
