import { test, expect } from '@playwright/test';

test.describe('Family Form Debugging - Real Functionality Test', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Setting up authentication for family form test...');

    // Navigate to login page first
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/login-page-state.png',
      fullPage: true
    });

    // Try different authentication strategies
    console.log('Attempting authentication...');

    // Look for email and password fields with various selectors
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
      // Use the test credentials shown on the login page
      await emailField.fill('veronebyromeo@gmail.com');
      await passwordField.fill('Abc123456');

      // Look for submit button
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Se connecter")',
        'button:has-text("Login")',
        'button:has-text("Connexion")',
        'input[type="submit"]'
      ];

      for (const selector of submitSelectors) {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          console.log(`Found submit button: ${selector}`);
          await button.click();
          break;
        }
      }

      // Wait for redirect or authentication to complete
      await page.waitForTimeout(3000);

      // Check if we're redirected to dashboard or catalogue
      const currentUrl = page.url();
      console.log(`Current URL after login attempt: ${currentUrl}`);

      if (!currentUrl.includes('/login')) {
        console.log('✅ Authentication appears successful');
      } else {
        console.log('❌ Still on login page - authentication may have failed');

        // Try alternative credentials
        await emailField.fill('test@verone.com');
        await passwordField.fill('testpassword');

        for (const selector of submitSelectors) {
          const button = page.locator(selector);
          if (await button.isVisible()) {
            await button.click();
            break;
          }
        }
        await page.waitForTimeout(3000);
      }
    } else {
      console.log('❌ Could not find email or password fields');
    }

    // Take screenshot after authentication attempt
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/after-auth-attempt.png',
      fullPage: true
    });
  });

  test('should navigate to catalogue categories and test family form', async ({ page }) => {
    console.log('Starting family form test...');

    // Navigate to catalogue categories
    await page.goto('http://localhost:3000/catalogue/categories');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/family-form-initial-state.png',
      fullPage: true
    });

    // Look for the "Nouvelle Famille" button or similar
    const newFamilyButton = page.locator('button', { hasText: /nouvelle famille/i });
    const addButton = page.locator('button', { hasText: /ajouter/i });
    const createButton = page.locator('button', { hasText: /créer/i });
    const plusButton = page.locator('button[aria-label*="Ajouter"]');

    console.log('Looking for family creation buttons...');

    // Check what buttons are available
    const allButtons = await page.locator('button').all();
    for (const button of allButtons) {
      const text = await button.textContent();
      console.log('Found button:', text);
    }

    // Try to find and click the family creation button
    let familyCreationTriggered = false;

    if (await newFamilyButton.isVisible()) {
      console.log('Clicking "Nouvelle Famille" button');
      await newFamilyButton.click();
      familyCreationTriggered = true;
    } else if (await addButton.isVisible()) {
      console.log('Clicking "Ajouter" button');
      await addButton.click();
      familyCreationTriggered = true;
    } else if (await createButton.isVisible()) {
      console.log('Clicking "Créer" button');
      await createButton.click();
      familyCreationTriggered = true;
    } else if (await plusButton.isVisible()) {
      console.log('Clicking plus button');
      await plusButton.click();
      familyCreationTriggered = true;
    }

    if (!familyCreationTriggered) {
      console.log('No family creation button found, looking for other UI elements...');

      // Check if there's a form already visible
      const nameInput = page.locator('input[name="nom"]');
      const nameField = page.locator('input[placeholder*="nom"]');

      if (await nameInput.isVisible() || await nameField.isVisible()) {
        console.log('Family form appears to be already visible');
        familyCreationTriggered = true;
      }
    }

    // Wait a moment for any modal or form to appear
    await page.waitForTimeout(2000);

    // Take screenshot after clicking
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/family-form-after-click.png',
      fullPage: true
    });

    // Now try to fill the family form
    console.log('Looking for family form fields...');

    // Look for various form field selectors
    const nameSelectors = [
      'input[name="nom"]',
      'input[placeholder*="nom"]',
      'input[placeholder*="Nom"]',
      'input[id*="nom"]',
      'input[id*="name"]'
    ];

    let nameField = null;
    for (const selector of nameSelectors) {
      const field = page.locator(selector);
      if (await field.isVisible()) {
        nameField = field;
        console.log(`Found name field with selector: ${selector}`);
        break;
      }
    }

    if (nameField) {
      console.log('Filling family name...');
      await nameField.fill('Test Famille E2E');

      // Look for description field
      const descriptionSelectors = [
        'textarea[name="description"]',
        'textarea[placeholder*="description"]',
        'input[name="description"]'
      ];

      for (const selector of descriptionSelectors) {
        const field = page.locator(selector);
        if (await field.isVisible()) {
          console.log(`Found description field with selector: ${selector}`);
          await field.fill('Description test pour famille E2E');
          break;
        }
      }

      // Look for submit button
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Créer")',
        'button:has-text("Ajouter")',
        'button:has-text("Enregistrer")',
        'button:has-text("Valider")'
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          submitButton = button;
          console.log(`Found submit button with selector: ${selector}`);
          break;
        }
      }

      if (submitButton) {
        console.log('Submitting family form...');

        // Listen for console errors and network responses
        page.on('console', msg => {
          if (msg.type() === 'error') {
            console.log('Console error:', msg.text());
          }
        });

        page.on('response', response => {
          if (!response.ok()) {
            console.log(`Failed request: ${response.url()} - ${response.status()}`);
          }
        });

        // Take screenshot before submit
        await page.screenshot({
          path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/family-form-before-submit.png',
          fullPage: true
        });

        // Submit the form
        await submitButton.click();

        // Wait for response or error
        await page.waitForTimeout(3000);

        // Take screenshot after submit
        await page.screenshot({
          path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/family-form-after-submit.png',
          fullPage: true
        });

        // Check for error messages
        const errorSelectors = [
          '.error',
          '[role="alert"]',
          '.text-red-500',
          '.text-destructive',
          '[data-testid="error"]'
        ];

        for (const selector of errorSelectors) {
          const errorElements = await page.locator(selector).all();
          for (const errorElement of errorElements) {
            if (await errorElement.isVisible()) {
              const errorText = await errorElement.textContent();
              console.log(`Error found: ${errorText}`);
            }
          }
        }

        // Check if form was successful (look for success indicators)
        const successSelectors = [
          '.success',
          '.text-green-500',
          '[data-testid="success"]'
        ];

        let successFound = false;
        for (const selector of successSelectors) {
          const successElements = await page.locator(selector).all();
          for (const successElement of successElements) {
            if (await successElement.isVisible()) {
              const successText = await successElement.textContent();
              console.log(`Success found: ${successText}`);
              successFound = true;
            }
          }
        }

        if (!successFound) {
          console.log('No success message found - form submission may have failed');
        }

      } else {
        console.log('No submit button found');
      }

    } else {
      console.log('No name field found - family form may not be accessible');
    }

    // Final screenshot
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/family-form-final-state.png',
      fullPage: true
    });
  });

  test('should test family form with image upload', async ({ page }) => {
    console.log('Testing family form with image upload...');

    await page.goto('http://localhost:3000/catalogue/categories');
    await page.waitForLoadState('networkidle');

    // Similar flow but include image upload testing
    // This test will help identify image-related RLS issues

    // Look for file input or image upload button
    const fileInputSelectors = [
      'input[type="file"]',
      'input[accept*="image"]',
      '[data-testid="image-upload"]'
    ];

    for (const selector of fileInputSelectors) {
      const fileInput = page.locator(selector);
      if (await fileInput.isVisible()) {
        console.log(`Found file input with selector: ${selector}`);

        // Try to upload a test image
        await fileInput.setInputFiles('/Users/romeodossantos/verone-back-office/public/next.svg');
        console.log('Test image uploaded');
        break;
      }
    }

    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/family-form-with-image.png',
      fullPage: true
    });
  });

  test('should capture network errors and RLS violations', async ({ page }) => {
    console.log('Testing for RLS and network errors...');

    // Capture all network requests and responses
    const networkLogs = [];

    page.on('request', request => {
      networkLogs.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });

    page.on('response', response => {
      networkLogs.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('JS Error:', msg.text());
      }
    });

    await page.goto('http://localhost:3000/catalogue/categories');
    await page.waitForLoadState('networkidle');

    // Try to interact with family form and capture all errors
    await page.waitForTimeout(5000);

    // Print all network activity
    console.log('\n=== NETWORK ACTIVITY ===');
    networkLogs.forEach(log => {
      if (log.type === 'response' && log.status >= 400) {
        console.log(`❌ ${log.method || 'RESPONSE'} ${log.url} - ${log.status} ${log.statusText}`);
      }
    });

    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/family-form-network-debug.png',
      fullPage: true
    });
  });
});