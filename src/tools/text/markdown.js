// Markdown Preview — lightweight, GFM-flavored renderer.
//
// Covers the dialect a BA needs day-to-day: headings, bold/italic, inline
// code, fenced code blocks, links, lists, blockquotes, horizontal rules, pipe
// tables. Not a full GFM (no task lists, footnotes, autolink, strikethrough).
//
// Algorithm:
//   1. Pull fenced code blocks out before any other transform so their
//      contents aren't escaped twice or matched by inline rules.
//   2. HTML-escape the rest of the source so user input can't inject markup.
//   3. Apply block-level transforms (tables, headings, hr, blockquotes, lists).
//   4. Apply inline transforms (bold, italic, code, links).
//   5. Wrap remaining text-only blocks in <p>.
//   6. Re-inject the code blocks (now safe to HTML-escape).

export function renderMarkdown() {
  const out = document.getElementById('md-output');
  if (!out) return;
  const src = document.getElementById('md-input').value;
  out.innerHTML = markdownToHtml(src);
}

export function markdownToHtml(src) {
  // 1) Lift fenced code blocks
  const codeBlocks = [];
  src = src.replace(/```([\s\S]*?)```/g, (_, code) => {
    const idx = codeBlocks.push(code) - 1;
    return ` CODE${idx} `;
  });

  // 2) Escape raw HTML
  src = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 3) Block-level: tables (must come before paragraph wrapping)
  src = src.replace(/((?:^\|.*\|\s*\n)+)/gm, (block) => {
    const lines = block.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return block;
    const splitRow = (line) => line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const headers = splitRow(lines[0]);
    const sep = lines[1];
    if (!/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(sep)) return block;
    const rows = lines.slice(2).map(splitRow);
    const th = headers.map((h) => `<th>${h}</th>`).join('');
    const tb = rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
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

  // 6) Blockquotes (consecutive ones get merged)
  src = src.replace(/^>\s?(.*)$/gm, '<blockquote>$1</blockquote>');
  src = src.replace(/(<\/blockquote>\n<blockquote>)/g, '\n');

  // 7) Lists
  src = src.replace(/(?:^[ \t]*[-*+] .*(?:\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^[ \t]*[-*+] /, ''));
    return `<ul>${items.map((it) => `<li>${it}</li>`).join('')}</ul>\n`;
  });
  src = src.replace(/(?:^[ \t]*\d+\.\s.*(?:\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^[ \t]*\d+\.\s/, ''));
    return `<ol>${items.map((it) => `<li>${it}</li>`).join('')}</ol>\n`;
  });

  // 8) Inline
  src = src.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  src = src.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  src = src.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  src = src.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  src = src.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // 9) Wrap text-only blocks in <p> (skip blocks already containing block-level tags)
  src = src.split(/\n\n+/).map((block) => {
    if (/^\s*<(h\d|ul|ol|table|blockquote|hr|pre|p)/.test(block)) return block;
    if (block.includes(' CODE')) return block;
    if (!block.trim()) return '';
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  // 10) Re-inject the code blocks (escape only here so contents stay verbatim)
  src = src.replace(/ CODE(\d+) /g, (_, idx) =>
    `<pre><code>${codeBlocks[Number(idx)].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`,
  );

  return src;
}
