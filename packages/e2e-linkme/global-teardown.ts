import { createClient } from '@supabase/supabase-js';

/**
 * Global teardown for Playwright tests
 * Runs once after all tests
 *
 * Purpose:
 * - Cleanup all test data created during test execution
 * - Final verification of cleanup
 */
export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up test data after running tests...\n');

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
    const { data: products, error: productsError } = await supabase
      .from('products')
      .delete()
      .ilike('name', 'Test Produit%')
      .select('id');

    const { data: orders, error: ordersError } = await supabase
      .from('sales_orders')
      .delete()
      .ilike('customer_name', 'Test Customer%')
      .select('id');

    if (productsError) {
      console.warn('⚠️  Error cleaning up test products:', productsError);
    } else {
      console.log(
        `✅ Cleaned up ${products?.length || 0} test product(s)`
      );
    }

    if (ordersError) {
      console.warn('⚠️  Error cleaning up test orders:', ordersError);
    } else {
      console.log(`✅ Cleaned up ${orders?.length || 0} test order(s)`);
    }

    console.log('\n✅ Test data cleanup completed\n');
  } catch (error) {
    console.error('❌ Error during global teardown:', error);
    // Don't fail if cleanup fails
  }
}
