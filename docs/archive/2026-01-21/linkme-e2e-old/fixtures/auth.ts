import { Page } from '@playwright/test';

/**
 * Authentication fixtures for E2E tests
 * Provides helpers to login to LinkMe and Back-Office
 */

export const CREDENTIALS = {
  pokawa: {
    email: 'admin@pokawa-test.fr',
    password: 'TestLinkMe2025',
  },
  testOrg: {
    email: 'test-org@verone.fr',
    password: 'TestLinkMe2025',
  },
  backOffice: {
    email: 'veronebyromeo@gmail.com',
    password: 'Abc123456',
  },
};

/**
 * Login to LinkMe application
 * @param page - Playwright page instance
 * @param email - User email
 * @param password - User password
 */
export const loginLinkMe = async (
  page: Page,
  email: string,
  password: string
) => {
  await page.goto('http://localhost:3002/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check if test accounts button exists (development mode)
  const testAccountsButton = page.locator('button:has-text("Comptes de test")');
  const isTestAccountsVisible = await testAccountsButton.isVisible();

  if (isTestAccountsVisible) {
    // Use test accounts selector
    await testAccountsButton.click();

    // Select account based on email
    if (email === CREDENTIALS.pokawa.email) {
      await page.click('text=Pokawa');
    } else if (email === CREDENTIALS.testOrg.email) {
      await page.click('text=Organisation Test');
    }
  } else {
    // Manual login
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');
  }

  // Wait for successful login (redirect to dashboard)
  await page.waitForURL('**/dashboard', { timeout: 15000 });
};

/**
 * Login to Back-Office application
 * @param page - Playwright page instance
 */
export const loginBackOffice = async (page: Page) => {
  await page.goto('http://localhost:3000/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.fill('[data-testid="email"]', CREDENTIALS.backOffice.email);
  await page.fill('[data-testid="password"]', CREDENTIALS.backOffice.password);
  await page.click('button[type="submit"]');

  // Wait for successful login (redirect to dashboard)
  await page.waitForURL('**/dashboard', { timeout: 15000 });
};

/**
 * Logout from LinkMe application
 * @param page - Playwright page instance
 */
export const logoutLinkMe = async (page: Page) => {
  // Click user menu
  await page.click('[data-testid="user-menu"]');

  // Click logout button
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to login page
  await page.waitForURL('**/login', { timeout: 10000 });
};

/**
 * Logout from Back-Office application
 * @param page - Playwright page instance
 */
export const logoutBackOffice = async (page: Page) => {
  // Click user menu
  await page.click('[data-testid="user-menu"]');

  // Click logout button
  await page.click('text=Déconnexion');

  // Wait for redirect to login page
  await page.waitForURL('**/login', { timeout: 10000 });
};
