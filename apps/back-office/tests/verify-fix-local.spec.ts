/**
 * 🧪 Test rapide pour vérifier le fix sur localhost
 */

import { test, expect } from '@playwright/test';

test.describe('Verify Fix on Localhost', () => {
  test('should show normal desktop layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Mesurer largeur input
    const inputWidth = await page
      .locator('input[type="email"]')
      .evaluate((el: HTMLInputElement) => el.offsetWidth);

    console.log('\n✅ VÉRIFICATION FIX:');
    console.log('Input width:', inputWidth, 'px');

    // Mesurer left side
    const leftSide = page.locator('.lg\\:w-1\\/2').first();
    const leftSideWidth = await leftSide.evaluate(
      (el: HTMLElement) => el.offsetWidth
    );

    const windowWidth = await page.evaluate(() => window.innerWidth);
    const ratio = (leftSideWidth / windowWidth) * 100;

    console.log('Left side width:', leftSideWidth, 'px');
    console.log('Left side ratio:', ratio.toFixed(1), '%');

    // Assertions
    expect(inputWidth).toBeGreaterThan(320);
    expect(ratio).toBeGreaterThan(40);
    expect(ratio).toBeLessThan(60);

    console.log('\n✅ FIX CONFIRMÉ: Layout desktop normal!\n');

    // Screenshot pour vérification visuelle
    await page.screenshot({
      path: 'verify-fix-local.png',
      fullPage: true,
    });
    console.log('📸 Screenshot: verify-fix-local.png\n');
  });
});
