/**
 * Helpers Playwright pour tests responsive Verone
 *
 * Fournit :
 * - Constantes des 5 viewports standards
 * - Fonction de test multi-viewport reutilisable
 * - Verifications d'accessibilite responsive (touch targets, overflow)
 *
 * Usage :
 * ```ts
 * import { RESPONSIVE_VIEWPORTS, testAtAllViewports } from '../fixtures/responsive';
 *
 * testAtAllViewports('/factures', async ({ page, viewport }) => {
 *   await page.goto('/factures');
 *   await expect(page.getByRole('button', { name: /nouvelle/i })).toBeVisible();
 * });
 * ```
 */

import { test, expect, type Page } from '@playwright/test';

export const RESPONSIVE_VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667, label: 'iPhone 14' },
  { name: 'tablet-portrait', width: 768, height: 1024, label: 'iPad' },
  { name: 'laptop-small', width: 1024, height: 768, label: 'MacBook Air 11"' },
  { name: 'desktop', width: 1440, height: 900, label: 'MacBook 16"' },
  {
    name: 'desktop-large',
    width: 1920,
    height: 1080,
    label: 'Ecran externe',
  },
] as const;

export type ResponsiveViewport = (typeof RESPONSIVE_VIEWPORTS)[number];

/**
 * Lance un test sur les 5 viewports responsive standards.
 *
 * @param url URL de la page a tester
 * @param testFn Fonction de test recevant page + viewport courant
 * @param options Options additionnelles (screenshots, verifications auto)
 */
export function testAtAllViewports(
  url: string,
  testFn: (ctx: { page: Page; viewport: ResponsiveViewport }) => Promise<void>,
  options: {
    screenshotPrefix?: string;
    assertNoHorizontalScroll?: boolean;
    skipViewports?: Array<ResponsiveViewport['name']>;
  } = {}
) {
  const {
    screenshotPrefix,
    assertNoHorizontalScroll = true,
    skipViewports = [],
  } = options;

  for (const viewport of RESPONSIVE_VIEWPORTS) {
    if (skipViewports.includes(viewport.name)) continue;

    test(`${url} @ ${viewport.label} (${viewport.width}×${viewport.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Screenshot automatique si prefix fourni
      if (screenshotPrefix) {
        await page.screenshot({
          path: `screenshots/responsive/${screenshotPrefix}-${viewport.name}.png`,
          fullPage: true,
        });
      }

      // Test client
      await testFn({ page, viewport });

      // Verification : pas de scroll horizontal parasite
      if (assertNoHorizontalScroll) {
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(
          hasHorizontalScroll,
          `Scroll horizontal detecte sur ${viewport.label} — debordement a fixer`
        ).toBe(false);
      }
    });
  }
}

/**
 * Verifie que tous les boutons critiques sont cliquables et ont
 * des touch targets suffisants sur mobile (44px min).
 */
export async function assertTouchTargetsOnMobile(
  page: Page,
  selectors: string[]
) {
  const viewport = page.viewportSize();
  if (!viewport || viewport.width >= 768) {
    // Ne s'applique qu'en mode mobile
    return;
  }

  for (const selector of selectors) {
    const element = page.locator(selector).first();
    if ((await element.count()) === 0) continue;

    const box = await element.boundingBox();
    expect(box, `Element ${selector} non visible sur mobile`).not.toBeNull();

    if (box) {
      expect(
        box.height,
        `Touch target trop petit pour ${selector} (height=${box.height}, min=44px)`
      ).toBeGreaterThanOrEqual(44);
      expect(
        box.width,
        `Touch target trop petit pour ${selector} (width=${box.width}, min=44px)`
      ).toBeGreaterThanOrEqual(44);
    }
  }
}

/**
 * Verifie qu'un element est visible ET accessible (pas coupe hors viewport).
 */
export async function assertFullyVisible(page: Page, selector: string) {
  const element = page.locator(selector).first();
  await expect(element).toBeVisible();

  const box = await element.boundingBox();
  const viewport = page.viewportSize();

  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();

  if (box && viewport) {
    expect(
      box.x,
      `Element ${selector} deborde a gauche (x=${box.x})`
    ).toBeGreaterThanOrEqual(0);
    expect(
      box.x + box.width,
      `Element ${selector} deborde a droite (right=${box.x + box.width}, viewport=${viewport.width})`
    ).toBeLessThanOrEqual(viewport.width);
  }
}
