import { test, expect } from '@playwright/test';

/**
 * Smoke tests LinkMe - Echoue sur toute erreur console ou page error
 *
 * Pattern: accumule les erreurs et assert a la fin
 * @see https://playwright.dev/docs/api/class-page#page-event-pageerror
 */

test.describe('LinkMe Smoke Tests', () => {
  test('Page /login ne doit pas crasher (console clean)', async ({ page }) => {
    const errors = [];

    // Capturer les page errors (exceptions non catch)
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));

    // Capturer les console.error
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Ignorer certaines erreurs connues non-bloquantes
        const text = msg.text();
        if (
          text.includes('Download the React DevTools') ||
          text.includes('Multiple GoTrueClient')
        ) {
          return;
        }
        errors.push(`console.error: ${text}`);
      }
    });

    await page.goto('/login');

    // Attendre que la page soit chargee
    await page.waitForLoadState('networkidle');

    // Verifier qu'un element UI cle est visible (le formulaire de login)
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible({
      timeout: 10000,
    });

    // Assert: aucune erreur
    expect(errors, `Console/page errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('Page /ventes ne doit pas crasher (console clean)', async ({ page }) => {
    const errors = [];

    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          text.includes('Download the React DevTools') ||
          text.includes('Multiple GoTrueClient')
        ) {
          return;
        }
        errors.push(`console.error: ${text}`);
      }
    });

    await page.goto('/ventes');
    await page.waitForLoadState('networkidle');

    // La page ventes peut afficher un loader ou une table
    // On verifie juste qu'elle charge sans erreur
    await expect(page.locator('body')).toBeVisible();

    expect(errors, `Console/page errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('Page /profil ne doit pas crasher (console clean)', async ({ page }) => {
    const errors = [];

    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          text.includes('Download the React DevTools') ||
          text.includes('Multiple GoTrueClient')
        ) {
          return;
        }
        errors.push(`console.error: ${text}`);
      }
    });

    await page.goto('/profil');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();

    expect(errors, `Console/page errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('Page / (accueil) ne doit pas crasher (console clean)', async ({
    page,
  }) => {
    const errors = [];

    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          text.includes('Download the React DevTools') ||
          text.includes('Multiple GoTrueClient')
        ) {
          return;
        }
        errors.push(`console.error: ${text}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verifier le heading principal (page d'accueil)
    await expect(
      page.getByRole('heading', { name: /votre plateforme/i })
    ).toBeVisible({ timeout: 10000 });

    expect(errors, `Console/page errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('Page /dashboard ne doit pas crasher (console clean)', async ({
    page,
  }) => {
    const errors = [];

    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          text.includes('Download the React DevTools') ||
          text.includes('Multiple GoTrueClient')
        ) {
          return;
        }
        errors.push(`console.error: ${text}`);
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();

    expect(errors, `Console/page errors:\n${errors.join('\n')}`).toEqual([]);
  });
});
