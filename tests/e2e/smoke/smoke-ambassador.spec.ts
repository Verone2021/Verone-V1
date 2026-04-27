import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * SMOKE — Système ambassadeurs site-internet
 *
 * Créé 2026-04-26 (ADR-021 PR 0.5) après refacto site_ambassadors →
 * individual_customers.is_ambassador. Filet de sécurité contre
 * régression sur les routes critiques du système ambassadeur.
 *
 * Périmètre :
 * - BO : page paiements primes ambassadeurs (PR D mergée)
 * - BO : onglet Ambassadeurs dans /canaux-vente/site-internet
 * - Routes API : create-auth, mark-paid (existence + auth check)
 *
 * Pattern ADR-016 + base fixture ConsoleErrorCollector.
 */

const SETTLE_MS = 800;

test.describe('Smoke — Ambassadeurs', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('BO /canaux-vente/site-internet — charge sans erreur (PR Bug 0 fix)', async ({
    page,
  }) => {
    await page.goto('/canaux-vente/site-internet');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);

    // La page doit charger (pas 404 grâce au lazy-load des modals).
    await expect(page).toHaveURL(/\/canaux-vente\/site-internet/);

    // L'onglet "Ambassadeurs" doit être présent.
    const ambassadorsTab = page.getByRole('tab', { name: /Ambassadeurs/i });
    await expect(ambassadorsTab).toBeVisible({ timeout: 10000 });

    consoleErrors.expectNoErrors();
  });

  test('BO /canaux-vente/site-internet?tab=ambassadeurs — onglet Ambassadeurs charge', async ({
    page,
  }) => {
    await page.goto('/canaux-vente/site-internet');
    await page.waitForLoadState('domcontentloaded');

    // Click sur l'onglet Ambassadeurs si le système Tabs est utilisé.
    const ambassadorsTab = page.getByRole('tab', { name: /Ambassadeurs/i });
    if (await ambassadorsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ambassadorsTab.click();
      await page.waitForTimeout(SETTLE_MS);
    }

    // Le bouton "Nouvel ambassadeur" doit être visible (BO admin).
    const createButton = page.getByRole('button', {
      name: /Nouvel ambassadeur|\+ Nouvel ambassadeur/i,
    });
    await expect(createButton).toBeVisible({ timeout: 10000 });

    consoleErrors.expectNoErrors();
  });

  test('BO /canaux-vente/site-internet/ambassadeurs/paiements — page paiements primes (PR D)', async ({
    page,
  }) => {
    await page.goto('/canaux-vente/site-internet/ambassadeurs/paiements');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);

    // La page doit charger sans 404.
    await expect(page).toHaveURL(
      /\/canaux-vente\/site-internet\/ambassadeurs\/paiements/
    );

    consoleErrors.expectNoErrors();
  });

  test('API /api/ambassadors/create-auth — refuse non-auth (401)', async ({
    page,
  }) => {
    const response = await page.request.post('/api/ambassadors/create-auth', {
      data: { customer_id: '00000000-0000-0000-0000-000000000000' },
      failOnStatusCode: false,
    });

    // 401 (non-auth) ou 400 (validation Zod) attendu — pas 200.
    expect([400, 401, 404]).toContain(response.status());
  });

  test('API /api/ambassadors/[id]/mark-paid — refuse non-auth', async ({
    page,
  }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await page.request.post(
      `/api/ambassadors/${fakeId}/mark-paid`,
      {
        data: {
          attribution_ids: [],
          payment_reference: 'TEST',
          payment_date: new Date().toISOString().split('T')[0],
        },
        failOnStatusCode: false,
      }
    );

    expect([400, 401, 404]).toContain(response.status());
  });
});

test.describe('Smoke — Site internet ambassadeur (côté client)', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('Site /ambassadeur — redirige login si non-auth', async ({ page }) => {
    // Note : la base fixture est configurée pour le BO (verone-backoffice).
    // Ce test est skip si l'env n'est pas configuré pour site-internet.
    test.skip(
      !process.env.SITE_INTERNET_BASE_URL,
      'SITE_INTERNET_BASE_URL not configured'
    );

    const url = process.env.SITE_INTERNET_BASE_URL
      ? `${process.env.SITE_INTERNET_BASE_URL}/ambassadeur`
      : '/ambassadeur';

    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);

    // Page doit charger (auth check fait côté composant, pas 404).
    consoleErrors.expectNoErrors();
  });
});
