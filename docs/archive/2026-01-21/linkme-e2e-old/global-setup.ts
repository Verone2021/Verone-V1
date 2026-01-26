import { cleanupTestData } from './fixtures/database';

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
export default async function globalSetup() {
  console.log('\n🧹 Cleaning up test data before running tests...\n');

  try {
    await cleanupTestData();
    console.log('✅ Test data cleanup completed\n');
  } catch (error) {
    console.error('❌ Error during test data cleanup:', error);
    // Don't fail the tests if cleanup fails
    // (test data might not exist yet)
  }
}
