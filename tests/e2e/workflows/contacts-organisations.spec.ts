import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * P2 WORKFLOW: Contacts & Organisations
 *
 * Tests the CRM flow:
 * 1. Hub page
 * 2. Customers list
 * 3. Suppliers list
 * 4. Enseignes list
 * 5. Partners list
 * 6. Contacts list
 * 7. Clients particuliers
 */

test.describe('Contacts & Organisations', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('hub page loads', async ({ page }) => {
    await page.goto('/contacts-organisations');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('customers page loads', async ({ page }) => {
    await page.goto('/contacts-organisations/customers');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('suppliers page loads', async ({ page }) => {
    await page.goto('/contacts-organisations/suppliers');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('enseignes page loads', async ({ page }) => {
    await page.goto('/contacts-organisations/enseignes');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('partners page loads', async ({ page }) => {
    await page.goto('/contacts-organisations/partners');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('contacts page loads', async ({ page }) => {
    await page.goto('/contacts-organisations/contacts');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('clients particuliers page loads', async ({ page }) => {
    await page.goto('/contacts-organisations/clients-particuliers');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('full CRM navigation cycle', async ({ page }) => {
    const crmPages = [
      '/contacts-organisations',
      '/contacts-organisations/customers',
      '/contacts-organisations/suppliers',
      '/contacts-organisations/enseignes',
      '/contacts-organisations/partners',
      '/contacts-organisations/contacts',
      '/contacts-organisations/clients-particuliers',
    ];

    for (const route of crmPages) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/login/);
    }

    consoleErrors.expectNoErrors();
  });
});
