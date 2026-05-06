// SQL Formatter — string-aware keyword formatter.
//
// Masks string literals, quoted identifiers and comments before transforming
// keywords, then restores them. Without this, `WHERE name='select'` would
// become `WHERE name='SELECT'` and break the query.

function maskSqlLiterals(sql) {
  const literals = [];
  const masked = sql.replace(
    /'(?:[^']|'')*'|"(?:[^"]|"")*"|`(?:[^`]|``)*`|--[^\n]*|\/\*[\s\S]*?\*\//g,
    (match) => {
      const token = `SQLLIT${literals.length}`;
      literals.push(match);
      return token;
    },
  );
  return { masked, literals };
}

function unmaskSqlLiterals(text, literals) {
  return text.replace(/SQLLIT(\d+)/g, (_, idx) => literals[Number(idx)]);
}

export function formatSQL() {
  const input = document.getElementById('sql-input').value;
  const { masked, literals } = maskSqlLiterals(input);

  let sql = masked.replace(/\s+/g, ' ').trim().toUpperCase();

  const newlineKeywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
    'INNER JOIN', 'ON', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'UNION', 'UNION ALL'];

  newlineKeywords.forEach((kw) => {
    sql = sql.replace(new RegExp(`\\b${kw}\\b`, 'g'), '\n' + kw);
  });

  sql = sql.replace(/,\s*/g, ',\n    ');
  sql = unmaskSqlLiterals(sql, literals);
  document.getElementById('sql-output').value = sql.trim();
}
