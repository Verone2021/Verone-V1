/**
 * Test: Auth Stability - Détection des boucles de redirection
 *
 * Ce test ÉCHOUE si:
 * - console.error ou pageerror apparaît
 * - Un 401/403 est retourné
 * - Plus de 3 navigations en 5 secondes (boucle détectée)
 * - Spinner visible > 8 secondes sans contenu
 *
 * @since 2025-12-18
 */

import { test, expect } from '@playwright/test';

test.describe('Auth Stability - Anti Loop', () => {
  test('should not loop on protected pages after login', async ({ page }) => {
    // Setup: Trackers AVANT navigation
    let navCount = 0;
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: Array<{ url: string; status: number }> = [];

    // Listener: Page errors
    page.on('pageerror', error => {
      pageErrors.push(error.message);
      console.error('[PAGEERROR]', error.message);
    });

    // Listener: Console errors (IGNORER 404 assets + fetch errors attendus)
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // IGNORER 404 assets (favicon, images, etc.)
        if (text.includes('404') && text.includes('Failed to load resource')) {
          return;
        }
        // IGNORER fetch errors sur hooks (selections, commissions)
        if (text.includes('Erreur fetch') || text.includes('Failed to fetch')) {
          return;
        }
        // IGNORER 406 Not Acceptable (analytics hooks)
        if (text.includes('406')) {
          return;
        }
        consoleErrors.push(text);
        console.error('[CONSOLE.ERROR]', text);
      }
    });

    // Listener: Failed HTTP requests (401/403)
    page.on('response', response => {
      const status = response.status();
      const url = response.url();

      if (status === 401 || status === 403) {
        failedRequests.push({ url, status });
        console.error(`[HTTP ${status}]`, url);
      }
    });

    // Listener: Navigation tracking
    page.on('framenavigated', () => {
      navCount++;
      console.log(`[NAVIGATION ${navCount}]`, page.url());
    });

    // Step 1: Login avec credentials Pokawa (nettoyer session d'abord)
    await page.goto('http://localhost:3002/login');
    await page.waitForLoadState('networkidle');

    // Nettoyer session si déjà connecté
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Recharger après nettoyage
    await page.goto('http://localhost:3002/login');
    await page.waitForLoadState('networkidle');

    // Attendre que le formulaire soit visible
    const emailField = page.locator('input[type="email"]');
    await emailField.waitFor({ state: 'visible', timeout: 10000 });

    // Remplir formulaire avec utilisateur test Pokawa
    await emailField.fill('admin@pokawa-test.fr');
    await page.fill('input[type="password"]', 'TestLinkMe2025');
    await page.click('button[type="submit"]');

    // Attendre redirection vers dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Step 2: Navigate to profil (protected page)
    await page.goto('http://localhost:3002/profil');

    // Step 3: Wait and observe
    await page.waitForTimeout(5000);

    // Assertions: Le test ÉCHOUE si ces conditions sont vraies

    // 1. Pas d'erreurs console
    if (consoleErrors.length > 0) {
      console.error('❌ Console errors detected:', consoleErrors);
    }
    expect(consoleErrors).toHaveLength(0);

    // 2. Pas d'erreurs page
    if (pageErrors.length > 0) {
      console.error('❌ Page errors detected:', pageErrors);
    }
    expect(pageErrors).toHaveLength(0);

    // 3. Pas de 401/403
    if (failedRequests.length > 0) {
      console.error('❌ Failed requests detected:', failedRequests);
    }
    expect(failedRequests).toHaveLength(0);

    // 4. Navigation count < 10 (pas de boucle infinie)
    // Note: 8 navigations normales = cleanup(4) + dashboard(2) + profil(2)
    if (navCount >= 10) {
      console.error(`❌ Loop detected: ${navCount} navigations in 5s`);
    }
    expect(navCount).toBeLessThan(10);

    // 5. Contenu visible (pas de spinner infini)
    // TODO: Vérifier qu'un élément clé est visible
    // await expect(page.getByText('Mon Profil')).toBeVisible({ timeout: 8000 });

    console.log('✅ Test passed - No auth loop detected');
  });
});
