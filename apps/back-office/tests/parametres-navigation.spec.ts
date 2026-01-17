/**
 * 🔧 TESTS NAVIGATION PARAMÈTRES
 *
 * Tests pour vérifier l'accessibilité et la navigation
 * des pages Paramètres via la sidebar et par accès direct.
 *
 * Pages testées:
 * - /parametres (Général)
 * - /parametres/emails (Templates Email)
 * - /parametres/webhooks (Configuration Webhooks)
 * - /parametres/notifications (Notifications)
 */

import { test, expect } from '@playwright/test';

// Configuration commune : authentification requise
test.beforeEach(async ({ page }) => {
  // Viewport desktop standard
  await page.setViewportSize({ width: 1440, height: 900 });

  // Authentification sur le back-office
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  // S'authentifier (utiliser les credentials du back-office)
  await page.fill('input[type="email"]', 'pokawa-test@verone.io');
  await page.fill('input[type="password"]', 'music-test-2025');
  await page.click('button[type="submit"]');

  // Attendre la redirection vers le dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
});

test.describe('Pages Paramètres - Accès Direct', () => {
  test('Page /parametres se charge correctement', async ({ page }) => {
    await page.goto('/parametres');
    await expect(page.getByRole('heading', { name: /Paramètres/i })).toBeVisible();
  });

  test('Page /parametres/emails se charge correctement', async ({ page }) => {
    await page.goto('/parametres/emails');
    await expect(page.getByRole('heading', { name: /Templates Email/i })).toBeVisible();
  });

  test('Page /parametres/webhooks se charge correctement', async ({ page }) => {
    await page.goto('/parametres/webhooks');
    await expect(page.getByRole('heading', { name: /Configuration Webhooks/i })).toBeVisible();
  });

  test('Page /parametres/notifications se charge correctement', async ({ page }) => {
    await page.goto('/parametres/notifications');
    await expect(page.getByRole('heading', { name: /Notifications/i })).toBeVisible();
  });
});

test.describe('Navigation Sidebar - Paramètres', () => {
  test('Menu Paramètres ouvre le sous-menu au clic', async ({ page }) => {
    await page.goto('/dashboard');

    // Trouver et cliquer sur l'icône Paramètres dans la sidebar compacte
    // La sidebar utilise un Popover qui s'ouvre au clic
    const settingsButton = page.locator('aside button').filter({ hasText: /^$/ }).nth(-2); // Avant le bouton de déconnexion
    await settingsButton.click();

    // Vérifier que le popover s'ouvre avec les sous-menus
    await expect(page.getByText('Templates Email')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Webhooks')).toBeVisible();
    await expect(page.getByText('Notifications')).toBeVisible();
  });

  test('Navigation vers Templates Email fonctionne', async ({ page }) => {
    await page.goto('/dashboard');

    // Ouvrir le menu Paramètres
    const settingsButton = page.locator('aside button').filter({ hasText: /^$/ }).nth(-2);
    await settingsButton.click();

    // Cliquer sur Templates Email
    await page.getByText('Templates Email').click();

    // Vérifier la redirection
    await expect(page).toHaveURL(/\/parametres\/emails/, { timeout: 5000 });
    await expect(page.getByRole('heading', { name: /Templates Email/i })).toBeVisible();
  });

  test('Navigation vers Webhooks fonctionne', async ({ page }) => {
    await page.goto('/dashboard');

    // Ouvrir le menu Paramètres
    const settingsButton = page.locator('aside button').filter({ hasText: /^$/ }).nth(-2);
    await settingsButton.click();

    // Cliquer sur Webhooks
    await page.getByText('Webhooks').click();

    // Vérifier la redirection
    await expect(page).toHaveURL(/\/parametres\/webhooks/, { timeout: 5000 });
    await expect(page.getByRole('heading', { name: /Configuration Webhooks/i })).toBeVisible();
  });

  test('Navigation vers Notifications fonctionne', async ({ page }) => {
    await page.goto('/dashboard');

    // Ouvrir le menu Paramètres
    const settingsButton = page.locator('aside button').filter({ hasText: /^$/ }).nth(-2);
    await settingsButton.click();

    // Cliquer sur Notifications
    await page.getByText('Notifications').click();

    // Vérifier la redirection
    await expect(page).toHaveURL(/\/parametres\/notifications/, { timeout: 5000 });
    await expect(page.getByRole('heading', { name: /Notifications/i })).toBeVisible();
  });
});

test.describe('Contenu Pages Paramètres', () => {
  test('Page Templates Email affiche la liste', async ({ page }) => {
    await page.goto('/parametres/emails');

    // Vérifier présence de la barre de recherche
    const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
    await expect(searchInput).toBeVisible();

    // Vérifier qu'il y a au moins un template affiché
    // Les templates sont affichés dans des cards
    const templateCards = page.locator('[data-test="email-template-card"], .grid > div').first();
    await expect(templateCards).toBeVisible({ timeout: 5000 });
  });

  test('Page Webhooks affiche le bouton Nouveau', async ({ page }) => {
    await page.goto('/parametres/webhooks');

    // Vérifier bouton création
    await expect(page.getByRole('button', { name: /Nouveau webhook/i })).toBeVisible();

    // Vérifier barre de recherche
    const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('Création webhook - Modal s\'ouvre', async ({ page }) => {
    await page.goto('/parametres/webhooks');

    // Cliquer sur Nouveau webhook
    await page.getByRole('button', { name: /Nouveau webhook/i }).click();

    // Vérifier redirection vers /new
    await expect(page).toHaveURL(/\/parametres\/webhooks\/new/, { timeout: 5000 });
    await expect(page.getByText(/Nouveau Webhook/i)).toBeVisible();
  });

  test('Page Notifications affiche la configuration', async ({ page }) => {
    await page.goto('/parametres/notifications');

    // Vérifier que la page affiche le formulaire de configuration
    await expect(page.getByRole('heading', { name: /Notifications/i })).toBeVisible();

    // La page doit contenir au moins un formulaire ou des champs de configuration
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 5000 });
  });
});
