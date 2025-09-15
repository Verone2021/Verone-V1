import { test, expect } from '@playwright/test';

test.describe('Family Form Error Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate with correct credentials
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[type="password"]', 'Abc123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  });

  test('should capture exact family form validation errors', async ({ page }) => {
    console.log('=== FAMILY FORM ERROR ANALYSIS ===');

    // Navigate to catalogue categories
    await page.goto('http://localhost:3000/catalogue/categories');
    await page.waitForLoadState('networkidle');

    // Click "Nouvelle Famille" button
    await page.click('button:has-text("Nouvelle famille")');
    await page.waitForTimeout(1000);

    // Take screenshot of initial form state
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/family-form-initial.png',
      fullPage: true
    });

    // Fill the form with test data
    const nameField = page.locator('input[id*="name"]');
    await nameField.fill('Test Famille Debug');

    // Look for description field and fill it
    const descriptionField = page.locator('textarea, input[placeholder*="description"]');
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('Description test pour debug');
    }

    // Take screenshot after filling
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/family-form-filled.png',
      fullPage: true
    });

    // Check for any validation errors BEFORE submit
    const errorElements = await page.locator('.text-red-500, .text-destructive, [role="alert"], .error').all();
    console.log(`Found ${errorElements.length} error elements before submit`);

    for (let i = 0; i < errorElements.length; i++) {
      const errorText = await errorElements[i].textContent();
      if (errorText && errorText.trim()) {
        console.log(`Error ${i + 1}: ${errorText.trim()}`);
      }
    }

    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Take screenshot after submit
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/family-form-after-submit-debug.png',
      fullPage: true
    });

    // Check for validation errors AFTER submit
    const postSubmitErrors = await page.locator('.text-red-500, .text-destructive, [role="alert"], .error').all();
    console.log(`Found ${postSubmitErrors.length} error elements after submit`);

    for (let i = 0; i < postSubmitErrors.length; i++) {
      const errorText = await postSubmitErrors[i].textContent();
      if (errorText && errorText.trim()) {
        console.log(`Post-submit Error ${i + 1}: ${errorText.trim()}`);
      }
    }

    // Check for specific validation patterns
    const validationMessages = await page.locator('[data-testid*="error"], .field-error, .form-error').all();
    console.log(`Found ${validationMessages.length} validation message elements`);

    for (let i = 0; i < validationMessages.length; i++) {
      const msgText = await validationMessages[i].textContent();
      if (msgText && msgText.trim()) {
        console.log(`Validation Message ${i + 1}: ${msgText.trim()}`);
      }
    }

    // Check network requests for API errors
    page.on('response', response => {
      if (response.url().includes('/api/') && !response.ok()) {
        console.log(`❌ API Error: ${response.url()} - ${response.status()} ${response.statusText()}`);
      }
    });

    // Look for required field indicators
    const requiredFields = await page.locator('input[required], textarea[required], select[required]').all();
    console.log(`Found ${requiredFields.length} required fields`);

    for (let i = 0; i < requiredFields.length; i++) {
      const fieldName = await requiredFields[i].getAttribute('name') || await requiredFields[i].getAttribute('id') || 'unknown';
      const fieldValue = await requiredFields[i].inputValue();
      console.log(`Required field "${fieldName}": "${fieldValue}"`);
    }

    // Check if modal is still open (form didn't submit successfully)
    const modalStillOpen = await page.locator('[role="dialog"], .modal, .dialog').isVisible();
    console.log(`Modal still open after submit: ${modalStillOpen}`);

    // Final analysis
    console.log('=== FORM SUBMISSION ANALYSIS ===');
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (modalStillOpen) {
      console.log('❌ Form submission failed - modal still open');
    } else {
      console.log('✅ Form may have submitted successfully - modal closed');
    }
  });

  test('should test minimal family form submission', async ({ page }) => {
    console.log('=== MINIMAL FAMILY FORM TEST ===');

    await page.goto('http://localhost:3000/catalogue/categories');
    await page.waitForLoadState('networkidle');

    // Click to open family form
    await page.click('button:has-text("Nouvelle famille")');
    await page.waitForTimeout(1000);

    // Fill only the name field (minimal required data)
    const nameField = page.locator('input[id*="name"]');
    await nameField.fill('Minimal Test');

    // Try to submit immediately
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check if we see success or error
    const modalVisible = await page.locator('[role="dialog"]').isVisible();
    console.log(`Modal still visible after minimal submit: ${modalVisible}`);

    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/family-form-minimal-test.png',
      fullPage: true
    });
  });
});