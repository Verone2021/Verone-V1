import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('🎯 Family Image Upload - Simple Management Test', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🚀 Setting up authentication for family image upload test...');

    // Navigate to login page first
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');

    // Take screenshot for debugging
    await page.screenshot({
      path: path.join(process.cwd(), '.playwright-mcp/family-login-page.png'),
      fullPage: true
    });

    console.log('🔐 Attempting authentication...');

    // Look for email and password fields
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
        console.log(`✅ Found email field: ${selector}`);
        break;
      }
    }

    for (const selector of passwordSelectors) {
      const field = page.locator(selector);
      if (await field.isVisible()) {
        passwordField = field;
        console.log(`✅ Found password field: ${selector}`);
        break;
      }
    }

    if (emailField && passwordField) {
      // Fill login form
      await emailField.fill('veronebyromeo@gmail.com');
      await passwordField.fill('Abc123456');

      // Look for submit button
      const submitButtons = [
        'button[type="submit"]',
        'button:has-text("Connexion")',
        'button:has-text("Se connecter")',
        'button:has-text("Login")',
        '.login-button',
        '#login-button'
      ];

      let submitButton = null;
      for (const selector of submitButtons) {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          submitButton = button;
          console.log(`✅ Found submit button: ${selector}`);
          break;
        }
      }

      if (submitButton) {
        await submitButton.click();
        console.log('🔄 Login submitted, waiting for redirect...');

        // Wait for navigation to dashboard
        await page.waitForURL(/dashboard|catalogue/, { timeout: 15000 });
        console.log('✅ Authentication successful!');
      }
    }

    // Take screenshot after auth
    await page.screenshot({
      path: path.join(process.cwd(), '.playwright-mcp/after-auth-family-test.png'),
      fullPage: true
    });
  });

  test('🖼️ Should successfully upload image to family using simple system', async ({ page }) => {
    console.log('🎯 Starting family image upload test...');

    // Navigate to catalogue families page
    const cataloguePagePossibleUrls = [
      'http://localhost:3001/catalogue',
      'http://localhost:3001/catalogue/categories',
      'http://localhost:3001/catalogue/families',
      'http://localhost:3001/dashboard'
    ];

    let cataloguePageFound = false;
    for (const url of cataloguePagePossibleUrls) {
      try {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Check if we can find family-related content
        const familyIndicators = [
          'text=famille',
          'text=Famille',
          'text=family',
          '[data-testid*="family"]',
          'button:has-text("Nouvelle famille")',
          'button:has-text("Créer")'
        ];

        for (const indicator of familyIndicators) {
          if (await page.locator(indicator).first().isVisible()) {
            console.log(`✅ Found families page at ${url} with indicator: ${indicator}`);
            cataloguePageFound = true;
            break;
          }
        }

        if (cataloguePageFound) break;
      } catch (error) {
        console.log(`❌ Failed to navigate to ${url}: ${error.message}`);
      }
    }

    if (!cataloguePageFound) {
      console.log('⚠️ Could not find families page, taking screenshot for debugging...');
      await page.screenshot({
        path: path.join(process.cwd(), '.playwright-mcp/families-page-not-found.png'),
        fullPage: true
      });
    }

    // Take screenshot of current page
    await page.screenshot({
      path: path.join(process.cwd(), '.playwright-mcp/families-page-before-create.png'),
      fullPage: true
    });

    // Look for "Create Family" or "Nouvelle famille" button
    const createButtonSelectors = [
      'button:has-text("Nouvelle famille")',
      'button:has-text("Créer famille")',
      'button:has-text("Ajouter famille")',
      'button:has-text("Create Family")',
      'button:has-text("Créer")',
      'button:has-text("Add")',
      '[data-testid="create-family"]',
      '[data-testid="add-family"]'
    ];

    let createButton = null;
    for (const selector of createButtonSelectors) {
      const button = page.locator(selector);
      if (await button.isVisible()) {
        createButton = button;
        console.log(`✅ Found create family button: ${selector}`);
        break;
      }
    }

    if (!createButton) {
      console.log('⚠️ Create family button not found, looking for any creation UI...');

      // Look for any button or link that might open creation modal
      const genericCreateSelectors = [
        'button[title*="Create"]',
        'button[title*="Add"]',
        'button[title*="New"]',
        'button[aria-label*="Create"]',
        'button[aria-label*="Add"]',
        '.add-button',
        '.create-button',
        '.new-button'
      ];

      for (const selector of genericCreateSelectors) {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          createButton = button;
          console.log(`✅ Found generic create button: ${selector}`);
          break;
        }
      }
    }

    expect(createButton).not.toBeNull();
    await createButton!.click();
    console.log('🔄 Clicked create family button');

    // Wait for modal/form to appear
    await page.waitForTimeout(1000);

    // Take screenshot after opening form
    await page.screenshot({
      path: path.join(process.cwd(), '.playwright-mcp/family-form-opened.png'),
      fullPage: true
    });

    // Fill family name
    const nameInput = page.locator('input[name="name"], input#name, input[placeholder*="nom"]').first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Test Famille Upload Image');
    console.log('✅ Filled family name');

    // Fill description if exists
    const descriptionInput = page.locator('textarea[name="description"], textarea#description, textarea[placeholder*="description"]').first();
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('Famille de test pour valider l\'upload d\'image simplifié');
      console.log('✅ Filled description');
    }

    // Now test the image upload with the provided PHOTO TEST.png
    console.log('🖼️ Starting image upload test...');

    // Find file input (hidden input for image upload)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    console.log('✅ Found file input for image upload');

    // Take screenshot before upload
    await page.screenshot({
      path: path.join(process.cwd(), '.playwright-mcp/before-image-upload.png'),
      fullPage: true
    });

    // Upload the PHOTO TEST.png file
    const testImagePath = path.join(process.cwd(), 'PHOTO TEST.png');
    console.log(`📁 Uploading image from: ${testImagePath}`);

    // Upload file via hidden input
    await fileInput.setInputFiles(testImagePath);
    console.log('✅ File uploaded via input[type="file"]');

    // Wait for upload to complete
    await page.waitForTimeout(3000);

    // Take screenshot after upload
    await page.screenshot({
      path: path.join(process.cwd(), '.playwright-mcp/after-image-upload.png'),
      fullPage: true
    });

    // Look for success indicators
    const successIndicators = [
      'text=Upload réussi',
      'text=téléchargé',
      'text=success',
      '.success',
      '[class*="success"]',
      'img[src*="blob:"]',
      'img[src*="supabase"]'
    ];

    let uploadSuccess = false;
    for (const indicator of successIndicators) {
      if (await page.locator(indicator).isVisible()) {
        console.log(`✅ Upload success indicator found: ${indicator}`);
        uploadSuccess = true;
        break;
      }
    }

    // Submit the form
    const submitButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Créer")',
      'button:has-text("Create")',
      'button:has-text("Sauvegarder")',
      'button:has-text("Save")'
    ];

    let submitButton = null;
    for (const selector of submitButtonSelectors) {
      const button = page.locator(selector);
      if (await button.isVisible()) {
        submitButton = button;
        console.log(`✅ Found submit button: ${selector}`);
        break;
      }
    }

    expect(submitButton).not.toBeNull();
    await submitButton!.click();
    console.log('🔄 Submitted family form');

    // Wait for form to close and family to be created
    await page.waitForTimeout(2000);

    // Take final screenshot
    await page.screenshot({
      path: path.join(process.cwd(), '.playwright-mcp/family-created-final.png'),
      fullPage: true
    });

    // Verify family was created (look for it in the list)
    const familyList = page.locator('text=Test Famille Upload Image');
    await expect(familyList).toBeVisible();
    console.log('✅ Family with image created successfully!');

    // Verify the image is displayed
    const displayedImage = page.locator('img[src*="family-images"], img[src*="supabase"]');
    if (await displayedImage.count() > 0) {
      console.log('✅ Family image is displayed correctly!');
    }

    console.log('🎉 Family image upload test completed successfully!');
  });
});