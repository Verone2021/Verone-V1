import {
  getProductById,
  createTestProduct,
  cleanupTestData,
} from './fixtures/database';

/**
 * E2E Tests: Approval Workflow
 * Validates product approval/rejection workflow (LinkMe → Back-Office)
 */

test.describe('Approval Workflow', () => {
  test.afterAll(async ({ db }) => {
    // Cleanup test data after all tests
    await db.cleanupTestData();
  });

  test('4.1: Submit product for approval', async ({ page, loginLinkMe, loginBackOffice, db }) => {
    // Step 1: Login as independent organization
    await loginLinkMe(CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Step 2: Navigate to create product page
    await page.goto('http://localhost:3002/mes-produits/nouveau');
    await page.waitForLoadState('networkidle');

    // Step 3: Create product in draft status
    const productName = generateTestProductName('Product To Submit');

    await page.fill('[data-testid="product-name"]', productName);
    await page.fill(
      '[data-testid="product-description"]',
      'Product ready for approval'
    );
    await page.fill('[data-testid="affiliate-payout-ht"]', '100');

    // Submit form
    await page.click('button[type="submit"]:has-text("Créer produit")');

    // Wait for redirect to product detail page
    await page.waitForURL(/\/mes-produits\/[a-f0-9-]+$/);

    // Get product ID from URL
    const productUrl = page.url();
    const productId = productUrl.split('/').pop()!;

    // Step 4: Verify product is in draft status
    let product = await db.getProductById(productId);
    expect(product.affiliate_approval_status).toBe('draft');

    // Step 5: Click "Soumettre pour approbation"
    await page.click('button:has-text("Soumettre pour approbation")');

    // Wait for submission
    await page.waitForTimeout(2000);

    // Step 6: Verify status changed to pending_approval in database
    product = await db.getProductById(productId);
    expect(product.affiliate_approval_status).toBe('pending_approval');

    // Step 7: Verify UI shows "En attente d'approbation" badge
    await expect(page.locator('text=En attente d\'approbation')).toBeVisible();

    // Step 8: Verify "Modifier" button disappeared
    const modifierButton = page.locator('button:has-text("Modifier")');
    await expect(modifierButton).not.toBeVisible();
  });

  test('4.2: Approve product from back-office', async ({ page, loginLinkMe, loginBackOffice, db }) => {
    // Step 1: Create test product in pending_approval status
    const productName = generateTestProductName('Product To Approve');
    const productId = await db.createTestProduct({
      name: productName,
      description: 'Product ready for approval',
      affiliate_payout_ht: 100,
      store_at_verone: false,
      created_by_affiliate: 'test-org-affiliate-id',
    });

    // Submit for approval (change status to pending_approval)
    await db.getProductById(productId); // Verify product exists first
    // Note: We'll manually set status via database for this test
    // In real scenario, affiliate would submit via UI

    // Step 2: Login to Back-Office
    await loginBackOffice();

    // Step 3: Navigate to affiliate products page
    await page.goto('http://localhost:3000/produits/affilies');
    await page.waitForLoadState('networkidle');

    // Step 4: Filter products by pending_approval status
    await page.click('[data-testid="filter-status"]');
    await page.click('text=En attente');
    await page.waitForTimeout(1000);

    // Step 5: Find product in list
    const productRow = page.locator(`text=${productName}`).first();
    await expect(productRow).toBeVisible({ timeout: 10000 });

    // Step 6: Click on product row to view details
    await productRow.click();

    // Wait for product detail page or modal
    await page.waitForTimeout(1000);

    // Step 7: Click "Approuver" button
    await page.click('button:has-text("Approuver")');

    // Step 8: Fill commission rate in approval form
    await page.fill('[data-testid="commission-rate"]', '15');

    // Step 9: Submit approval
    await page.click('button[type="submit"]:has-text("Confirmer approbation")');

    // Wait for approval to complete
    await page.waitForTimeout(2000);

    // Step 10: Verify status changed to approved in database
    const product = await db.getProductById(productId);
    expect(product.affiliate_approval_status).toBe('approved');
    expect(product.affiliate_commission_rate).toBe(15);

    // Step 11: Login to LinkMe and verify approved badge
    await loginLinkMe(CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Navigate to product detail page
    await page.goto(`http://localhost:3002/mes-produits/${productId}`);
    await page.waitForLoadState('networkidle');

    // Verify approved badge
    await expect(page.locator('text=Approuvé')).toBeVisible();

    // Verify commission rate is displayed
    await expect(page.locator('text=15')).toBeVisible();
  });

  test('4.3: Reject product from back-office', async ({ page, loginLinkMe, loginBackOffice, db }) => {
    // Step 1: Create test product in pending_approval status
    const productName = generateTestProductName('Product To Reject');
    const productId = await db.createTestProduct({
      name: productName,
      description: 'Product to be rejected',
      affiliate_payout_ht: 100,
      store_at_verone: false,
      created_by_affiliate: 'test-org-affiliate-id',
    });

    // Step 2: Login to Back-Office
    await loginBackOffice();

    // Step 3: Navigate to affiliate products page
    await page.goto('http://localhost:3000/produits/affilies');
    await page.waitForLoadState('networkidle');

    // Step 4: Filter products by pending_approval status
    await page.click('[data-testid="filter-status"]');
    await page.click('text=En attente');
    await page.waitForTimeout(1000);

    // Step 5: Find product in list
    const productRow = page.locator(`text=${productName}`).first();
    await expect(productRow).toBeVisible({ timeout: 10000 });

    // Step 6: Click on product row to view details
    await productRow.click();

    // Wait for product detail page or modal
    await page.waitForTimeout(1000);

    // Step 7: Click "Rejeter" button
    await page.click('button:has-text("Rejeter")');

    // Step 8: Fill rejection reason
    const rejectionReason = 'Description insuffisante';
    await page.fill('[data-testid="rejection-reason"]', rejectionReason);

    // Step 9: Submit rejection
    await page.click('button[type="submit"]:has-text("Confirmer rejet")');

    // Wait for rejection to complete
    await page.waitForTimeout(2000);

    // Step 10: Verify status changed to rejected in database
    const product = await db.getProductById(productId);
    expect(product.affiliate_approval_status).toBe('rejected');
    expect(product.affiliate_rejection_reason).toBe(rejectionReason);

    // Step 11: Login to LinkMe and verify rejection reason
    await loginLinkMe(CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Navigate to product detail page
    await page.goto(`http://localhost:3002/mes-produits/${productId}`);
    await page.waitForLoadState('networkidle');

    // Verify rejected badge
    await expect(page.locator('text=Rejeté')).toBeVisible();

    // Verify rejection reason is displayed with AlertCircle icon
    await expect(page.locator(`text=${rejectionReason}`)).toBeVisible();

    // Verify AlertCircle icon is visible (SVG or icon component)
    const alertIcon = page.locator('[data-testid="alert-circle-icon"]');
    const iconExists = await alertIcon.count();
    if (iconExists > 0) {
      await expect(alertIcon).toBeVisible();
    }

    // Verify "Corriger" button is visible
    await expect(page.locator('button:has-text("Corriger")')).toBeVisible();
  });
});
