import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * SMOKE — Canaux de vente (hors LinkMe)
 *
 * Créé 2026-04-24 dans INFRA-HARDENING-002.
 *
 * Couvre site-internet, google-merchant, meta, prix-clients. LinkMe a
 * son propre fichier (smoke-linkme).
 *
 * Pattern ADR-016.
 */

const SETTLE_MS = 800;

test.describe('Smoke — Canaux', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('Canaux hub — charge', async ({ page }) => {
    await page.goto('/canaux-vente');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/canaux-vente$/);
    consoleErrors.expectNoErrors();
  });

  test('Prix-clients — charge', async ({ page }) => {
    await page.goto('/canaux-vente/prix-clients');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Site-internet — settings charge', async ({ page }) => {
    await page.goto('/canaux-vente/site-internet');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Google Merchant — settings charge', async ({ page }) => {
    await page.goto('/canaux-vente/google-merchant');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Meta Commerce — settings charge', async ({ page }) => {
    await page.goto('/canaux-vente/meta');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });
});
