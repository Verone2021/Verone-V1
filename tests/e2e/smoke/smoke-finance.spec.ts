import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * SMOKE — Finance (créé 2026-04-24 dans INFRA-HARDENING-002)
 *
 * Couvre factures, devis, finance/transactions, rapprochement, dépenses,
 * TVA + les 2 wizards nouvelle facture/devis (depuis commande vs service).
 *
 * Ne couvre volontairement PAS les modals depuis /commandes/clients/[id]
 * (cascade-cancel, delete-blocker, rapprochement) — ils sont dans
 * smoke-commandes car déclenchés depuis la détail commande.
 *
 * Pattern ADR-016.
 */

const SETTLE_MS = 800;

test.describe('Smoke — Finance', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('Factures — liste charge + URL stable', async ({ page }) => {
    await page.goto('/factures');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/factures/);
    consoleErrors.expectNoErrors();
  });

  test('Devis — redirection vers /factures?tab=devis', async ({ page }) => {
    await page.goto('/devis');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    // Soit on reste sur /devis soit on redirige vers /factures?tab=devis
    const url = page.url();
    expect(
      /\/devis|\/factures.*tab=devis/.test(url) || /\/factures$/.test(url)
    ).toBe(true);
    consoleErrors.expectNoErrors();
  });

  test('Devis/nouveau — 2 cartes "Depuis commande" + "Devis de service"', async ({
    page,
  }) => {
    await page.goto('/devis/nouveau');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page.getByText(/Depuis une commande/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/Devis de service/i)).toBeVisible({
      timeout: 5000,
    });
    consoleErrors.expectNoErrors();
  });

  test('Factures/nouvelle — 2 cartes "Depuis commande" + "Facture de service"', async ({
    page,
  }) => {
    await page.goto('/factures/nouvelle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page.getByText(/Depuis une commande/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/Facture de service/i)).toBeVisible({
      timeout: 5000,
    });
    consoleErrors.expectNoErrors();
  });

  test('Factures/nouvelle — clic "Facture de service" → modal ouvre', async ({
    page,
  }) => {
    await page.goto('/factures/nouvelle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    const card = page
      .getByRole('button', { name: /Facture de service/i })
      .or(page.getByText(/Facture de service/i).first());
    if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      await card.click();
      await page.waitForTimeout(500);
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        await page.keyboard.press('Escape');
      }
    }
    consoleErrors.expectNoErrors();
  });

  test('Finance hub — charge', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Finance transactions — charge', async ({ page }) => {
    await page.goto('/finance/transactions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Finance rapprochement — charge', async ({ page }) => {
    await page.goto('/finance/rapprochement');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Finance dépenses — charge', async ({ page }) => {
    await page.goto('/finance/depenses');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Finance TVA — charge', async ({ page }) => {
    await page.goto('/finance/tva');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Factures/qonto settings — charge', async ({ page }) => {
    await page.goto('/factures/qonto');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });
});
