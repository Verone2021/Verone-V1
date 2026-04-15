import { test as base, expect, type Page } from '@playwright/test';

/**
 * Shared test fixtures and helpers for Verone Back Office E2E tests
 */

// Console error collector
export class ConsoleErrorCollector {
  private errors: string[] = [];

  attach(page: Page) {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known non-critical errors
        if (this.isIgnorable(text)) return;
        this.errors.push(text);
      }
    });
  }

  private isIgnorable(text: string): boolean {
    const ignoredPatterns = [
      'Download the React DevTools',
      'A cookie associated with a resource',
      'Third-party cookie',
      'net::ERR_BLOCKED_BY_CLIENT', // Ad blockers
      'ResizeObserver loop', // Benign browser warning
    ];
    return ignoredPatterns.some(p => text.includes(p));
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  clear() {
    this.errors = [];
  }

  expectNoErrors() {
    const filtered = this.errors;
    if (filtered.length > 0) {
      throw new Error(
        `Found ${filtered.length} console error(s):\n${filtered.join('\n')}`
      );
    }
  }
}

// Extended test with fixtures
export const test = base.extend<{
  consoleErrors: ConsoleErrorCollector;
}>({
  consoleErrors: async ({ page }, use) => {
    const collector = new ConsoleErrorCollector();
    collector.attach(page);
    await use(collector);
  },
});

// Re-export expect
export { expect };

/**
 * Navigate to a page and wait for it to be stable
 */
export async function navigateAndWait(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Check that a page loads without console errors
 */
export async function assertPageLoads(
  page: Page,
  path: string,
  options?: { titlePattern?: RegExp; timeout?: number }
) {
  const collector = new ConsoleErrorCollector();
  collector.attach(page);

  await page.goto(path, {
    timeout: options?.timeout ?? 15000,
  });
  await page.waitForLoadState('networkidle');

  if (options?.titlePattern) {
    const heading = page.getByRole('heading', { name: options.titlePattern });
    await expect(heading).toBeVisible({ timeout: 10000 });
  }

  collector.expectNoErrors();
}

/**
 * Performance: measure page load time
 */
export async function measurePageLoad(
  page: Page,
  path: string
): Promise<number> {
  const start = Date.now();
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  return Date.now() - start;
}
