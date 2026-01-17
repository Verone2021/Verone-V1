/**
 * 🛡️ DESKTOP LAYOUT GUARD - Anti-Régression
 *
 * Tests pour garantir que le layout desktop ne sera JAMAIS
 * cassé par un transform/zoom ou wrapper flex limitant.
 *
 * Ces tests DOIVENT passer en CI pour tout deploy production.
 */

import { test, expect } from '@playwright/test';

test.describe('Desktop Layout Guard - Anti-Régression', () => {
  test.beforeEach(async ({ page }) => {
    // Viewport desktop standard (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  });

  test('html should NOT have transform or zoom applied', async ({ page }) => {
    const htmlTransform = await page.evaluate(() =>
      getComputedStyle(document.documentElement).transform
    );
    const htmlZoom = await page.evaluate(
      () => getComputedStyle(document.documentElement).zoom || '1'
    );

    expect(htmlTransform).toBe('none');
    expect(htmlZoom).toBe('1');
  });

  test('body should NOT have transform or zoom applied', async ({ page }) => {
    const bodyTransform = await page.evaluate(() =>
      getComputedStyle(document.body).transform
    );
    const bodyZoom = await page.evaluate(
      () => getComputedStyle(document.body).zoom || '1'
    );

    expect(bodyTransform).toBe('none');
    expect(bodyZoom).toBe('1');
  });

  test('input email should have normal width > 320px', async ({ page }) => {
    const inputWidth = await page
      .locator('input[type="email"]')
      .evaluate((el: HTMLInputElement) => el.offsetWidth);

    expect(inputWidth).toBeGreaterThan(320);
    console.log('✓ Input width:', inputWidth, 'px (expected > 320px)');
  });

  test('left side image should occupy ~50% of screen width', async ({
    page,
  }) => {
    // La classe lg:w-1/2 devrait occuper environ 50% de l'écran sur desktop
    const leftSide = page.locator('.lg\\:w-1\\/2').first();
    const leftSideWidth = await leftSide.evaluate(
      (el: HTMLElement) => el.offsetWidth
    );

    const windowWidth = await page.evaluate(() => window.innerWidth);
    const ratio = leftSideWidth / windowWidth;

    // Le ratio devrait être entre 40% et 60% (tolérance pour marges/padding)
    expect(ratio).toBeGreaterThan(0.4);
    expect(ratio).toBeLessThan(0.6);
    console.log('✓ Left side ratio:', (ratio * 100).toFixed(1), '% (expected ~50%)');
  });

  test('login container should NOT be limited by flex justify-center', async ({
    page,
  }) => {
    // Le container principal (.min-h-screen flex) devrait occuper au moins 70% de la largeur
    // Si un parent a justify-center, il serait limité à ~387px (26%)
    const mainContainer = page.locator('.min-h-screen.flex').first();
    const mainContainerWidth = await mainContainer.evaluate(
      (el: HTMLElement) => el.offsetWidth
    );

    const windowWidth = await page.evaluate(() => window.innerWidth);
    const ratio = mainContainerWidth / windowWidth;

    // Le container devrait occuper au moins 70% de la largeur (tolérance pour max-width éventuels)
    expect(ratio).toBeGreaterThan(0.7);
    console.log(
      '✓ Main container width:',
      mainContainerWidth,
      'px (',
      (ratio * 100).toFixed(1),
      '% of window)'
    );
  });

  test('form card should have max-width (not compressed by parent)', async ({
    page,
  }) => {
    // La card de login a max-w-md (448px)
    const card = page.locator('.max-w-md').first();
    const cardWidth = await card.evaluate((el: HTMLElement) => el.offsetWidth);

    // Si le parent est compressé, la card sera beaucoup plus petite que 448px
    // On vérifie qu'elle fait au moins 400px (tolérance padding)
    expect(cardWidth).toBeGreaterThan(400);
    console.log('✓ Card width:', cardWidth, 'px (expected ~448px with max-w-md)');
  });
});

test.describe('Desktop Min-Width Protection', () => {
  test('body should have min-width: 1200px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');

    const bodyMinWidth = await page.evaluate(() => {
      const styles = getComputedStyle(document.body);
      return styles.minWidth;
    });

    expect(bodyMinWidth).toBe('1200px');
    console.log('✓ Body min-width:', bodyMinWidth);
  });

  test('app should scroll horizontally on viewport < 1200px', async ({
    page,
  }) => {
    // Tester avec viewport 1000px (< 1200px)
    await page.setViewportSize({ width: 1000, height: 900 });
    await page.goto('/login');

    // Vérifier qu'il y a bien un scrollbar horizontal
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalScroll).toBe(true);
    console.log('✓ Horizontal scroll enabled when viewport < 1200px');
  });

  test('app should NOT scroll horizontally on viewport >= 1200px', async ({
    page,
  }) => {
    // Tester avec viewport 1440px (>= 1200px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');

    // Vérifier qu'il n'y a PAS de scrollbar horizontal inutile
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
    console.log('✓ No horizontal scroll when viewport >= 1200px');
  });
});
