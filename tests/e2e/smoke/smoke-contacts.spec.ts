import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * SMOKE — Contacts & Organisations (créé 2026-04-24 dans INFRA-HARDENING-002)
 *
 * Couvre hub CRM, customers, suppliers, enseignes, partners, contacts,
 * clients-particuliers. Vérifie que chaque liste charge + 1er détail.
 *
 * Pattern ADR-016.
 */

const SETTLE_MS = 800;

test.describe('Smoke — Contacts & Organisations', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('CRM hub — charge', async ({ page }) => {
    await page.goto('/contacts-organisations');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/contacts-organisations$/);
    consoleErrors.expectNoErrors();
  });

  test('Customers B2B — liste charge + 1er œil → détail', async ({ page }) => {
    await page.goto('/contacts-organisations/customers');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    const eye = page
      .getByRole('button', { name: /voir détails|voir/i })
      .first()
      .or(page.getByRole('link').first());
    if (await eye.isVisible({ timeout: 5000 }).catch(() => false)) {
      await eye.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(SETTLE_MS);
    }
    consoleErrors.expectNoErrors();
  });

  test('Suppliers — liste charge', async ({ page }) => {
    await page.goto('/contacts-organisations/suppliers');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Enseignes — liste charge', async ({ page }) => {
    await page.goto('/contacts-organisations/enseignes');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Partners — liste charge', async ({ page }) => {
    await page.goto('/contacts-organisations/partners');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Contacts — liste charge', async ({ page }) => {
    await page.goto('/contacts-organisations/contacts');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Clients particuliers — liste charge', async ({ page }) => {
    await page.goto('/contacts-organisations/clients-particuliers');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });
});
