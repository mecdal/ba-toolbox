const { test, expect } = require('@playwright/test');

// Scope button click to the active panel to avoid strict mode violations
async function openTool(page, toolId) {
  await page.locator(`.tool-nav-item[data-tool="${toolId}"]`).click();
  await expect(page.locator(`#panel-${toolId}`)).toBeVisible();
}

async function panelButton(page, toolId, text) {
  return page.locator(`#panel-${toolId} button:has-text("${text}")`);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#tool-list .tool-nav-item').first()).toBeVisible();
});

// ===== Navigation & Layout =====

test('welcome screen shows on load', async ({ page }) => {
  await expect(page.locator('#welcome')).toBeVisible();
  await expect(page.locator('.tool-nav-item')).toHaveCount(20);
});

test('nav groups are in correct order', async ({ page }) => {
  const groups = page.locator('.tool-group-label');
  await expect(groups.nth(0)).toContainText('Veri');
  await expect(groups.nth(1)).toContainText('Veritaban');
  await expect(groups.nth(2)).toContainText('Geli');
  await expect(groups.nth(3)).toContainText('Hesaplama');
  await expect(groups.nth(4)).toContainText('Metin');
});

test('UUID is first in Geliştirici group, JWT is last', async ({ page }) => {
  const items = page.locator('.tool-nav-item');
  const allItems = await items.all();
  const labels = await Promise.all(allItems.map(el => el.textContent()));
  const devItems = labels.filter(l =>
    ['UUID', 'URL Encode', 'Timestamp', 'URL Kısalt', 'JWT'].some(kw => l.includes(kw))
  );
  expect(devItems[0]).toContain('UUID');
  expect(devItems[devItems.length - 1]).toContain('JWT');
});

test('theme toggle switches dark mode', async ({ page }) => {
  const btn = page.locator('#theme-toggle');
  await btn.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await btn.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('EN/TR language toggle works', async ({ page }) => {
  await page.locator('#lang-toggle').click();
  await expect(page.locator('.tool-group-label').first()).toContainText('Data');
  await page.locator('#lang-toggle').click();
  await expect(page.locator('.tool-group-label').first()).toContainText('Veri');
});

test('search filters nav items', async ({ page }) => {
  await page.locator('#search-box').fill('json');
  const visible = page.locator('.tool-nav-item:visible');
  const count = await visible.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(20);
});

// ===== JSON Formatter =====

test('JSON formatter beautifies valid JSON', async ({ page }) => {
  await openTool(page, 'json-formatter');
  await page.locator('#json-input').fill('{"a":1,"b":2}');
  await (await panelButton(page, 'json-formatter', 'Güzelleştir')).click();
  const output = await page.locator('#json-output').inputValue();
  expect(output).toContain('"a": 1');
  await expect(page.locator('#json-status')).toContainText('✓');
});

test('JSON formatter shows error on invalid JSON', async ({ page }) => {
  await openTool(page, 'json-formatter');
  await page.locator('#json-input').fill('{bad json}');
  await (await panelButton(page, 'json-formatter', 'Güzelleştir')).click();
  await expect(page.locator('#json-error')).toBeVisible();
  await expect(page.locator('#json-status')).toContainText('✗');
});

// ===== JSON Diff =====

test('JSON diff finds differences correctly', async ({ page }) => {
  await openTool(page, 'json-diff');
  await page.locator('#json-diff-left').fill('{"name":"Ali","age":30}');
  await page.locator('#json-diff-right').fill('{"name":"Ali","age":31,"city":"İstanbul"}');
  await (await panelButton(page, 'json-diff', 'Karşılaştır')).click();
  await expect(page.locator('#json-diff-output')).toContainText('age');
  await expect(page.locator('#json-diff-output')).toContainText('city');
});

test('JSON diff reports identical JSONs', async ({ page }) => {
  await openTool(page, 'json-diff');
  await page.locator('#json-diff-left').fill('{"x":1}');
  await page.locator('#json-diff-right').fill('{"x":1}');
  await (await panelButton(page, 'json-diff', 'Karşılaştır')).click();
  await expect(page.locator('#json-diff-output')).toContainText('fark yok');
});

test('JSON diff clear button resets output (regression: BUG-R1)', async ({ page }) => {
  await openTool(page, 'json-diff');
  await page.locator('#json-diff-left').fill('{"a":1}');
  await page.locator('#json-diff-right').fill('{"a":2}');
  await (await panelButton(page, 'json-diff', 'Karşılaştır')).click();
  const output = page.locator('#json-diff-output');
  await expect(output).not.toBeEmpty();
  await (await panelButton(page, 'json-diff', 'Temizle')).click();
  await expect(output).toBeEmpty();
});

// ===== Interest Calculator =====

test('basit faiz hesaplama çalışır', async ({ page }) => {
  await openTool(page, 'interest-calc');
  await page.locator('#si-principal').fill('10000');
  await page.locator('#si-rate').fill('50');
  await page.locator('#si-time').fill('12');
  await page.locator('#si-unit').selectOption('month');
  await (await panelButton(page, 'interest-calc', 'Hesapla')).click();
  await expect(page.locator('#si-result-card')).toBeVisible();
  await expect(page.locator('#si-result-card')).toContainText('Brüt Faiz');
});

test('basit faiz — sadece Basit Faiz sekme var (Bileşik ve Birikim yok)', async ({ page }) => {
  await openTool(page, 'interest-calc');
  await expect(page.locator('#panel-interest-calc .tab-btn')).toHaveCount(0);
});

test('basit faiz — stopaj seçilince vergi alanı görünür', async ({ page }) => {
  await openTool(page, 'interest-calc');
  await page.locator('#si-tax').selectOption('tr');
  await expect(page.locator('#si-tax-tr')).toBeVisible();
  await page.locator('#si-tax').selectOption('de');
  await expect(page.locator('#si-tax-de')).toBeVisible();
});

// ===== Loan Calculator =====

test('kredi hesaplama aylık taksit gösterir', async ({ page }) => {
  await openTool(page, 'loan-calc');
  await page.locator('#loan-principal').fill('100000');
  await page.locator('#loan-rate').fill('36');
  await page.locator('#loan-months').fill('12');
  await (await panelButton(page, 'loan-calc', 'Hesapla')).click();
  await expect(page.locator('#loan-result-card')).toBeVisible();
  await expect(page.locator('#loan-result-card')).toContainText('Aylık Taksit');
});

// ===== SQL Cheatsheet =====

test('SQL cheatsheet keyword cards render', async ({ page }) => {
  await openTool(page, 'sql-cheatsheet');
  const cards = page.locator('.kw-card');
  const count = await cards.count();
  expect(count).toBeGreaterThan(10);
  // Check keywords by exact name match
  await expect(page.locator('.kw-name:text-is("SELECT")')).toBeVisible();
  await expect(page.locator('.kw-name:text-is("COALESCE")')).toBeVisible();
});

// ===== URL Shortener =====

test('URL shortener shows error on invalid URL', async ({ page }) => {
  await openTool(page, 'url-shortener');
  await page.locator('#url-short-input').fill('not-a-url');
  await (await panelButton(page, 'url-shortener', 'Kısalt')).click();
  await expect(page.locator('#url-short-error')).toBeVisible();
});

// ===== Removed tools should NOT exist =====

test('removed tools are not in nav', async ({ page }) => {
  const allText = await page.locator('#tool-list').textContent();
  expect(allText).not.toContain('Regex Test');
  expect(allText).not.toContain('Lorem Ipsum');
  expect(allText).not.toContain('Hash Üretici');
  expect(allText).not.toContain('Renk Dönüştürücü');
});

// ===== UUID Generator =====

test('UUID generator üretir', async ({ page }) => {
  await openTool(page, 'uuid-generator');
  await (await panelButton(page, 'uuid-generator', 'Üret')).click();
  // uuid-output is a <textarea>, use inputValue()
  const result = await page.locator('#uuid-output').inputValue();
  expect(result).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
});

// ===== Word Counter Language Switching =====

test('word counter labels translate to English', async ({ page }) => {
  // Open word counter
  await openTool(page, 'word-counter');

  // Switch to English
  await page.locator('#lang-toggle').click();

  // Check labels within the active word counter panel
  const panel = page.locator('#panel-word-counter');
  await expect(panel.locator('[data-i18n="wc.chars"]')).toHaveText('CHARACTERS');
  await expect(panel.locator('[data-i18n="wc.words"]')).toHaveText('WORDS');
  await expect(panel.locator('[data-i18n="wc.sentences"]')).toHaveText('SENTENCES');
  await expect(panel.locator('[data-i18n="wc.paragraphs"]')).toHaveText('PARAGRAPHS');

  // Check nav item also translates
  await expect(page.locator('.tool-nav-item[data-tool="word-counter"] span:last-child')).toHaveText('Word Counter');

  // Switch back to Turkish
  await page.locator('#lang-toggle').click();

  await expect(panel.locator('[data-i18n="wc.chars"]')).toHaveText('KARAKTER');
  await expect(panel.locator('[data-i18n="wc.words"]')).toHaveText('KELİME');
});

test('SQL and KQL template descriptions translate correctly', async ({ page }) => {
  // Open SQL cheatsheet
  await openTool(page, 'sql-cheatsheet');

  // Switch to English
  await page.locator('#lang-toggle').click();

  // Check that descriptions are in English (Filters rows. Like SQL WHERE.)
  const sqlDescEn = page.locator('.kw-desc').first();
  await expect(sqlDescEn).toContainText('Filters rows');

  // Switch back to Turkish
  await page.locator('#lang-toggle').click();

  // Check that descriptions are back to Turkish (Satırları filtreler)
  const sqlDescTr = page.locator('.kw-desc').first();
  await expect(sqlDescTr).toContainText('Satırları filtreler');
});
