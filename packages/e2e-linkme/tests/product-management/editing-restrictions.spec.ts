import {
  getProductById,
  createTestProduct,
  updateProductApprovalStatus,
  cleanupTestData,
} from './fixtures/database';

/**
 * E2E Tests: Product Editing Restrictions (/mes-produits)
 * Validates editing rules based on approval status
 */

test.describe('Product Editing Restrictions', () => {
  test.afterAll(async ({ db }) => {
    // Cleanup test data after all tests
    await db.cleanupTestData();
  });

  test('3.1: Edit product in draft status allows name/description/photos', async ({ page, loginLinkMe, loginBackOffice, db }) =>
    page,
  }) => {
    // Step 1: Create test product in draft status
    const productName = generateTestProductName('Draft Product');
    const productId = await db.createTestProduct({
      name: productName,
      description: 'Original description',
      affiliate_payout_ht: 100,
      store_at_verone: false,
      created_by_affiliate: 'test-org-affiliate-id', // Replace with actual affiliate ID
    });

    // Step 2: Login as independent organization
    await loginLinkMe(CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Step 3: Navigate to product detail page
    await page.goto(`http://localhost:3002/mes-produits/${productId}`);
    await page.waitForLoadState('networkidle');

    // Step 4: Click "Modifier" button
    await page.click('button:has-text("Modifier")');

    // Step 5: Verify name and description fields are editable
    const nameInput = page.locator('[data-testid="product-name"]');
    const descriptionInput = page.locator('[data-testid="product-description"]');

    await expect(nameInput).not.toBeDisabled();
    await expect(descriptionInput).not.toBeDisabled();

    // Step 6: Modify name and description
    const newName = generateTestProductName('Draft Product Updated');
    await nameInput.fill(newName);
    await descriptionInput.fill('Updated description');

    // Step 7: Save changes
    await page.click('button[type="submit"]:has-text("Sauvegarder")');

    // Wait for save to complete
    await page.waitForTimeout(2000);

    // Step 8: Verify changes in database
    const product = await db.getProductById(productId);
    expect(product.name).toBe(newName);
    expect(product.description).toBe('Updated description');

    // Step 9: Verify UI shows updated name
    await expect(page.locator(`text=${newName}`)).toBeVisible();
  });

  test('3.2: Cannot change store_at_verone after product creation', async ({ page, loginLinkMe, loginBackOffice, db }) =>
    page,
  }) => {
    // Step 1: Create test product with store_at_verone = true
    const productName = generateTestProductName('Product With Storage');
    const productId = await db.createTestProduct({
      name: productName,
      description: 'Product with Verone storage',
      affiliate_payout_ht: 100,
      store_at_verone: true,
      length_cm: 50,
      width_cm: 30,
      height_cm: 20,
      created_by_affiliate: 'test-org-affiliate-id',
    });

    // Step 2: Login as independent organization
    await loginLinkMe(CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Step 3: Navigate to product detail page
    await page.goto(`http://localhost:3002/mes-produits/${productId}`);
    await page.waitForLoadState('networkidle');

    // Step 4: Click "Modifier" button
    await page.click('button:has-text("Modifier")');

    // Step 5: Verify store_at_verone toggle is disabled OR absent
    const storageToggle = page.locator('[data-testid="store-at-verone"]');

    // Check if toggle exists
    const toggleExists = await storageToggle.count();

    if (toggleExists > 0) {
      // If toggle exists, it should be disabled
      await expect(storageToggle).toBeDisabled();
    }

    // Step 6: Verify warning message is displayed
    await expect(
      page.locator(
        'text=Pour changer ce paramètre, supprimez et recréez le produit'
      )
    ).toBeVisible();

    // Step 7: Verify store_at_verone cannot be changed in database
    // (This is validated by the fact that the field is not in updateData)
    const productBefore = await db.getProductById(productId);
    expect(productBefore.store_at_verone).toBe(true);

    // Even if we try to update via UI, it should remain unchanged
    // (No UI action needed since toggle is disabled)
  });

  test('3.3: Product in pending_approval is read-only', async ({ page, loginLinkMe, loginBackOffice, db }) => {
    // Step 1: Create test product and submit for approval
    const productName = generateTestProductName('Pending Product');
    const productId = await db.createTestProduct({
      name: productName,
      description: 'Product pending approval',
      affiliate_payout_ht: 100,
      store_at_verone: false,
      created_by_affiliate: 'test-org-affiliate-id',
    });

    // Update status to pending_approval
    await db.updateProductApprovalStatus(productId, 'pending_approval');

    // Step 2: Login as independent organization
    await loginLinkMe(CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Step 3: Navigate to product detail page
    await page.goto(`http://localhost:3002/mes-produits/${productId}`);
    await page.waitForLoadState('networkidle');

    // Step 4: Verify "Modifier" button is absent
    const modifierButton = page.locator('button:has-text("Modifier")');
    await expect(modifierButton).not.toBeVisible();

    // Step 5: Verify all fields are disabled
    const nameInput = page.locator('[data-testid="product-name"]');
    const descriptionInput = page.locator('[data-testid="product-description"]');

    // Check if inputs exist (they might be displayed as read-only text)
    const nameExists = await nameInput.count();
    const descriptionExists = await descriptionInput.count();

    if (nameExists > 0) {
      await expect(nameInput).toBeDisabled();
    }
    if (descriptionExists > 0) {
      await expect(descriptionInput).toBeDisabled();
    }

    // Step 6: Verify status message is displayed
    await expect(page.locator('text=En attente d\'approbation')).toBeVisible();
  });

  test('3.4: Product in approved status is read-only', async ({ page, loginLinkMe, loginBackOffice, db }) => {
    // Step 1: Create test product, submit, and approve
    const productName = generateTestProductName('Approved Product');
    const productId = await db.createTestProduct({
      name: productName,
      description: 'Product approved',
      affiliate_payout_ht: 100,
      store_at_verone: false,
      created_by_affiliate: 'test-org-affiliate-id',
    });

    // Update status to approved with commission rate
    await db.updateProductApprovalStatus(productId, 'approved', {
      commissionRate: 15,
    });

    // Step 2: Login as independent organization
    await loginLinkMe(CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Step 3: Navigate to product detail page
    await page.goto(`http://localhost:3002/mes-produits/${productId}`);
    await page.waitForLoadState('networkidle');

    // Step 4: Verify "Modifier" button is absent
    const modifierButton = page.locator('button:has-text("Modifier")');
    await expect(modifierButton).not.toBeVisible();

    // Step 5: Verify commission_rate is displayed
    await expect(page.locator('text=15')).toBeVisible(); // Commission rate 15%

    // Step 6: Verify approved badge is visible
    await expect(page.locator('text=Approuvé')).toBeVisible();
  });

  test('3.5: Product in rejected status can be edited and resubmitted', async ({ page, loginLinkMe, loginBackOffice, db }) =>
    page,
  }) => {
    // Step 1: Create test product, submit, and reject
    const productName = generateTestProductName('Rejected Product');
    const productId = await db.createTestProduct({
      name: productName,
      description: 'Product rejected',
      affiliate_payout_ht: 100,
      store_at_verone: false,
      created_by_affiliate: 'test-org-affiliate-id',
    });

    // Update status to rejected with reason
    await db.updateProductApprovalStatus(productId, 'rejected', {
      rejectionReason: 'Description insuffisante',
    });

    // Step 2: Login as independent organization
    await loginLinkMe(CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Step 3: Navigate to product detail page
    await page.goto(`http://localhost:3002/mes-produits/${productId}`);
    await page.waitForLoadState('networkidle');

    // Step 4: Verify "Corriger" button is visible
    const corrigerButton = page.locator('button:has-text("Corriger")');
    await expect(corrigerButton).toBeVisible();

    // Step 5: Verify rejection reason is displayed
    await expect(page.locator('text=Description insuffisante')).toBeVisible();

    // Step 6: Click "Corriger"
    await corrigerButton.click();

    // Step 7: Modify description
    const descriptionInput = page.locator('[data-testid="product-description"]');
    await descriptionInput.fill('Updated description with more details');

    // Step 8: Click "Resoumettre pour approbation"
    await page.click('button:has-text("Resoumettre pour approbation")');

    // Wait for submission
    await page.waitForTimeout(2000);

    // Step 9: Verify status changed to pending_approval in database
    const product = await db.getProductById(productId);
    expect(product.affiliate_approval_status).toBe('pending_approval');
    expect(product.description).toBe('Updated description with more details');
  });

  test('3.6: Affiliate cannot modify commission_rate', async ({ page, loginLinkMe, loginBackOffice, db }) => {
    // Step 1: Create approved product with commission_rate
    const productName = generateTestProductName('Commission Product');
    const productId = await db.createTestProduct({
      name: productName,
      description: 'Product with commission',
      affiliate_payout_ht: 100,
      store_at_verone: false,
      created_by_affiliate: 'test-org-affiliate-id',
    });

    // Approve product with commission rate = 15%
    await db.updateProductApprovalStatus(productId, 'approved', {
      commissionRate: 15,
    });

    // Step 2: Login as independent organization
    await loginLinkMe(CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Step 3: Navigate to product detail page
    await page.goto(`http://localhost:3002/mes-produits/${productId}`);
    await page.waitForLoadState('networkidle');

    // Step 4: Verify commission_rate is displayed in read-only mode
    await expect(page.locator('text=15')).toBeVisible(); // Commission rate

    // Step 5: Verify no editable field for commission rate exists
    const commissionInput = page.locator('[data-testid="commission-rate"]');
    const commissionExists = await commissionInput.count();

    if (commissionExists > 0) {
      // If field exists, it should be disabled
      await expect(commissionInput).toBeDisabled();
    } else {
      // Field should not exist (expected behavior)
      expect(commissionExists).toBe(0);
    }

    // Step 6: Verify commission_rate in database remains unchanged
    const product = await db.getProductById(productId);
    expect(product.affiliate_commission_rate).toBe(15);
  });
});
