import { test, expect } from '@playwright/test';
import { loginLinkMe, CREDENTIALS } from './fixtures/auth';
import {
  createTestProduct,
  createTestOrder,
  getLinkmeeChannelId,
  cleanupTestData,
} from './fixtures/database';
import {
  generateTestProductName,
  generateTestCustomerName,
} from './fixtures/test-data';

/**
 * E2E Tests: Data Isolation (RLS)
 * Validates that RLS policies properly isolate data between affiliates
 */

test.describe('Data Isolation (RLS)', () => {
  test.afterAll(async () => {
    // Cleanup test data after all tests
    await cleanupTestData();
  });

  test('5.1: Enseigne cannot see independent org products', async ({
    page,
  }) => {
    // Step 1: Create product as independent organization
    const productName = generateTestProductName('Org Private Product');
    const productId = await createTestProduct({
      name: productName,
      description: 'Product owned by independent organization',
      affiliate_payout_ht: 100,
      store_at_verone: false,
      created_by_affiliate: 'test-org-affiliate-id', // Independent org affiliate ID
      organisation_id: 'test-org-id', // Replace with actual org ID
    });

    // Step 2: Login as Pokawa (enseigne)
    await loginLinkMe(page, CREDENTIALS.pokawa.email, CREDENTIALS.pokawa.password);

    // Step 3: Navigate to "Mes produits" page
    await page.goto('http://localhost:3002/mes-produits');
    await page.waitForLoadState('networkidle');

    // Step 4: Verify product is NOT visible in list
    const productCard = page.locator(`text=${productName}`);
    await expect(productCard).not.toBeVisible();

    // Step 5: Try to access product detail page directly
    await page.goto(`http://localhost:3002/mes-produits/${productId}`);

    // Step 6: Verify access is denied (403 error or redirect)
    // Expected behavior: redirect to 404 or error page
    await page.waitForTimeout(2000);

    // Check if we're still on the product detail page (we shouldn't be)
    const currentUrl = page.url();
    const isOnProductPage = currentUrl.includes(`/mes-produits/${productId}`);

    if (isOnProductPage) {
      // If we're still on the page, verify error message is displayed
      await expect(
        page.locator('text=Vous n\'avez pas accès à ce produit')
      ).toBeVisible();
    } else {
      // If redirected, verify we're on 404 or error page
      const is404 = currentUrl.includes('/404') || currentUrl.includes('/error');
      expect(is404 || currentUrl.includes('/mes-produits')).toBeTruthy();
    }

    // Step 7: Verify product is not visible in catalogue either
    await page.goto('http://localhost:3002/catalogue');
    await page.waitForLoadState('networkidle');

    // Search for product name
    const searchInput = page.locator('[data-testid="search-products"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(productName);
      await page.waitForTimeout(1000);
    }

    // Verify product is NOT in catalogue results
    const catalogueProductCard = page.locator(`text=${productName}`);
    await expect(catalogueProductCard).not.toBeVisible();
  });

  test('5.2: Independent org cannot see enseigne orders', async ({ page }) => {
    // Step 1: Create test order as Pokawa
    const channelId = await getLinkmeeChannelId();
    const customerName = generateTestCustomerName('Pokawa Customer');

    const orderId = await createTestOrder({
      customer_name: customerName,
      customer_email: 'pokawa-customer@verone-e2e.fr',
      channel_id: channelId,
      affiliate_id: 'pokawa-affiliate-id', // Pokawa affiliate ID
      montant_ht: 200,
      montant_ttc: 240,
      status: 'paid',
    });

    // Step 2: Login as independent organization
    await loginLinkMe(page, CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Step 3: Navigate to "Commandes" page
    await page.goto('http://localhost:3002/commandes');
    await page.waitForLoadState('networkidle');

    // Step 4: Verify order is NOT visible in list
    const orderRow = page.locator(`text=${customerName}`);
    await expect(orderRow).not.toBeVisible();

    // Step 5: Try to access order detail page directly
    await page.goto(`http://localhost:3002/commandes/${orderId}`);

    // Step 6: Verify access is denied (403 error or redirect)
    await page.waitForTimeout(2000);

    // Check if we're still on the order detail page (we shouldn't be)
    const currentUrl = page.url();
    const isOnOrderPage = currentUrl.includes(`/commandes/${orderId}`);

    if (isOnOrderPage) {
      // If we're still on the page, verify error message is displayed
      await expect(
        page.locator('text=Vous n\'avez pas accès à cette commande')
      ).toBeVisible();
    } else {
      // If redirected, verify we're on 404 or error page
      const is404 = currentUrl.includes('/404') || currentUrl.includes('/error');
      expect(is404 || currentUrl.includes('/commandes')).toBeTruthy();
    }

    // Step 7: Verify order search returns no results
    await page.goto('http://localhost:3002/commandes');
    await page.waitForLoadState('networkidle');

    // Search for order by customer name
    const searchInput = page.locator('[data-testid="search-orders"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(customerName);
      await page.waitForTimeout(1000);

      // Verify no results message
      const noResults = page.locator('text=Aucune commande trouvée');
      const orderResult = page.locator(`text=${customerName}`);

      // Either no results message is shown, or order is not in results
      const noResultsVisible = await noResults.isVisible();
      const orderVisible = await orderResult.isVisible();

      expect(noResultsVisible || !orderVisible).toBeTruthy();
    }
  });
});
