import { createClient } from '@supabase/supabase-js';

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 *
 * Purpose:
 * - Cleanup any existing test data from previous runs
 * - Verify database connection
 * - Setup test environment if needed
 */
export default async function globalSetup() {
  console.log('\n🧹 Cleaning up test data before running tests...\n');

  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Cleanup test data
    await supabase.from('products').delete().ilike('name', 'Test Produit%');
    await supabase
      .from('sales_orders')
      .delete()
      .ilike('customer_name', 'Test Customer%');

    console.log('✅ Test data cleanup completed\n');

    // Verify LinkMe and Back-Office are running
    console.log('🔍 Verifying applications are running...\n');

    try {
      const linkmeResponse = await fetch('http://localhost:3002', {
        method: 'HEAD',
      });
      console.log(`✅ LinkMe is running (status: ${linkmeResponse.status})`);
    } catch (error) {
      console.warn(
        '⚠️  LinkMe is not running at http://localhost:3002. Please start it with: npm run dev'
      );
    }

    try {
      const backOfficeResponse = await fetch('http://localhost:3000', {
        method: 'HEAD',
      });
      console.log(
        `✅ Back-Office is running (status: ${backOfficeResponse.status})\n`
      );
    } catch (error) {
      console.warn(
        '⚠️  Back-Office is not running at http://localhost:3000. Please start it with: npm run dev\n'
      );
    }
  } catch (error) {
    console.error('❌ Error during global setup:', error);
    // Don't fail the tests if cleanup fails
    // (test data might not exist yet)
  }
}
