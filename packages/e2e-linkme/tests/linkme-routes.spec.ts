import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Routes LinkMe Back-Office
 *
 * Valide que toutes les routes LinkMe du Back-Office chargent correctement
 * avec les données de test (enseigne, affilié, sélection, commande)
 *
 * Routes testées :
 * 1. /canaux-vente/linkme (dashboard)
 * 2. /canaux-vente/linkme/organisations
 * 3. /canaux-vente/linkme/enseignes
 * 4. /canaux-vente/linkme/catalogue
 * 5. /canaux-vente/linkme/selections
 * 6. /canaux-vente/linkme/utilisateurs
 * 7. /canaux-vente/linkme/commissions
 * 8. /canaux-vente/linkme/analytics
 * 9. /canaux-vente/linkme/organisations/00000000-0000-0000-0000-000000000002
 * 10. /canaux-vente/linkme/enseignes/00000000-0000-0000-0000-000000000001
 *
 * @since 2026-02-04
 */

const BASE_URL = process.env.BACKOFFICE_URL ?? 'http://localhost:3000';
const LOGIN_URL = `${BASE_URL}/login`;

// Credentials pour staff Back-Office
const BACKOFFICE_USER = {
  email: 'veronebyromeo@gmail.com',
  password: 'Abc123456',
};

// Routes à tester
const LINKME_ROUTES = [
  {
    path: '/canaux-vente/linkme',
    name: 'LinkMe Dashboard',
  },
  {
    path: '/canaux-vente/linkme/organisations',
    name: 'Organisations',
  },
  {
    path: '/canaux-vente/linkme/enseignes',
    name: 'Enseignes',
  },
  {
    path: '/canaux-vente/linkme/catalogue',
    name: 'Catalogue',
  },
  {
    path: '/canaux-vente/linkme/selections',
    name: 'Sélections',
  },
  {
    path: '/canaux-vente/linkme/utilisateurs',
    name: 'Utilisateurs',
  },
  {
    path: '/canaux-vente/linkme/commissions',
    name: 'Commissions',
  },
  {
    path: '/canaux-vente/linkme/analytics',
    name: 'Analytics',
  },
  {
    path: '/canaux-vente/linkme/organisations/00000000-0000-0000-0000-000000000002',
    name: 'Organisation Detail (Test Data)',
  },
  {
    path: '/canaux-vente/linkme/enseignes/00000000-0000-0000-0000-000000000001',
    name: 'Enseigne Detail (Test Data)',
  },
];

test.describe('Back-Office LinkMe Routes', () => {
  test.beforeAll(async ({ browser }) => {
    // Se connecter une fois et réutiliser le contexte pour tous les tests
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Connecting to Back-Office...');
    await page.goto(LOGIN_URL);

    // Remplir le formulaire de connexion
    await page.fill('input[type="email"]', BACKOFFICE_USER.email);
    await page.fill('input[type="password"]', BACKOFFICE_USER.password);
    await page.click('button[type="submit"]');

    // Attendre la redirection vers le dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
    console.log('Connected successfully!');

    await page.close();
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login avant chaque test
    await page.goto(LOGIN_URL);
    await page.fill('input[type="email"]', BACKOFFICE_USER.email);
    await page.fill('input[type="password"]', BACKOFFICE_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
  });

  for (const route of LINKME_ROUTES) {
    test(`should load route: ${route.name}`, async ({ page }) => {
      const fullUrl = `${BASE_URL}${route.path}`;
      console.log(`Testing: ${route.name} (${route.path})`);

      // Naviguer vers la route
      await page.goto(fullUrl);

      // Attendre un peu pour le chargement
      await page.waitForTimeout(2000);

      // Vérifier que la page a chargé un contenu principal
      const mainContent = page.locator('main');
      const hasMain = (await mainContent.count()) > 0;

      // Capturer les erreurs console
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Vérifier pas de redirection vers page d'erreur
      const isErrorPage =
        (await page.locator('text=/404|500|Error/i').count()) > 0;

      expect(hasMain, `${route.name} should have main content`).toBe(true);
      expect(isErrorPage, `${route.name} should not show error`).toBe(false);
      expect(
        consoleErrors.length,
        `${route.name} should have no console errors`
      ).toBe(0);

      console.log(`✓ ${route.name} loaded successfully`);
    });
  }
});
