/**
 * Combined fixtures for E2E tests
 * Merges auth, database, and test data fixtures into a single test instance
 *
 * Usage:
 * ```typescript
 * import { test, expect } from '../fixtures';
 *
 * test('my test', async ({ loginLinkMe, db, page }) => {
 *   await loginLinkMe('email@example.com', 'password');
 *   const product = await db.getProductById('uuid');
 *   // Test code...
 * });
 * ```
 */

import { test as authTest } from './auth.fixture';
import { test as dbTest } from './database.fixture';

/**
 * Combined test fixture with all capabilities:
 * - Authentication (loginLinkMe, loginBackOffice, etc.)
 * - Database helpers (db.getProductById, etc.)
 * - Test data utilities (exported separately)
 */
export const test = authTest.extend(dbTest._extendTest);

export { expect } from '@playwright/test';

// Re-export fixtures for direct imports
export * from './auth.fixture';
export * from './database.fixture';
export * from './test-data.fixture';
