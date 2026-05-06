// auth-flow uses its own credentials (testing the login flow itself); other specs use storageState.
import { test, expect } from '@playwright/test';

/**
 * P0 WORKFLOW: Authentication Flow
 *
 * Tests the complete login/logout journey:
 * 1. Login page renders correctly
 * 2. Invalid credentials show error
 * 3. Valid credentials redirect to dashboard
 * 4. Protected routes redirect unauthenticated users
 * 5. Session persists across navigation
 */

const EMAIL = process.env.E2E_USER_EMAIL ?? 'veronebyromeo@gmail.com';
const PASSWORD = process.env.E2E_USER_PASSWORD ?? 'Abc123456';

test.describe('Authentication Flow', () => {
  // This test does NOT use the shared auth state
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login page renders with form elements', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Email and password fields visible
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /mot de passe/i })
    ).toBeVisible();

    // Submit button visible
    await expect(
      page.getByRole('button', { name: /se connecter/i })
    ).toBeVisible();
  });

  test('invalid credentials show error message', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('textbox', { name: /email/i }).fill('wrong@email.com');
    await page.getByRole('textbox', { name: /mot de passe/i }).fill('wrongpwd');
    await page.getByRole('button', { name: /se connecter/i }).click();

    // Error message should appear
    await expect(
      page.getByText(/email ou mot de passe incorrect|erreur/i)
    ).toBeVisible({ timeout: 10000 });

    // Should stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('valid credentials redirect to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('textbox', { name: /email/i }).fill(EMAIL);
    await page.getByRole('textbox', { name: /mot de passe/i }).fill(PASSWORD);
    await page.getByRole('button', { name: /se connecter/i }).click();

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('protected route redirects to login when unauthenticated', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL(/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Authenticated Session', () => {
  // Uses shared auth state from setup
  test('session persists across navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/dashboard/);

    // Navigate to another protected page
    await page.goto('/produits');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/produits/);

    // Should not be redirected to login
    await expect(page).not.toHaveURL(/login/);
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click on Produits in sidebar
    const produitsLink = page.getByRole('link', { name: /produits/i }).first();
    if (await produitsLink.isVisible()) {
      await produitsLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/produits/);
    }
  });
});
