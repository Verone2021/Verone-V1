/**
 * Test Playwright autonome — vérification fix BO-FIN-INVOICE-VAT-001
 *
 * Ouvre la page commande SO-2026-00178, clique "Créer une facture",
 * lit la TVA et les totaux dans la preview, ferme sans valider.
 *
 * Lancement : node scripts/test-invoice-vat-so178.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = 'http://localhost:3000';
const ORDER_URL = `${BASE_URL}/canaux-vente/linkme/commandes/16bced8e-d7f4-4437-98b4-b7d0564171f8/details`;
const LOGIN_EMAIL = 'veronebyromeo@gmail.com';
const LOGIN_PASSWORD = 'Abc123456';

const SHOT_DIR = join(process.cwd(), '.playwright-mcp/screenshots/20260531');
mkdirSync(SHOT_DIR, { recursive: true });

function stamp() {
  return new Date()
    .toISOString()
    .replace(/[-:T]/g, '')
    .slice(8, 14);
}

function shotPath(name) {
  return join(SHOT_DIR, `so178-${name}-${stamp()}.png`);
}

const report = {
  startedAt: new Date().toISOString(),
  steps: [],
  consoleErrors: [],
  result: 'PENDING',
};

function log(label, data = null) {
  const entry = { t: new Date().toISOString(), label, data };
  report.steps.push(entry);
  console.log(`[${entry.t}] ${label}`, data ?? '');
}

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

page.on('console', msg => {
  if (msg.type() === 'error') {
    report.consoleErrors.push({ text: msg.text() });
  }
});
page.on('pageerror', err => {
  report.consoleErrors.push({ text: `pageerror: ${err.message}` });
});

try {
  log('1. Navigate to /login (commit-only wait, dev server compiles lazily)');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'commit', timeout: 180000 });
  log('1b. Page commit done, waiting for email input (up to 3 min for compile)');

  // Si déjà connecté, /login redirige ailleurs ; sinon on attend le form.
  // On attend l'email OU une URL non-login (cas déjà connecté).
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 180000 });
    log('2. Email input visible, filling credentials');
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.toString().includes('/login'), {
      timeout: 60000,
    });
    log('2b. Logged in', { url: page.url() });
  } catch {
    if (!page.url().includes('/login')) {
      log('2. Already logged in (redirect happened)', { url: page.url() });
    } else {
      throw new Error('Login form did not appear after 180s');
    }
  }

  log('3. Navigate to order page (dev server compiles lazily again)');
  await page.goto(ORDER_URL, { waitUntil: 'commit', timeout: 180000 });
  log('3b. Order page commit done, waiting for PaymentSection');
  await page.waitForSelector('text=/Paiement/i', { timeout: 180000 });
  await page.waitForTimeout(2000);

  log('4. Order page reached', { url: page.url() });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const shot1 = shotPath('1-page-loaded');
  await page.screenshot({ path: shot1, fullPage: true });
  log('5. Screenshot 1 (page loaded)', { path: shot1 });

  // Cherche le bouton Facture dans PaymentSection. Le texte exact est "Facture"
  // (cf. PaymentSection.tsx:441). On filtre pour éviter "Facture brouillon".
  log('6. Looking for Facture button in PaymentSection');
  const factureBtn = page.getByRole('button', { name: /^Facture$/ });
  await factureBtn.waitFor({ state: 'visible', timeout: 10000 });
  log('7. Facture button found, clicking');
  await factureBtn.click();

  // Wait for modal — title is "Créer une facture" or section "Articles"
  log('8. Waiting for invoice modal');
  await page.waitForSelector('text=/Articles/i', { timeout: 10000 });
  await page.waitForTimeout(1500);

  const shot2 = shotPath('2-modal-opened');
  await page.screenshot({ path: shot2, fullPage: true });
  log('9. Screenshot 2 (modal opened)', { path: shot2 });

  // Read TVA values from the items table (column "TVA")
  log('10. Reading TVA values from modal DOM');
  const tvaValues = await page.evaluate(() => {
    // The items table has headers: Article | Qté | Prix HT | TVA | Total HT
    // We find the rows in the InvoiceItemsSection
    const tables = Array.from(document.querySelectorAll('table'));
    const articleTable = tables.find(t =>
      t.textContent?.includes('Article') && t.textContent?.includes('TVA')
    );
    if (!articleTable) return { error: 'no-article-table' };
    const rows = Array.from(articleTable.querySelectorAll('tbody tr'));
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      return {
        cellsCount: cells.length,
        cells: cells.map(c => c.textContent?.trim()),
      };
    });
  });
  log('11. Items table content', tvaValues);

  // Read totals from preview (TVA total + TTC)
  const totals = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    // Search for euro-formatted amounts near keywords
    const ttcMatch = bodyText.match(/Total\s*TTC[^\d]{0,20}([\d\s,.]+)\s*€/i);
    const tvaMatch = bodyText.match(/Total\s*TVA[^\d]{0,20}([\d\s,.]+)\s*€/i)
      || bodyText.match(/TVA[^\d\n]{0,5}([\d\s,.]+)\s*€/i);
    const htMatch = bodyText.match(/Total\s*HT[^\d]{0,20}([\d\s,.]+)\s*€/i);
    return {
      totalHT: htMatch?.[1]?.trim() ?? null,
      totalTVA: tvaMatch?.[1]?.trim() ?? null,
      totalTTC: ttcMatch?.[1]?.trim() ?? null,
    };
  });
  log('12. Totals preview', totals);

  // Decide success based on the values
  const tvaCells = Array.isArray(tvaValues)
    ? tvaValues.map(r => r.cells?.[3] ?? '').filter(Boolean)
    : [];
  const anyZero = tvaCells.some(v => v?.includes('0%'));
  const allTwenty = tvaCells.length > 0 && tvaCells.every(v => v?.includes('20%'));

  report.assertions = {
    items: tvaValues,
    tvaCellsRead: tvaCells,
    anyTvaAtZero: anyZero,
    allTvaAtTwenty: allTwenty,
    totals,
  };

  log('13. Closing modal with Escape (no creation)');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);

  const shot3 = shotPath('3-modal-closed');
  await page.screenshot({ path: shot3, fullPage: true });
  log('14. Screenshot 3 (modal closed)', { path: shot3 });

  report.result = allTwenty && !anyZero ? 'PASS' : 'FAIL';
} catch (err) {
  report.result = 'ERROR';
  report.error = { message: err.message, stack: err.stack };
  try {
    const errShot = shotPath('error');
    await page.screenshot({ path: errShot, fullPage: true });
    report.errorScreenshot = errShot;
  } catch {}
} finally {
  report.endedAt = new Date().toISOString();
  const reportPath = join(SHOT_DIR, `report-${stamp()}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('\n=== REPORT ===');
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nFull report: ${reportPath}`);
  await ctx.close();
  await browser.close();
  process.exit(report.result === 'PASS' ? 0 : 1);
}
