import { cleanupTestData } from './fixtures/database';

/**
 * Global teardown for Playwright tests
 * Runs once after all tests
 */
export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up test data after running tests...\n');

  try {
    await cleanupTestData();
    console.log('✅ Test data cleanup completed\n');
  } catch (error) {
    console.error('❌ Error during test data cleanup:', error);
    // Don't fail if cleanup fails
  }
}
