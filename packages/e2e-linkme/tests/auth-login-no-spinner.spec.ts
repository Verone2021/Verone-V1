import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Anti-Régression Login (Spinner Infini)
 *
 * Valide le fix LM-AUTH-004 :
 * - Pas de spinner infini après clic "Connexion"
 * - Redirect vers dashboard < 10s
 * - Query user_app_roles exécutée correctement
 * - Pas de timeout 8s dans console
 *
 * @since 2026-01-30
 * @issue LM-AUTH-004
 */

// Configuration
const BASE_URL = process.env.LINKME_URL ?? 'http://localhost:3002';
const LOGIN_URL = `${BASE_URL}/login`;
const DASHBOARD_URL = `${BASE_URL}/dashboard`;

// Credentials de test (comptes DEV)
const TEST_USERS = {
  enseigne_admin: {
    email: 'admin@pokawa-test.fr',
    password: 'TestLinkMe2025',
    expectedRole: 'enseigne_admin',
  },
};

test.describe('LinkMe - Login Flow (Anti-Régression Spinner)', () => {
  test.beforeEach(async ({ page }) => {
    // Nettoyer les cookies/localStorage avant chaque test
    await page.context().clearCookies();
    await page.goto(LOGIN_URL);
  });

  test('should login successfully without infinite spinner (Enseigne Admin)', async ({
    page,
  }) => {
    const user = TEST_USERS.enseigne_admin;

    // Capturer les logs console pour détecter erreurs
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Remplir le formulaire
    await page.fill('[type="email"]', user.email);
    await page.fill('[type="password"]', user.password);

    // Cliquer sur "Connexion"
    const loginButton = page.locator('button:has-text("Se connecter")');
    await loginButton.click();

    // CRITIQUE: Attendre max 10s pour redirect dashboard
    // (Avant le fix, spinner infini = timeout 8s + pas de redirect)
    await expect(page).toHaveURL(new RegExp(`/dashboard`), {
      timeout: 10000,
    });

    // Vérifier qu'on est bien sur le dashboard
    await expect(page).toHaveURL(DASHBOARD_URL);

    // Vérifier qu'un élément stable du dashboard est visible
    // (menu utilisateur, logo, ou titre dashboard)
    const userMenu = page.locator('[data-testid="user-menu"]');
    const dashboardTitle = page.locator('h1:has-text("Dashboard")');

    // Au moins un des deux doit être visible
    const isUserMenuVisible = await userMenu.isVisible().catch(() => false);
    const isDashboardTitleVisible = await dashboardTitle
      .isVisible()
      .catch(() => false);

    expect(isUserMenuVisible || isDashboardTitleVisible).toBe(true);

    // Vérifier qu'il n'y a pas de timeout 8s dans la console
    const hasTimeoutError = consoleErrors.some(error =>
      error.includes('TIMEOUT')
    );
    expect(hasTimeoutError).toBe(false);
  });

  test('should NOT show timeout error in console', async ({ page }) => {
    const user = TEST_USERS.enseigne_admin;

    // Capturer les logs console
    const consoleLogs: { type: string; text: string }[] = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    // Login
    await page.fill('[type="email"]', user.email);
    await page.fill('[type="password"]', user.password);
    await page.click('button:has-text("Se connecter")');

    // Attendre redirect
    await page.waitForURL(new RegExp(`/dashboard`), { timeout: 10000 });

    // Vérifier qu'il n'y a PAS de log "[AuthContext] TIMEOUT"
    const timeoutLogs = consoleLogs.filter(
      log =>
        log.type === 'error' &&
        (log.text.includes('TIMEOUT') || log.text.includes('suspendu'))
    );

    expect(timeoutLogs.length).toBe(0);
  });

  test('should make network request to user_app_roles after login', async ({
    page,
  }) => {
    const user = TEST_USERS.enseigne_admin;

    // Intercepter les requêtes réseau
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });

    // Login
    await page.fill('[type="email"]', user.email);
    await page.fill('[type="password"]', user.password);
    await page.click('button:has-text("Se connecter")');

    // Attendre redirect
    await page.waitForURL(new RegExp(`/dashboard`), { timeout: 10000 });

    // Vérifier qu'une requête vers user_app_roles a été faite
    const hasUserRoleQuery = requests.some(
      url =>
        url.includes('/rest/v1/user_app_roles') ||
        url.includes('/rest/v1/v_linkme_users')
    );

    expect(hasUserRoleQuery).toBe(true);
  });

  test('should complete login flow in under 8 seconds', async ({ page }) => {
    const user = TEST_USERS.enseigne_admin;

    await page.fill('[type="email"]', user.email);
    await page.fill('[type="password"]', user.password);

    const startTime = Date.now();

    await page.click('button:has-text("Se connecter")');
    await page.waitForURL(new RegExp(`/dashboard`), { timeout: 10000 });

    const duration = Date.now() - startTime;

    // Login DOIT se terminer en moins de 8s
    // (Avant le fix: timeout à 8s puis échec)
    expect(duration).toBeLessThan(8000);

    console.log(`✅ Login completed in ${duration}ms`);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Tester que les erreurs de login fonctionnent toujours
    await page.fill('[type="email"]', 'invalid@example.com');
    await page.fill('[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Se connecter")');

    // Vérifier message d'erreur
    const errorMessage = page.locator('text=/incorrect|invalid/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Vérifier qu'on reste sur /login
    await expect(page).toHaveURL(LOGIN_URL);
  });

  test('should show error for user without LinkMe access', async ({
    page: _page,
  }) => {
    // Ce test nécessite un compte qui n'a PAS accès à LinkMe
    // TODO: Ajouter credentials pour un user back-office only
    // Expected behavior:
    // 1. Login Supabase réussit
    // 2. Query user_app_roles retourne vide
    // 3. signOut() appelé
    // 4. Message "Vous n'avez pas accès à LinkMe"
  });
});

test.describe('LinkMe - Login UI/UX', () => {
  test('should show loading state during login', async ({ page }) => {
    await page.goto(LOGIN_URL);

    const user = TEST_USERS.enseigne_admin;

    await page.fill('[type="email"]', user.email);
    await page.fill('[type="password"]', user.password);

    // Cliquer et immédiatement vérifier le loading state
    await page.click('button:has-text("Se connecter")');

    // Le bouton devrait montrer un indicateur de chargement
    const loadingButton = page.locator(
      'button:has-text("Connexion"), button:has-text("Chargement")'
    );
    await expect(loadingButton).toBeVisible({ timeout: 1000 });

    // Puis redirect vers dashboard
    await page.waitForURL(new RegExp(`/dashboard`), { timeout: 10000 });
  });

  test('should NOT show infinite spinner after click', async ({ page }) => {
    await page.goto(LOGIN_URL);

    const user = TEST_USERS.enseigne_admin;

    await page.fill('[type="email"]', user.email);
    await page.fill('[type="password"]', user.password);
    await page.click('button:has-text("Se connecter")');

    // Attendre 5 secondes
    await page.waitForTimeout(5000);

    // Soit on est sur le dashboard, soit on voit une erreur
    // Mais PAS de spinner infini
    const currentUrl = page.url();
    const isOnDashboard = currentUrl.includes('/dashboard');
    const hasError = await page
      .locator('text=/erreur|error/i')
      .isVisible()
      .catch(() => false);

    // Au moins un des deux doit être vrai (pas de limbo)
    expect(isOnDashboard || hasError).toBe(true);
  });
});
