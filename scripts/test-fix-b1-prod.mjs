/**
 * Test régression Pokawa Montpellier 1 dans combobox Organisations (B1)
 * sur prod après release BO-CONSULT-CORR-009.
 *
 * Réf règle agent : .claude/rules/non-regression.md (BO-NONREG-001).
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = 'https://verone-back-office.vercel.app';
const LOGIN_EMAIL = 'veronebyromeo@gmail.com';
const LOGIN_PASSWORD = 'Abc123456';

const SHOT_DIR = join(process.cwd(), '.playwright-mcp/screenshots/20260603');
mkdirSync(SHOT_DIR, { recursive: true });
function stamp() { return new Date().toISOString().replace(/[-:T]/g, '').slice(8, 14); }

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR' });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 150)); });

try {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'commit', timeout: 90000 });
  await page.waitForSelector('input[type="email"]', { timeout: 60000 });
  await page.fill('input[type="email"]', LOGIN_EMAIL);
  await page.fill('input[type="password"]', LOGIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 30000 });

  await page.goto(`${BASE_URL}/consultations/create`, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // Open combobox
  await page.getByRole('combobox').first().click({ timeout: 5000 });
  await page.waitForTimeout(2000);

  // Switch to Organisations tab (radix Tabs uses role="tab")
  const orgTab = page.getByRole('tab', { name: /^Organisations$/i });
  await orgTab.click({ timeout: 5000 });
  await page.waitForTimeout(2000);

  // Type search
  await page.locator('input[placeholder*="echerch"]').first().fill('Pokawa Montpellier');
  await page.waitForTimeout(3000);

  const shotPath = join(SHOT_DIR, `b1-prod-search-${stamp()}.png`);
  await page.screenshot({ path: shotPath, fullPage: true });

  // Check for "Aucune organisation trouvée" or for Pokawa Montpellier 1
  const html = await page.content();
  const noResults = html.includes('Aucune organisation trouvée');
  const pokawaFound = html.includes('Pokawa Montpellier 1');

  const result = {
    test: 'B1 — Pokawa Montpellier 1 visible dans combobox Organisations',
    expected: 'Pokawa Montpellier 1 trouvée',
    noResultsText: noResults,
    pokawaMontpellierFound: pokawaFound,
    pass: pokawaFound && !noResults,
    screenshot: shotPath,
    consoleErrors: errors.length,
    prod: BASE_URL,
  };

  const reportPath = join(SHOT_DIR, `report-fix-b1-prod-${stamp()}.json`);
  writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log('\n=== B1 FIX TEST — PROD ===');
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error('Test error:', err.message);
} finally {
  await ctx.close();
  await browser.close();
  process.exit(0);
}
