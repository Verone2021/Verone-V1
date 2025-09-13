/**
 * 🛋️ Business Workflows E2E Tests - Vérone Back Office
 *
 * Tests critiques pour validation MVP catalogue partageable :
 * - Authentication & Authorization
 * - Dashboard Performance (<2s SLO)
 * - Catalogue Management
 * - API Performance Validation
 */

import { test, expect, type Page } from '@playwright/test';

// Configuration SLOs Vérone
const VERONE_SLOS = {
  DASHBOARD_LOAD_MS: 2000,
  API_RESPONSE_MS: 1000,
  CATALOGUE_LOAD_MS: 3000,
  LOGIN_TIME_MS: 5000
};

// Credentials de test MVP
const TEST_CREDENTIALS = {
  email: 'veronebyromeo@gmail.com',
  password: 'Abc123456'
};

test.describe('🎯 Vérone MVP - Workflows Critiques', () => {

  test.beforeEach(async ({ page }) => {
    // Configuration page pour monitoring performance
    await page.addInitScript(() => {
      window.performance.mark('test-start');
    });
  });

  test('🔐 Authentication - Login complet avec validation', async ({ page }) => {
    const startTime = Date.now();

    // Navigation page login
    await test.step('Navigation vers page de connexion', async () => {
      await page.goto('/login');
      await expect(page).toHaveTitle(/Vérone|Login/);
      await expect(page.locator('text=VÉRONE')).toBeVisible();
    });

    // Test responsive design
    await test.step('Validation design responsive', async () => {
      // Desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Retour desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
    });

    // Processus de connexion
    await test.step('Saisie credentials et connexion', async () => {
      await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.password);

      await page.click('button[type="submit"]');
    });

    // Validation redirection dashboard
    await test.step('Validation redirection dashboard', async () => {
      await page.waitForURL('/dashboard');
      await expect(page).toHaveURL('/dashboard');

      const loginDuration = Date.now() - startTime;
      expect(loginDuration).toBeLessThan(VERONE_SLOS.LOGIN_TIME_MS);

      console.log(`✅ Login completed in ${loginDuration}ms`);
    });

    // Validation présence éléments UI critiques
    await test.step('Validation éléments dashboard', async () => {
      // Header avec logo Vérone
      await expect(page.locator('text=VÉRONE')).toBeVisible();

      // Navigation principale
      await expect(page.locator('text=Catalogue')).toBeVisible();
      await expect(page.locator('text=Dashboard')).toBeVisible();

      // Indicateur utilisateur connecté
      const userInfo = page.locator('[data-testid="user-info"]');
      if (await userInfo.count() > 0) {
        await expect(userInfo).toBeVisible();
      }
    });
  });

  test('📊 Dashboard - Performance et SLOs validation', async ({ page }) => {
    await loginAsAdmin(page);

    const startTime = Date.now();

    // Navigation dashboard avec mesure performance
    await test.step('Chargement dashboard avec monitoring', async () => {
      await page.goto('/dashboard');

      // Attendre chargement complet
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Validation SLO : <2s dashboard load
      expect(loadTime).toBeLessThan(VERONE_SLOS.DASHBOARD_LOAD_MS);

      console.log(`📊 Dashboard loaded in ${loadTime}ms (SLO: <${VERONE_SLOS.DASHBOARD_LOAD_MS}ms)`);
    });

    // Validation KPIs business
    await test.step('Validation métriques business', async () => {
      // KPIs si présents
      const kpis = page.locator('[data-testid="kpi-card"]');
      if (await kpis.count() > 0) {
        await expect(kpis.first()).toBeVisible();
      }

      // Charts/graphiques si présents
      const charts = page.locator('[data-testid="chart"], .recharts-wrapper');
      if (await charts.count() > 0) {
        await expect(charts.first()).toBeVisible();
      }
    });

    // Test navigation rapide entre sections
    await test.step('Navigation fluide entre sections', async () => {
      const navigationItems = ['Catalogue', 'Commandes', 'Stocks', 'Clients'];

      for (const item of navigationItems) {
        const navStart = Date.now();
        const navLink = page.locator(`text=${item}`);

        if (await navLink.count() > 0) {
          await navLink.click();
          await page.waitForLoadState('networkidle');

          const navTime = Date.now() - navStart;
          expect(navTime).toBeLessThan(3000); // 3s max navigation

          console.log(`🔄 Navigation to ${item}: ${navTime}ms`);
        }
      }

      // Retour dashboard
      await page.goto('/dashboard');
    });
  });

  test('🛋️ Catalogue - Gestion produits MVP', async ({ page }) => {
    await loginAsAdmin(page);

    await test.step('Navigation catalogue', async () => {
      const startTime = Date.now();

      await page.goto('/catalogue');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(VERONE_SLOS.CATALOGUE_LOAD_MS);

      console.log(`🛋️  Catalogue loaded in ${loadTime}ms`);
    });

    // Validation liste produits
    await test.step('Validation affichage produits', async () => {
      // Grille de produits ou message vide
      const productGrid = page.locator('[data-testid="product-grid"]');
      const emptyState = page.locator('[data-testid="empty-catalogue"]');

      const hasProducts = await productGrid.count() > 0;
      const hasEmptyState = await emptyState.count() > 0;

      expect(hasProducts || hasEmptyState).toBe(true);

      if (hasProducts) {
        // Validation cards produits
        const productCards = page.locator('[data-testid="product-card"]');
        await expect(productCards.first()).toBeVisible();
        console.log(`📦 Found ${await productCards.count()} products`);
      }
    });

    // Test recherche/filtres si présents
    await test.step('Test fonctionnalités recherche', async () => {
      const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="Recherch"]');

      if (await searchInput.count() > 0) {
        await searchInput.fill('canapé');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000); // Délai recherche

        // Vérifier résultats ou message
        const results = page.locator('[data-testid="search-results"]');
        const noResults = page.locator('text=Aucun résultat');

        expect(await results.count() > 0 || await noResults.count() > 0).toBe(true);
      }
    });
  });

  test('⚡ API Performance - Validation SLOs', async ({ page }) => {
    await loginAsAdmin(page);

    // Test API Health Check
    await test.step('Health Check API', async () => {
      const response = await page.request.get('/api/health');
      expect(response.ok()).toBe(true);

      const responseTime = parseInt(response.headers()['x-response-time'] || '0');
      if (responseTime > 0) {
        expect(responseTime).toBeLessThan(VERONE_SLOS.API_RESPONSE_MS);
      }

      const healthData = await response.json();
      expect(healthData.status).toBe('healthy');

      console.log(`🏥 Health check: ${healthData.status}`);
    });

    // Test API Catalogue
    await test.step('Catalogue API Performance', async () => {
      const startTime = Date.now();
      const response = await page.request.get('/api/catalogue/products?limit=10');

      expect(response.ok()).toBe(true);
      const apiTime = Date.now() - startTime;
      expect(apiTime).toBeLessThan(VERONE_SLOS.API_RESPONSE_MS);

      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.pagination).toBeDefined();

      console.log(`🛍️  Catalogue API: ${apiTime}ms, ${data.pagination?.total_count || 0} products`);
    });

    // Test API concurrent load
    await test.step('Concurrent API Load Test', async () => {
      const promises = [
        page.request.get('/api/health'),
        page.request.get('/api/catalogue/products?limit=5'),
        page.request.get('/api/catalogue/products?category=canapes'),
        page.request.get('/api/catalogue/products?search=vérone')
      ];

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Toutes les réponses doivent être OK
      responses.forEach((response, index) => {
        expect(response.ok()).toBe(true);
      });

      // Load concurrent <3s
      expect(totalTime).toBeLessThan(3000);

      console.log(`⚡ Concurrent API load: ${totalTime}ms for ${responses.length} requests`);
    });
  });

  test('📱 Mobile Responsive - Navigation critique', async ({ page }) => {
    // Configuration mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await test.step('Login mobile', async () => {
      await page.goto('/login');

      // Validation responsive
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Login
      await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
      await page.click('button[type="submit"]');

      await page.waitForURL('/dashboard');
    });

    await test.step('Navigation mobile dashboard', async () => {
      // Menu mobile si présent
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu');
      const hamburger = page.locator('[data-testid="hamburger"], [aria-label="Menu"]');

      if (await hamburger.count() > 0) {
        await hamburger.click();
        await expect(mobileMenu).toBeVisible();
      }

      // Navigation sections principales
      const mainSections = ['Catalogue', 'Dashboard'];
      for (const section of mainSections) {
        const link = page.locator(`text=${section}`);
        if (await link.count() > 0) {
          await link.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(new RegExp(section.toLowerCase()));
        }
      }
    });

    await test.step('Catalogue mobile experience', async () => {
      await page.goto('/catalogue');
      await page.waitForLoadState('networkidle');

      // Produits adaptés mobile
      const productCards = page.locator('[data-testid="product-card"]');
      if (await productCards.count() > 0) {
        await expect(productCards.first()).toBeVisible();

        // Touch targets suffisants (44px minimum)
        const cardButton = productCards.first().locator('button, a');
        if (await cardButton.count() > 0) {
          const buttonBox = await cardButton.first().boundingBox();
          expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
          expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });
});

// Helper functions
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
  await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}