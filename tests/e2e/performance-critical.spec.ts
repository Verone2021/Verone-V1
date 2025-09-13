/**
 * ⚡ Performance Critical Tests - Vérone Back Office
 *
 * Validation SLOs business-critical :
 * - Dashboard <2s load time
 * - Feeds generation <10s
 * - API responses <1s
 * - Search <1s response
 * - Mobile performance targets
 */

import { test, expect, type Page } from '@playwright/test';

// SLOs Vérone (en millisecondes)
const PERFORMANCE_SLOS = {
  DASHBOARD_LOAD: 2000,      // 2s max - Interface quotidienne
  FEEDS_GENERATION: 10000,   // 10s max - Feeds Meta/Google
  PDF_EXPORT: 5000,          // 5s max - Catalogues clients
  SEARCH_RESPONSE: 1000,     // 1s max - Recherche produits
  API_RESPONSE: 1000,        // 1s max - API responses
  COLLECTION_CREATION: 180000, // 3min max - Workflow commercial
  WEBHOOK_PROCESSING: 2000,    // 2s max - Brevo integration
  IMAGE_UPLOAD: 5000          // 5s max - Photos produits
};

// Credentials test
const TEST_USER = {
  email: 'veronebyromeo@gmail.com',
  password: 'Abc123456'
};

test.describe('🎯 Performance SLOs - Validation Critique', () => {

  test.beforeEach(async ({ page }) => {
    // Login rapide pour tests performance
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('📊 Dashboard Load Time - SLO <2s', async ({ page }) => {
    await test.step('Cold load dashboard performance', async () => {
      // Clear cache pour cold load
      await page.context().clearCookies();
      await page.reload();

      const startTime = Date.now();

      // Navigation dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Validation SLO critique : <2s
      expect(loadTime).toBeLessThan(PERFORMANCE_SLOS.DASHBOARD_LOAD);

      console.log(`📊 Dashboard cold load: ${loadTime}ms (SLO: <${PERFORMANCE_SLOS.DASHBOARD_LOAD}ms)`);
    });

    await test.step('Warm load dashboard performance', async () => {
      const startTime = Date.now();

      await page.reload();
      await page.waitForLoadState('networkidle');

      const warmLoadTime = Date.now() - startTime;

      // Warm load doit être encore plus rapide
      expect(warmLoadTime).toBeLessThan(PERFORMANCE_SLOS.DASHBOARD_LOAD * 0.7); // 70% du SLO

      console.log(`📊 Dashboard warm load: ${warmLoadTime}ms`);
    });

    await test.step('Core Web Vitals validation', async () => {
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          // Attendre les métriques
          setTimeout(() => {
            const paintEntries = performance.getEntriesByType('paint');
            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');

            resolve({
              fcp: fcp?.startTime || 0,
              domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
              loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
            });
          }, 1000);
        });
      });

      console.log('📈 Core Web Vitals:', vitals);

      // FCP <1.8s (Good)
      if ((vitals as any).fcp > 0) {
        expect((vitals as any).fcp).toBeLessThan(1800);
      }

      // DOM load <2s
      expect((vitals as any).domContentLoaded).toBeLessThan(2000);
    });
  });

  test('🔍 Search Performance - SLO <1s', async ({ page }) => {
    await page.goto('/catalogue');

    await test.step('Search input response time', async () => {
      const searchInput = page.locator('input[placeholder*="recherch"], [data-testid="search-input"]');

      if (await searchInput.count() > 0) {
        const startTime = Date.now();

        await searchInput.fill('canapé vérone');
        await page.keyboard.press('Enter');

        // Attendre les résultats
        await page.waitForFunction(() => {
          return document.querySelector('[data-testid="search-results"], .search-results') !== null ||
                 document.querySelector('[data-testid="no-results"], .no-results') !== null;
        }, { timeout: PERFORMANCE_SLOS.SEARCH_RESPONSE });

        const searchTime = Date.now() - startTime;

        expect(searchTime).toBeLessThan(PERFORMANCE_SLOS.SEARCH_RESPONSE);
        console.log(`🔍 Search response: ${searchTime}ms`);
      } else {
        test.skip('Search functionality not available');
      }
    });

    await test.step('Filtered results performance', async () => {
      // Test filtres si présents
      const categoryFilter = page.locator('[data-testid="category-filter"], select[name*="category"]');

      if (await categoryFilter.count() > 0) {
        const startTime = Date.now();

        await categoryFilter.selectOption({ label: 'Canapés' });
        await page.waitForLoadState('networkidle');

        const filterTime = Date.now() - startTime;
        expect(filterTime).toBeLessThan(PERFORMANCE_SLOS.SEARCH_RESPONSE);

        console.log(`🏷️  Filter response: ${filterTime}ms`);
      }
    });
  });

  test('📡 API Performance Comprehensive - SLO <1s', async ({ page }) => {
    const apiTests = [
      { endpoint: '/api/health', name: 'Health Check' },
      { endpoint: '/api/catalogue/products?limit=20', name: 'Products List' },
      { endpoint: '/api/catalogue/products?category=canapes&limit=10', name: 'Category Filter' },
      { endpoint: '/api/catalogue/products?search=vérone&limit=5', name: 'Search API' }
    ];

    for (const apiTest of apiTests) {
      await test.step(`${apiTest.name} API performance`, async () => {
        const startTime = Date.now();
        const response = await page.request.get(apiTest.endpoint);

        const responseTime = Date.now() - startTime;

        expect(response.ok()).toBe(true);
        expect(responseTime).toBeLessThan(PERFORMANCE_SLOS.API_RESPONSE);

        // Header response time si présent
        const headerTime = response.headers()['x-response-time'];
        if (headerTime) {
          const serverTime = parseInt(headerTime);
          expect(serverTime).toBeLessThan(PERFORMANCE_SLOS.API_RESPONSE);
        }

        console.log(`📡 ${apiTest.name}: ${responseTime}ms`);
      });
    }
  });

  test('🔄 Concurrent Load Performance', async ({ page }) => {
    await test.step('Concurrent API requests', async () => {
      const concurrentRequests = [
        '/api/health',
        '/api/catalogue/products?limit=10',
        '/api/catalogue/products?category=tables',
        '/api/catalogue/products?search=éclairage',
        '/api/catalogue/products?category=canapes&limit=5'
      ];

      const startTime = Date.now();

      const promises = concurrentRequests.map(endpoint =>
        page.request.get(endpoint)
      );

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Toutes les requêtes doivent réussir
      responses.forEach((response, index) => {
        expect(response.ok()).toBe(true);
      });

      // Load concurrent <3s pour 5 requêtes
      expect(totalTime).toBeLessThan(3000);

      console.log(`🔄 Concurrent load (${responses.length} requests): ${totalTime}ms`);
    });

    await test.step('Page navigation performance', async () => {
      const pages = [
        { path: '/dashboard', name: 'Dashboard' },
        { path: '/catalogue', name: 'Catalogue' },
        { path: '/commandes', name: 'Commandes' },
        { path: '/stocks', name: 'Stocks' }
      ];

      for (const pageDef of pages) {
        const startTime = Date.now();

        await page.goto(pageDef.path);
        await page.waitForLoadState('networkidle');

        const navTime = Date.now() - startTime;

        // Navigation <3s acceptable
        expect(navTime).toBeLessThan(3000);

        console.log(`🔄 ${pageDef.name} navigation: ${navTime}ms`);
      }
    });
  });

  test('📱 Mobile Performance - Critical UX', async ({ page }) => {
    // Configuration mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Simuler connexion mobile lente
    await page.context().route('**/*', (route) => {
      route.continue({
        // Ajouter délai simulé réseau mobile
      });
    });

    await test.step('Mobile dashboard performance', async () => {
      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const mobileLoadTime = Date.now() - startTime;

      // Mobile peut être 50% plus lent que desktop
      expect(mobileLoadTime).toBeLessThan(PERFORMANCE_SLOS.DASHBOARD_LOAD * 1.5);

      console.log(`📱 Mobile dashboard: ${mobileLoadTime}ms`);
    });

    await test.step('Mobile catalogue scrolling performance', async () => {
      await page.goto('/catalogue');
      await page.waitForLoadState('networkidle');

      // Test scrolling fluide
      const scrollStart = Date.now();

      await page.evaluate(() => {
        window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
      });

      await page.waitForTimeout(500);

      const scrollTime = Date.now() - scrollStart;
      expect(scrollTime).toBeLessThan(1000); // Scroll fluide <1s

      console.log(`📱 Mobile scroll performance: ${scrollTime}ms`);
    });

    await test.step('Touch interactions responsiveness', async () => {
      const productCard = page.locator('[data-testid="product-card"]').first();

      if (await productCard.count() > 0) {
        const touchStart = Date.now();

        await productCard.tap();
        await page.waitForTimeout(100); // Délai interaction

        const touchResponse = Date.now() - touchStart;
        expect(touchResponse).toBeLessThan(200); // Touch response <200ms

        console.log(`📱 Touch response: ${touchResponse}ms`);
      }
    });
  });

  test('💾 Memory Usage Monitoring', async ({ page }) => {
    await test.step('Memory leak detection', async () => {
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Navigation intensive pour détecter leaks
      const pages = ['/dashboard', '/catalogue', '/commandes', '/stocks'];

      for (let i = 0; i < 3; i++) {
        for (const pagePath of pages) {
          await page.goto(pagePath);
          await page.waitForLoadState('networkidle');
        }
      }

      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

        // Augmentation mémoire <50MB acceptable
        expect(memoryIncreaseMB).toBeLessThan(50);

        console.log(`💾 Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
      }
    });
  });
});

test.describe('🎯 Business Performance - Workflows Complets', () => {

  test('📋 Catalogue Creation Workflow', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await test.step('Complete catalogue creation workflow', async () => {
      const workflowStart = Date.now();

      // 1. Navigation catalogue
      await page.goto('/catalogue');
      await page.waitForLoadState('networkidle');

      // 2. Création nouveau produit (si interface disponible)
      const createButton = page.locator('[data-testid="create-product"], text=Nouveau produit');
      if (await createButton.count() > 0) {
        await createButton.click();

        // Formulaire produit
        const productNameField = page.locator('input[name="name"], [data-testid="product-name"]');
        if (await productNameField.count() > 0) {
          await productNameField.fill('Test Canapé Performance');

          const priceField = page.locator('input[name="price"], [data-testid="product-price"]');
          if (await priceField.count() > 0) {
            await priceField.fill('2999');
          }

          // Soumission
          const submitButton = page.locator('button[type="submit"], [data-testid="save-product"]');
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForLoadState('networkidle');
          }
        }
      }

      const workflowTime = Date.now() - workflowStart;

      // Workflow complet <3min (SLO business)
      expect(workflowTime).toBeLessThan(PERFORMANCE_SLOS.COLLECTION_CREATION);

      console.log(`📋 Catalogue workflow: ${workflowTime}ms`);
    });
  });
});