import { test, expect } from '@playwright/test';
import { loginLinkMe, CREDENTIALS } from './fixtures/auth';
import { getProductById, cleanupTestData } from './fixtures/database';
import { generateTestProductName } from './fixtures/test-data';

/**
 * E2E Tests: Product Creation (Independent Organizations)
 * Validates product creation with/without Verone storage
 */

test.describe('Product Creation: Independent Organizations', () => {
  test.afterAll(async () => {
    // Cleanup test data after all tests
    await cleanupTestData();
  });

  test('2.1: Create product WITH Verone storage', async ({ page }) => {
    // Step 1: Login as independent organization
    await loginLinkMe(page, CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Step 2: Navigate to create product page
    await page.goto('http://localhost:3002/mes-produits');
    await page.waitForLoadState('networkidle');

    // Click "Nouveau produit" button
    await page.click('button:has-text("Nouveau produit")');
    await page.waitForURL('**/mes-produits/nouveau');

    // Step 3: Fill product form with storage enabled
    const productName = generateTestProductName('Produit Stocké');

    await page.fill('[data-testid="product-name"]', productName);
    await page.fill(
      '[data-testid="product-description"]',
      'Produit avec stockage Vérone pour tests E2E'
    );
    await page.fill('[data-testid="affiliate-payout-ht"]', '100');

    // Enable Verone storage
    const storageToggle = page.locator('[data-testid="store-at-verone"]');
    await storageToggle.check();

    // Fill dimensions (required when storage is enabled)
    await page.fill('[data-testid="length-cm"]', '50');
    await page.fill('[data-testid="width-cm"]', '30');
    await page.fill('[data-testid="height-cm"]', '20');

    // Fill stock units
    await page.fill('[data-testid="stock-units"]', '10');

    // Step 4: Submit form
    await page.click('button[type="submit"]:has-text("Créer produit")');

    // Step 5: Wait for redirect to product detail page
    await page.waitForURL(/\/mes-produits\/[a-f0-9-]+$/);

    // Get product ID from URL
    const productUrl = page.url();
    const productId = productUrl.split('/').pop()!;

    // Step 6: Verify product in database
    const product = await getProductById(productId);

    expect(product.name).toBe(productName);
    expect(product.store_at_verone).toBe(true);
    expect(product.length_cm).toBe(50);
    expect(product.width_cm).toBe(30);
    expect(product.height_cm).toBe(20);
    expect(product.stock_units).toBe(10);
    expect(product.affiliate_payout_ht).toBe(100);

    // Step 7: Verify UI shows storage badge
    await expect(page.locator('text=Stocké chez Vérone')).toBeVisible();
  });

  test('2.2: Create product WITHOUT Verone storage (managed by affiliate)', async ({
    page,
  }) => {
    // Step 1: Login as independent organization
    await loginLinkMe(page, CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Step 2: Navigate to create product page
    await page.goto('http://localhost:3002/mes-produits');
    await page.waitForLoadState('networkidle');

    // Click "Nouveau produit" button
    await page.click('button:has-text("Nouveau produit")');
    await page.waitForURL('**/mes-produits/nouveau');

    // Step 3: Fill product form WITHOUT storage
    const productName = generateTestProductName('Produit Non Stocké');

    await page.fill('[data-testid="product-name"]', productName);
    await page.fill(
      '[data-testid="product-description"]',
      'Produit expédié par affilié pour tests E2E'
    );
    await page.fill('[data-testid="affiliate-payout-ht"]', '80');

    // Ensure Verone storage is disabled (should be default)
    const storageToggle = page.locator('[data-testid="store-at-verone"]');
    await storageToggle.uncheck();

    // Dimensions should not be required and can be left empty

    // Step 4: Submit form
    await page.click('button[type="submit"]:has-text("Créer produit")');

    // Step 5: Wait for redirect to product detail page
    await page.waitForURL(/\/mes-produits\/[a-f0-9-]+$/);

    // Get product ID from URL
    const productUrl = page.url();
    const productId = productUrl.split('/').pop()!;

    // Step 6: Verify product in database
    const product = await getProductById(productId);

    expect(product.name).toBe(productName);
    expect(product.store_at_verone).toBe(false);
    expect(product.length_cm).toBeNull();
    expect(product.width_cm).toBeNull();
    expect(product.height_cm).toBeNull();
    expect(product.affiliate_payout_ht).toBe(80);

    // Step 7: Verify UI shows affiliate-managed badge
    await expect(page.locator('text=Géré par vous')).toBeVisible();
  });

  test('2.3: Dimensions required when store_at_verone is true', async ({
    page,
  }) => {
    // Step 1: Login as independent organization
    await loginLinkMe(page, CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Step 2: Navigate to create product page
    await page.goto('http://localhost:3002/mes-produits/nouveau');
    await page.waitForLoadState('networkidle');

    // Step 3: Fill product form with storage enabled but NO dimensions
    const productName = generateTestProductName('Produit Dimensions Manquantes');

    await page.fill('[data-testid="product-name"]', productName);
    await page.fill(
      '[data-testid="product-description"]',
      'Test validation des dimensions'
    );
    await page.fill('[data-testid="affiliate-payout-ht"]', '100');

    // Enable Verone storage
    const storageToggle = page.locator('[data-testid="store-at-verone"]');
    await storageToggle.check();

    // Leave dimensions empty (should trigger validation error)

    // Step 4: Attempt to submit form
    await page.click('button[type="submit"]:has-text("Créer produit")');

    // Step 5: Verify validation errors are displayed
    await expect(
      page.locator('text=La longueur est requise quand le stockage Vérone est activé')
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.locator('text=La largeur est requise quand le stockage Vérone est activé')
    ).toBeVisible();

    await expect(
      page.locator('text=La hauteur est requise quand le stockage Vérone est activé')
    ).toBeVisible();

    // Step 6: Verify form was NOT submitted (still on same page)
    expect(page.url()).toContain('/mes-produits/nouveau');

    // Step 7: Fill dimensions and verify form submits successfully
    await page.fill('[data-testid="length-cm"]', '40');
    await page.fill('[data-testid="width-cm"]', '25');
    await page.fill('[data-testid="height-cm"]', '15');

    // Submit form again
    await page.click('button[type="submit"]:has-text("Créer produit")');

    // Verify redirect to product detail page (form submitted successfully)
    await page.waitForURL(/\/mes-produits\/[a-f0-9-]+$/);

    // Get product ID from URL
    const productUrl = page.url();
    const productId = productUrl.split('/').pop()!;

    // Verify product was created with dimensions
    const product = await getProductById(productId);
    expect(product.length_cm).toBe(40);
    expect(product.width_cm).toBe(25);
    expect(product.height_cm).toBe(15);
  });
});
