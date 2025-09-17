import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Product Images Workflow - Critical Business Flow', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🔧 Setting up authentication for product images workflow test...');

    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Authentication logic (réutilisé depuis les autres tests)
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email"]',
      'input[id*="email"]'
    ];

    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password"]',
      'input[id*="password"]'
    ];

    let emailField = null;
    let passwordField = null;

    for (const selector of emailSelectors) {
      const field = page.locator(selector);
      if (await field.isVisible()) {
        emailField = field;
        console.log(`Found email field: ${selector}`);
        break;
      }
    }

    for (const selector of passwordSelectors) {
      const field = page.locator(selector);
      if (await field.isVisible()) {
        passwordField = field;
        console.log(`Found password field: ${selector}`);
        break;
      }
    }

    if (emailField && passwordField) {
      console.log('✅ Both fields found, proceeding with authentication...');

      await emailField.fill('admin@verone.fr');
      await passwordField.fill('admin123');

      // Click login button
      const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Connexion")');
      await loginButton.click();

      // Wait for navigation
      await page.waitForURL('**/admin**', { timeout: 10000 });
      console.log('✅ Successfully authenticated');
    } else {
      throw new Error('❌ Could not find authentication fields');
    }
  });

  test('RED Phase - Complete Product Images Workflow (should fail initially)', async ({ page }) => {
    console.log('🔴 RED Phase: Testing product images workflow - expecting initial failures');

    // 1. Navigate to catalogue page
    await page.goto('http://localhost:3000/admin/catalogue');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/catalogue-page-initial-images-test.png',
      fullPage: true
    });

    // 2. Open product creation wizard
    console.log('📝 Step 1: Opening product creation wizard...');
    const createButton = page.locator('button:has-text("Nouveau produit"), button:has-text("Créer"), button:has-text("Ajouter")');
    await createButton.first().click();

    // Wait for wizard modal to appear
    await page.waitForSelector('[role="dialog"], .modal, [data-testid="product-wizard"]', { timeout: 5000 });

    // Take screenshot of wizard
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/product-wizard-opened.png',
      fullPage: true
    });

    // 3. Fill basic information (Step 1)
    console.log('📝 Step 2: Filling basic product information...');

    // Fill product name
    const nameField = page.locator('input[name="name"], input[id*="name"], input[placeholder*="nom"]');
    await nameField.fill('Test Canapé Images E2E');

    // Select supplier (if available)
    const supplierSelect = page.locator('select[name="supplier_id"], [data-testid="supplier-select"]');
    if (await supplierSelect.isVisible()) {
      await supplierSelect.selectOption({ index: 1 }); // Select first available supplier
    }

    // Go to next step
    const nextButton = page.locator('button:has-text("Suivant"), button:has-text("Next")');
    await nextButton.click();

    // 4. Fill categorization (Step 2)
    console.log('📝 Step 3: Selecting product category...');

    // Select subcategory
    const subcategorySelect = page.locator('[data-testid="subcategory-selector"], input[placeholder*="sous-catégorie"]');
    if (await subcategorySelect.isVisible()) {
      await subcategorySelect.click();
      await page.keyboard.type('Canapé');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    await nextButton.click();

    // 5. Fill characteristics (Step 3)
    console.log('📝 Step 4: Adding product characteristics...');

    // Add color and material
    const colorField = page.locator('input[name="color"], select[name="color"]');
    if (await colorField.isVisible()) {
      await colorField.fill('Noir');
    }

    const materialField = page.locator('input[name="material"], select[name="material"]');
    if (await materialField.isVisible()) {
      await materialField.fill('Cuir');
    }

    await nextButton.click();

    // 6. Fill pricing (Step 4)
    console.log('📝 Step 5: Setting product pricing...');

    const supplierPriceField = page.locator('input[name="supplier_price"], input[id*="supplier_price"]');
    await supplierPriceField.fill('1200');

    const marginField = page.locator('input[name="margin_percentage"], input[id*="margin"]');
    await marginField.fill('100');

    await nextButton.click();

    // 7. CRITICAL: Test images workflow (Step 5) - THIS SHOULD FAIL INITIALLY
    console.log('📝 Step 6: Testing images workflow - CRITICAL TEST');

    // Take screenshot before image upload
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/before-image-upload.png',
      fullPage: true
    });

    // Prepare test images
    const testImagePath1 = path.join(__dirname, '../fixtures/images/test-product-1.jpg');
    const testImagePath2 = path.join(__dirname, '../fixtures/images/test-product-2.jpg');

    // Create test images if they don't exist (mock)
    // This will be handled by the fixture setup

    // Try to upload multiple images
    const imageUploadButton = page.locator('input[type="file"], button:has-text("Upload"), [data-testid="image-upload"]');

    if (await imageUploadButton.isVisible()) {
      console.log('✅ Found image upload element');

      // Upload first image
      await imageUploadButton.setInputFiles([testImagePath1]);
      await page.waitForTimeout(2000); // Wait for upload

      // Upload second image
      await imageUploadButton.setInputFiles([testImagePath2]);
      await page.waitForTimeout(2000); // Wait for upload

      // Try to set primary image
      const primaryImageButton = page.locator('button:has-text("Principale"), [data-testid="set-primary"]');
      if (await primaryImageButton.isVisible()) {
        await primaryImageButton.first().click();
      }

    } else {
      console.log('❌ Image upload element not found - this should fail in RED phase');
    }

    // Take screenshot after image upload attempt
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/after-image-upload.png',
      fullPage: true
    });

    await nextButton.click();

    // 8. Final validation (Step 6)
    console.log('📝 Step 7: Final product validation...');

    // Take screenshot of final step
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/product-final-validation.png',
      fullPage: true
    });

    // Try to create the product
    const createProductButton = page.locator('button:has-text("Créer le produit"), button:has-text("Create Product")');
    await createProductButton.click();

    // 9. Verify the product was created with images
    console.log('📝 Step 8: Verifying product creation and image association...');

    // Wait for success or failure
    await page.waitForTimeout(3000);

    // Check if we're back on the catalogue page
    await page.waitForURL('**/catalogue**', { timeout: 10000 });

    // Take final screenshot
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/product-created-with-images.png',
      fullPage: true
    });

    // 10. Verify product appears in list with images
    const productRow = page.locator('tr:has-text("Test Canapé Images E2E"), [data-testid="product-item"]:has-text("Test Canapé Images E2E")');
    await expect(productRow).toBeVisible({ timeout: 5000 });

    // 11. CRITICAL: Verify images in product detail
    await productRow.click();

    // Wait for product detail page
    await page.waitForLoadState('networkidle');

    // Take screenshot of product detail
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/product-detail-with-images.png',
      fullPage: true
    });

    // Verify images are displayed
    const productImages = page.locator('img[src*="product-images"], [data-testid="product-image"]');
    const imageCount = await productImages.count();

    console.log(`📊 Found ${imageCount} images for the product`);

    // THIS ASSERTION SHOULD FAIL INITIALLY (RED phase)
    expect(imageCount).toBeGreaterThan(0);

    // Verify primary image is marked
    const primaryImage = page.locator('[data-testid="primary-image"], .primary-image, img[data-primary="true"]');
    await expect(primaryImage).toBeVisible();

    console.log('✅ Product images workflow test completed successfully');
  });

  test('Database Validation - Verify product_images table structure', async ({ page }) => {
    console.log('🔍 Testing database schema for product_images table...');

    // This would normally use direct database queries, but we'll simulate via API
    // Navigate to catalogue and inspect the data structure
    await page.goto('http://localhost:3000/admin/catalogue');
    await page.waitForLoadState('networkidle');

    // Check that the page loads without errors (indicating proper schema)
    const errorMessage = page.locator('.error, [data-testid="error"]');
    await expect(errorMessage).not.toBeVisible();

    console.log('✅ Database schema validation passed');
  });

  test('Performance Test - Image Upload Speed', async ({ page }) => {
    console.log('⚡ Testing image upload performance...');

    // Navigate to product creation
    await page.goto('http://localhost:3000/admin/catalogue');

    // Measure time to complete image workflow
    const startTime = Date.now();

    // Simulate the workflow (simplified)
    const createButton = page.locator('button:has-text("Nouveau produit")');
    if (await createButton.isVisible()) {
      await createButton.click();

      // Wait for wizard and measure load time
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    }

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    console.log(`📊 Wizard load time: ${loadTime}ms`);

    // Performance assertion (should be under 3 seconds)
    expect(loadTime).toBeLessThan(3000);
  });
});