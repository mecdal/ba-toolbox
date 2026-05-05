// Word Counter — character/word/sentence/paragraph counts + reading time.
//
// Reading time uses 200 wpm (the 200-250 wpm range for adult silent reading;
// we picked 200 to be conservative for BA documents that often have technical
// jargon that slows readers down). Sentences split on .!? — good enough for
// BA docs; misses Turkish abbreviations ("Dr.", "Av.") but that's a corner
// case we accepted in Sprint 1's review.

import { t } from '../../i18n/index.js';

export function countWords() {
  const text = document.getElementById('wc-input').value;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter((s) => s.trim()).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const readTime = Math.ceil(words / 200);

  document.getElementById('wc-chars').textContent = chars;
  document.getElementById('wc-chars-no-space').textContent = charsNoSpace;
  document.getElementById('wc-words').textContent = words;
  document.getElementById('wc-sentences').textContent = sentences;
  document.getElementById('wc-paragraphs').textContent = paragraphs;
  document.getElementById('wc-readtime').textContent = readTime + ' ' + t('wc.readtime.unit');
}
