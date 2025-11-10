/**
 * Tests E2E : Performance Alertes Stock
 * Phase 3 : Tests validation
 * Date : 2025-11-10
 *
 * Tests SLOs :
 * - Page alertes <3s (RÈGLE)
 * - Console errors = 0 (RÈGLE SACRÉE)
 * - Performance avec 100+ alertes
 * - Rafraîchissement auto sans erreur
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

import {
  seedStockAlertsTestData,
  cleanupStockAlertsTestData,
} from '../../fixtures/stock-alerts-test-data';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

test.describe('Performance Alertes Stock', () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await seedStockAlertsTestData(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  test.afterAll(async () => {
    await cleanupStockAlertsTestData(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  test('SLO: Page alertes should load in <3s', async ({ page }) => {
    const startTime = Date.now();

    // Naviguer vers page alertes
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    // Attendre que titre soit visible
    await expect(page.locator('h1')).toContainText('Alertes Stock');

    const loadTime = Date.now() - startTime;

    // ✅ SLO : <3000ms
    expect(loadTime).toBeLessThan(3000);

    console.log(`✅ Page alertes chargée en ${loadTime}ms (SLO: <3000ms)`);
  });

  test('RÈGLE SACRÉE: Console errors MUST be 0', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Capturer console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Capturer page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Naviguer vers page alertes
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    // Attendre 2s pour capturer erreurs asynchrones
    await page.waitForTimeout(2000);

    // ✅ RÈGLE SACRÉE : 0 console errors
    expect(consoleErrors.length).toBe(0);
    expect(pageErrors.length).toBe(0);

    if (consoleErrors.length > 0) {
      console.error('❌ Console Errors Found:');
      consoleErrors.forEach(err => console.error(`  - ${err}`));
    }

    if (pageErrors.length > 0) {
      console.error('❌ Page Errors Found:');
      pageErrors.forEach(err => console.error(`  - ${err}`));
    }

    // Warnings sont tolérés mais loggés
    if (consoleWarnings.length > 0) {
      console.warn(`⚠️  ${consoleWarnings.length} console warnings (tolérés)`);
    }
  });

  test('should handle 100+ alerts without performance degradation', async ({
    page,
  }) => {
    // Créer 100 produits avec alertes
    const bulkProducts = Array.from({ length: 100 }, (_, i) => ({
      id: `test-bulk-product-${i}-uuid`,
      name: `Test Bulk Product ${i}`,
      sku: `TEST-BULK-${String(i).padStart(3, '0')}`,
      stock_real: 0,
      stock_forecasted_out: 0,
      min_stock: 10,
      supplier_moq: 1,
      cost_price: 500,
    }));

    await supabase.from('products').insert(bulkProducts);

    // Attendre que triggers créent alertes
    await page.waitForTimeout(3000);

    // Mesurer temps chargement
    const startTime = Date.now();

    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // ✅ Même avec 100+ alertes, devrait rester <3s
    expect(loadTime).toBeLessThan(3000);

    console.log(
      `✅ Page avec 100+ alertes chargée en ${loadTime}ms (SLO: <3000ms)`
    );

    // Vérifier toutes alertes affichées
    const cards = page.locator('[data-testid="stock-alert-card"]');
    const count = await cards.count();

    expect(count).toBeGreaterThan(100);

    // Cleanup
    await supabase.from('products').delete().like('id', 'test-bulk-product-%');
  });

  test('should filter 100+ alerts in <500ms', async ({ page }) => {
    // Créer 100 produits
    const bulkProducts = Array.from({ length: 100 }, (_, i) => ({
      id: `test-filter-product-${i}-uuid`,
      name: `Test Filter Product ${i}`,
      sku: `TEST-FILTER-${String(i).padStart(3, '0')}`,
      stock_real: i % 2 === 0 ? 0 : 5, // 50% out_of_stock, 50% low_stock
      stock_forecasted_out: 0,
      min_stock: 10,
      supplier_moq: 1,
      cost_price: 500,
    }));

    await supabase.from('products').insert(bulkProducts);
    await page.waitForTimeout(3000);

    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    // Tester filtrage par recherche
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Rechercher"]'
    );

    if (await searchInput.isVisible()) {
      const startTime = Date.now();

      await searchInput.fill('TEST-FILTER-050');
      await page.waitForTimeout(300); // Debounce

      const filterTime = Date.now() - startTime;

      // ✅ Filtrage devrait être <500ms
      expect(filterTime).toBeLessThan(500);

      // Vérifier résultat filtré
      const cards = page.locator('[data-testid="stock-alert-card"]');
      const count = await cards.count();

      expect(count).toBeLessThan(5); // Résultat filtré
    }

    // Cleanup
    await supabase
      .from('products')
      .delete()
      .like('id', 'test-filter-product-%');
  });

  test('should handle auto-refresh without errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    // Attendre 35s pour déclencher rafraîchissement auto (si implémenté)
    // Note: À ajuster selon implémentation réelle du polling
    await page.waitForTimeout(35000);

    // ✅ Pas d'erreur après rafraîchissement
    expect(consoleErrors.length).toBe(0);

    if (consoleErrors.length > 0) {
      console.error('❌ Errors after auto-refresh:');
      consoleErrors.forEach(err => console.error(`  - ${err}`));
    }
  });

  test('should handle rapid navigation without memory leaks', async ({
    page,
  }) => {
    // Naviguer rapidement entre pages
    for (let i = 0; i < 5; i++) {
      await page.goto('/stocks/alertes');
      await page.waitForLoadState('networkidle');

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await page.goto('/stocks');
      await page.waitForLoadState('networkidle');
    }

    // Retourner aux alertes
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    // Vérifier que la page fonctionne toujours
    await expect(page.locator('h1')).toContainText('Alertes Stock');

    // Pas de crash ou erreur
    const cards = page.locator('[data-testid="stock-alert-card"]');
    const count = await cards.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should handle modal open/close 10 times without degradation', async ({
    page,
  }) => {
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-testid="stock-alert-card"]').first();
    await expect(card).toBeVisible();

    const timings: number[] = [];

    // Ouvrir/fermer modal 10 fois
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();

      // Ouvrir modal
      await card.locator('button:has-text("Commander")').click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      const openTime = Date.now() - startTime;
      timings.push(openTime);

      // Fermer modal
      await page.locator('button:has-text("Annuler")').click();
      await expect(modal).not.toBeVisible();

      await page.waitForTimeout(300);
    }

    // Vérifier que temps d'ouverture reste stable (pas de dégradation)
    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
    const maxTime = Math.max(...timings);

    console.log(
      `✅ Modal open avg: ${avgTime.toFixed(0)}ms, max: ${maxTime}ms`
    );

    // Dernier temps ne devrait pas être significativement plus lent que moyenne
    const lastTime = timings[timings.length - 1];
    expect(lastTime).toBeLessThan(avgTime * 2);
  });

  test('should handle scroll performance with 100+ items', async ({ page }) => {
    // Créer 150 produits
    const bulkProducts = Array.from({ length: 150 }, (_, i) => ({
      id: `test-scroll-product-${i}-uuid`,
      name: `Test Scroll Product ${i}`,
      sku: `TEST-SCROLL-${String(i).padStart(3, '0')}`,
      stock_real: 0,
      stock_forecasted_out: 0,
      min_stock: 10,
      supplier_moq: 1,
      cost_price: 500,
    }));

    await supabase.from('products').insert(bulkProducts);
    await page.waitForTimeout(3000);

    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    // Mesurer performance scroll
    const startTime = Date.now();

    // Scroller jusqu'en bas
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Scroller jusqu'en haut
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const scrollTime = Date.now() - startTime;

    // ✅ Scroll devrait être fluide (<2s pour aller-retour)
    expect(scrollTime).toBeLessThan(2000);

    console.log(`✅ Scroll 150 items: ${scrollTime}ms`);

    // Cleanup
    await supabase
      .from('products')
      .delete()
      .like('id', 'test-scroll-product-%');
  });

  test('should measure Core Web Vitals', async ({ page }) => {
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    // Mesurer LCP (Largest Contentful Paint)
    const lcp = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        setTimeout(() => resolve(0), 5000); // Timeout après 5s
      });
    });

    if (lcp > 0) {
      // ✅ LCP devrait être <2500ms (Google recommandation)
      expect(lcp).toBeLessThan(2500);
      console.log(`✅ LCP: ${lcp.toFixed(0)}ms (recommandé: <2500ms)`);
    }

    // Mesurer CLS (Cumulative Layout Shift)
    const cls = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        let clsValue = 0;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    // ✅ CLS devrait être <0.1 (Google recommandation)
    expect(cls).toBeLessThan(0.1);
    console.log(`✅ CLS: ${cls.toFixed(3)} (recommandé: <0.1)`);
  });
});
