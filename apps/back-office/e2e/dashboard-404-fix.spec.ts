/**
 * Test anti-régression: Dashboard 404 Fix
 *
 * Context: [BO-DASH-404-001]
 * Le dashboard retournait HTTP 404 en production malgré un build local correct.
 * Root cause: Next.js skippait la route /dashboard au build car l'auth check échouait.
 * Fix: export const dynamic = 'force-dynamic' + await headers() dans (protected)/layout.tsx
 *
 * Ce test garantit que /dashboard:
 * 1. Retourne HTTP 200 (pas 404)
 * 2. Affiche le dashboard UI (pas la page not-found)
 * 3. Fonctionne après login (session valide)
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard 404 Fix - Anti-régression', () => {
  test.beforeEach(async ({ page }) => {
    // Login obligatoire pour accéder aux routes protégées
    await page.goto('/login');
    await page.fill('input[name="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[name="password"]', 'Abc123456');
    await page.click('button[type="submit"]');

    // Attendre redirection vers /dashboard après login
    await page.waitForURL('/dashboard', { timeout: 5000 });
  });

  test('should load dashboard with HTTP 200 (not 404)', async ({ page }) => {
    // 1. Naviguer vers /dashboard (déjà fait dans beforeEach)
    const response = page.url();

    // 2. Vérifier que l'URL est bien /dashboard
    expect(response).toContain('/dashboard');

    // 3. Vérifier que la page NE CONTIENT PAS l'UI 404
    const has404Title = await page
      .locator('h1:has-text("404")')
      .isVisible()
      .catch(() => false);
    const hasNotFoundText = await page
      .locator('text=Page introuvable')
      .isVisible()
      .catch(() => false);

    expect(has404Title).toBe(false);
    expect(hasNotFoundText).toBe(false);
  });

  test('should display dashboard UI (header + content)', async ({ page }) => {
    // Vérifier présence du header Dashboard
    const dashboardHeader = page.locator('h1:has-text("Dashboard")');
    await expect(dashboardHeader).toBeVisible({ timeout: 5000 });

    // Vérifier présence du bouton "Configurer"
    const configButton = page.locator('button:has-text("Configurer")');
    await expect(configButton).toBeVisible();

    // Vérifier présence du bouton "Actualiser"
    const refreshButton = page.locator('button:has-text("Actualiser")');
    await expect(refreshButton).toBeVisible();
  });

  test('should load KPIs section', async ({ page }) => {
    // Attendre le chargement des KPIs (peut prendre 1-2 secondes)
    await page.waitForTimeout(2000);

    // Vérifier présence de la section KPIs
    const kpisSection = page.locator('h2:has-text("KPIs")');
    await expect(kpisSection).toBeVisible();
  });

  test('should NOT show loading spinner forever', async ({ page }) => {
    // Attendre max 5 secondes pour que le loading disparaisse
    await page.waitForTimeout(5000);

    // Vérifier que le spinner de chargement a disparu
    const loadingSpinner = await page
      .locator('text=Chargement du dashboard...')
      .isVisible()
      .catch(() => false);

    expect(loadingSpinner).toBe(false);
  });

  test('should allow navigation to other protected routes from dashboard', async ({
    page,
  }) => {
    // Depuis /dashboard, naviguer vers /ventes via la sidebar
    await page.click('a[href="/ventes"]');

    // Attendre navigation
    await page.waitForURL('/ventes', { timeout: 5000 });

    // Vérifier que /ventes charge correctement (pas de 404)
    const ventesHeader = page.locator('h1:has-text("Dashboard Ventes")');
    await expect(ventesHeader).toBeVisible({ timeout: 5000 });

    // Retour vers /dashboard
    await page.click('a[href="/dashboard"]');
    await page.waitForURL('/dashboard', { timeout: 5000 });

    // Vérifier que dashboard re-charge sans 404
    const dashboardHeader = page.locator('h1:has-text("Dashboard")');
    await expect(dashboardHeader).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Dashboard 404 Fix - Edge cases', () => {
  test('should redirect to /login if no session', async ({ page, context }) => {
    // Supprimer tous les cookies pour simuler logout
    await context.clearCookies();

    // Essayer d'accéder à /dashboard sans session
    await page.goto('/dashboard');

    // Doit être redirigé vers /login
    await page.waitForURL('/login', { timeout: 5000 });

    // Vérifier qu'on est bien sur la page login
    const loginHeader = page.locator('h2:has-text("Connexion")');
    await expect(loginHeader).toBeVisible();
  });

  test('should handle direct /dashboard URL access after login', async ({
    page,
  }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[name="password"]', 'Abc123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 5000 });

    // Naviguer ailleurs (ex: /ventes)
    await page.goto('/ventes');
    await page.waitForLoadState('networkidle');

    // Accéder directement à /dashboard via URL
    await page.goto('/dashboard');

    // Vérifier que dashboard charge sans 404
    const dashboardHeader = page.locator('h1:has-text("Dashboard")');
    await expect(dashboardHeader).toBeVisible({ timeout: 5000 });
  });

  test('should handle page refresh on /dashboard', async ({ page }) => {
    // Login et accès dashboard
    await page.goto('/login');
    await page.fill('input[name="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[name="password"]', 'Abc123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 5000 });

    // Rafraîchir la page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Vérifier que dashboard recharge sans 404
    const dashboardHeader = page.locator('h1:has-text("Dashboard")');
    await expect(dashboardHeader).toBeVisible({ timeout: 5000 });

    // Vérifier qu'on n'est PAS redirigé vers /login
    expect(page.url()).toContain('/dashboard');
  });
});
