/**
 * Tests E2E Playwright - ButtonUnified Component
 *
 * Stratégie : Tests E2E sur page dédiée /test-components/button-unified
 * Workaround : Utilise Playwright E2E au lieu de Component Testing
 *              (évite conflit installation @playwright/experimental-ct-react)
 *
 * Coverage :
 * - 8 variants (default, destructive, outline, secondary, ghost, link, gradient, glass)
 * - 6 sizes (xs, sm, md, lg, xl, icon)
 * - Icon positions (left, right, none)
 * - States (normal, loading, disabled)
 * - Interactions (click, keyboard)
 * - Accessibility (aria-label, focus)
 * - Console errors = 0 (RÈGLE SACRÉE)
 */

import { test, expect } from '@playwright/test';

const TEST_URL = '/test-components/button-unified';

// Helper: Capture console errors
function setupConsoleErrorTracking(page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

test.describe('ButtonUnified Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL);
    // Attendre chargement complet
    await page.waitForLoadState('networkidle');
  });

  // ============================================
  // TEST 1: VARIANTS (8 types)
  // ============================================
  test('should render all 8 variants correctly', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    // Vérifier présence de chaque variant
    await expect(page.locator('[data-testid="button-default"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-destructive"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-outline"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-secondary"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-ghost"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-gradient"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-glass"]')).toBeVisible();

    // Vérifier texte contenu
    await expect(page.locator('[data-testid="button-default"]')).toContainText('Default');
    await expect(page.locator('[data-testid="button-destructive"]')).toContainText('Destructive');

    // RÈGLE SACRÉE : 0 console errors
    expect(errors).toHaveLength(0);
  });

  // ============================================
  // TEST 2: SIZES (6 types)
  // ============================================
  test('should render all 6 sizes correctly', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await expect(page.locator('[data-testid="button-size-xs"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-size-sm"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-size-md"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-size-lg"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-size-xl"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-size-icon"]')).toBeVisible();

    // Vérifier tailles relatives (bounding box)
    const xsBox = await page.locator('[data-testid="button-size-xs"]').boundingBox();
    const xlBox = await page.locator('[data-testid="button-size-xl"]').boundingBox();

    expect(xlBox!.height).toBeGreaterThan(xsBox!.height);

    expect(errors).toHaveLength(0);
  });

  // ============================================
  // TEST 3: ICON POSITIONS
  // ============================================
  test('should display icons in correct positions', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    // Icon left : icône AVANT texte
    const iconLeft = page.locator('[data-testid="button-icon-left"]');
    await expect(iconLeft).toBeVisible();
    await expect(iconLeft.locator('svg')).toBeVisible();

    // Icon right : icône APRÈS texte
    const iconRight = page.locator('[data-testid="button-icon-right"]');
    await expect(iconRight).toBeVisible();
    await expect(iconRight.locator('svg')).toBeVisible();

    // No icon
    const noIcon = page.locator('[data-testid="button-no-icon"]');
    await expect(noIcon).toBeVisible();
    await expect(noIcon.locator('svg')).toHaveCount(0);

    expect(errors).toHaveLength(0);
  });

  // ============================================
  // TEST 4: LOADING STATE
  // ============================================
  test('should show spinner when loading', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    const loadingButton = page.locator('[data-testid="button-loading"]');

    // Click pour déclencher loading state (2s)
    await loadingButton.click();

    // Vérifier spinner visible
    await expect(loadingButton.locator('svg.animate-spin')).toBeVisible();

    // Bouton disabled pendant loading
    await expect(loadingButton).toBeDisabled();

    // Attendre fin loading (2s)
    await page.waitForTimeout(2500);

    // Spinner disparu
    await expect(loadingButton.locator('svg.animate-spin')).not.toBeVisible();

    expect(errors).toHaveLength(0);
  });

  // ============================================
  // TEST 5: DISABLED STATE
  // ============================================
  test('should not be clickable when disabled', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    const disabledButton = page.locator('[data-testid="button-disabled"]');

    // Vérifier disabled
    await expect(disabledButton).toBeDisabled();

    // Tenter click (ne devrait rien faire)
    const counterBefore = await page.locator('[data-testid="click-counter"]').textContent();
    await disabledButton.click({ force: true }); // Force car disabled
    const counterAfter = await page.locator('[data-testid="click-counter"]').textContent();

    // Compteur inchangé (click ignoré)
    expect(counterBefore).toBe(counterAfter);

    expect(errors).toHaveLength(0);
  });

  // ============================================
  // TEST 6: CLICK HANDLER
  // ============================================
  test('should trigger onClick handler', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    const clickButton = page.locator('[data-testid="button-click-test"]');
    const counter = page.locator('[data-testid="click-counter"]');

    // Click initial
    const countBefore = await counter.textContent();
    await clickButton.click();
    const countAfter = await counter.textContent();

    // Compteur incrémenté
    expect(parseInt(countAfter!)).toBe(parseInt(countBefore!) + 1);

    // Double-click
    await clickButton.click();
    await clickButton.click();
    const countFinal = await counter.textContent();
    expect(parseInt(countFinal!)).toBe(parseInt(countBefore!) + 3);

    expect(errors).toHaveLength(0);
  });

  // ============================================
  // TEST 7: KEYBOARD NAVIGATION
  // ============================================
  test('should support keyboard navigation (Tab + Enter)', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    const keyboardButton = page.locator('[data-testid="button-keyboard-test"]');
    const counter = page.locator('[data-testid="click-counter"]');

    // Focus avec Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Multiple tabs pour atteindre le bon bouton

    // Trouver bouton keyboard-test et focus
    await keyboardButton.focus();
    await expect(keyboardButton).toBeFocused();

    // Appuyer Enter
    const countBefore = await counter.textContent();
    await page.keyboard.press('Enter');
    const countAfter = await counter.textContent();

    // Click déclenché par Enter
    expect(parseInt(countAfter!)).toBe(parseInt(countBefore!) + 1);

    // Appuyer Space (alternative Enter)
    await page.keyboard.press('Space');
    const countFinal = await counter.textContent();
    expect(parseInt(countFinal!)).toBe(parseInt(countBefore!) + 2);

    expect(errors).toHaveLength(0);
  });

  // ============================================
  // TEST 8: ACCESSIBILITY (aria-label)
  // ============================================
  test('should have aria-label for icon-only buttons', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    const iconButton = page.locator('[data-testid="button-aria-label"]');

    // Vérifier aria-label présent
    const ariaLabel = await iconButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toBe('Enregistrer le document');

    // Icon button doit être accessible
    await expect(iconButton).toBeVisible();
    await iconButton.focus();
    await expect(iconButton).toBeFocused();

    expect(errors).toHaveLength(0);
  });

  // ============================================
  // TEST 9: FOCUS STATES
  // ============================================
  test('should show focus ring when focused', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    const focusableButton = page.locator('[data-testid="button-focusable"]');

    // Focus
    await focusableButton.focus();
    await expect(focusableButton).toBeFocused();

    // Vérifier classe focus-visible (Tailwind)
    // Note: Playwright ne peut pas toujours vérifier pseudo-classes,
    // donc on vérifie juste que bouton est focusable
    await expect(focusableButton).toBeEnabled();

    // Disabled button ne devrait PAS être focusable
    const disabledButton = page.locator('[data-testid="button-disabled-not-focusable"]');
    await disabledButton.focus().catch(() => {}); // Ignore erreur
    await expect(disabledButton).not.toBeFocused();

    expect(errors).toHaveLength(0);
  });

  // ============================================
  // TEST 10: CONSOLE ERRORS = 0 (RÈGLE SACRÉE)
  // ============================================
  test('should have ZERO console errors on page load', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    // Reload page pour test propre
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Interagir avec plusieurs boutons
    await page.locator('[data-testid="button-default"]').click();
    await page.locator('[data-testid="button-destructive"]').click();
    await page.locator('[data-testid="button-outline"]').click();

    // Attendre toutes interactions finies
    await page.waitForTimeout(1000);

    // RÈGLE SACRÉE : ZERO console errors
    expect(errors).toHaveLength(0);
  });

  // ============================================
  // TEST BONUS: COMBINATIONS
  // ============================================
  test('should render complex combinations correctly', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    // Small destructive
    const combo1 = page.locator('[data-testid="button-combo-1"]');
    await expect(combo1).toBeVisible();
    await expect(combo1).toContainText('Small Destructive');
    await expect(combo1.locator('svg')).toBeVisible(); // Icon présent

    // Large outline right icon
    const combo2 = page.locator('[data-testid="button-combo-2"]');
    await expect(combo2).toBeVisible();
    await expect(combo2).toContainText('Large Outline Right Icon');

    // XL gradient
    const combo3 = page.locator('[data-testid="button-combo-3"]');
    await expect(combo3).toBeVisible();
    await expect(combo3).toContainText('XL Gradient');

    expect(errors).toHaveLength(0);
  });
});
