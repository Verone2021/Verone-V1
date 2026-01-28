import { test as base, Page } from '@playwright/test';

/**
 * Authentication credentials for test accounts
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
 * Authentication fixture types
 */
type AuthFixtures = {
  loginLinkMe: (email: string, password: string) => Promise<void>;
  loginBackOffice: () => Promise<void>;
  logoutLinkMe: () => Promise<void>;
  logoutBackOffice: () => Promise<void>;
  authenticatedLinkMe: Page; // Auto-login to LinkMe as test org
  authenticatedBackOffice: Page; // Auto-login to Back-Office
};

/**
 * Extend Playwright test with authentication fixtures
 * Provides typed, reusable authentication helpers
 *
 * Usage:
 * ```typescript
 * import { test, expect } from './fixtures/auth.fixture';
 *
 * test('my test', async ({ loginLinkMe, page }) => {
 *   await loginLinkMe(CREDENTIALS.pokawa.email, CREDENTIALS.pokawa.password);
 *   // Test code...
 * });
 * ```
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Login to LinkMe application
   */
  loginLinkMe: async ({ page }, use) => {
    const login = async (email: string, password: string) => {
      await page.goto('http://localhost:3002/login');
      await page.waitForLoadState('networkidle');

      // Check if test accounts button exists (development mode)
      const testAccountsButton = page.locator(
        'button:has-text("Comptes de test")'
      );
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

    await use(login);
  },

  /**
   * Login to Back-Office application
   */
  loginBackOffice: async ({ page }, use) => {
    const login = async () => {
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');

      // Fill login form
      await page.fill('[data-testid="email"]', CREDENTIALS.backOffice.email);
      await page.fill(
        '[data-testid="password"]',
        CREDENTIALS.backOffice.password
      );
      await page.click('button[type="submit"]');

      // Wait for successful login (redirect to dashboard)
      await page.waitForURL('**/dashboard', { timeout: 15000 });
    };

    await use(login);
  },

  /**
   * Logout from LinkMe application
   */
  logoutLinkMe: async ({ page }, use) => {
    const logout = async () => {
      // Click user menu
      await page.click('[data-testid="user-menu"]');

      // Click logout button
      await page.click('[data-testid="logout-button"]');

      // Wait for redirect to login page
      await page.waitForURL('**/login', { timeout: 10000 });
    };

    await use(logout);
  },

  /**
   * Logout from Back-Office application
   */
  logoutBackOffice: async ({ page }, use) => {
    const logout = async () => {
      // Click user menu
      await page.click('[data-testid="user-menu"]');

      // Click logout button
      await page.click('text=Déconnexion');

      // Wait for redirect to login page
      await page.waitForURL('**/login', { timeout: 10000 });
    };

    await use(logout);
  },

  /**
   * Auto-authenticated page for LinkMe (test organization)
   * Use this fixture when you need a pre-authenticated session
   */
  authenticatedLinkMe: async ({ page }, use) => {
    // Perform login
    await page.goto('http://localhost:3002/login');
    await page.waitForLoadState('networkidle');

    const testAccountsButton = page.locator(
      'button:has-text("Comptes de test")'
    );
    const isTestAccountsVisible = await testAccountsButton.isVisible();

    if (isTestAccountsVisible) {
      await testAccountsButton.click();
      await page.click('text=Organisation Test');
    } else {
      await page.fill('[data-testid="email-input"]', CREDENTIALS.testOrg.email);
      await page.fill(
        '[data-testid="password-input"]',
        CREDENTIALS.testOrg.password
      );
      await page.click('[data-testid="login-button"]');
    }

    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Provide authenticated page to test
    await use(page);

    // Cleanup: logout after test
    try {
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
    } catch {
      // Ignore logout errors
    }
  },

  /**
   * Auto-authenticated page for Back-Office
   * Use this fixture when you need a pre-authenticated session
   */
  authenticatedBackOffice: async ({ page }, use) => {
    // Perform login
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    await page.fill('[data-testid="email"]', CREDENTIALS.backOffice.email);
    await page.fill(
      '[data-testid="password"]',
      CREDENTIALS.backOffice.password
    );
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Provide authenticated page to test
    await use(page);

    // Cleanup: logout after test
    try {
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Déconnexion');
    } catch {
      // Ignore logout errors
    }
  },
});

export { expect } from '@playwright/test';
