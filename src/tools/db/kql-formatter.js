// KQL Formatter — Azure Monitor / Log Analytics / Sentinel query language.
//
// Splits on pipe (|) and indents continuation operators (and/or). Multi-statement
// inputs (let blocks separated by `;`) are handled by splitting on top-level
// semicolon-newline pairs.

export function formatKQL() {
  const input = document.getElementById('kql-input').value.trim();
  if (!input) return;

  const statements = input.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
  const formatted = statements.map((stmt) => {
    const parts = stmt.split(/\s*\|\s*/);
    return parts.map((part, i) => {
      part = part.trim();
      if (!part) return null;
      // Indent and/or onto continuation lines for readability.
      part = part.replace(/\band\b/gi, '\n    and').replace(/\bor\b(?!\s*\()/gi, '\n    or');
      return i === 0 ? part : '| ' + part;
    }).filter(Boolean).join('\n');
  }).join('\n\n');

  document.getElementById('kql-output').value = formatted;
}
