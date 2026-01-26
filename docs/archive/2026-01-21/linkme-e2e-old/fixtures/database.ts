import { createClient } from '@supabase/supabase-js';

/**
 * Database fixtures for E2E tests
 * Provides helpers to query and cleanup test data
 */

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get product by ID
 * @param productId - Product UUID
 * @returns Product data
 */
export const getProductById = async (productId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get order by ID with items
 * @param orderId - Order UUID
 * @returns Order data with items
 */
export const getOrderById = async (orderId: string) => {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(
      `
      *,
      items:sales_order_items(*)
    `
    )
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get commission by order ID
 * @param orderId - Order UUID
 * @returns Commission data
 */
export const getCommissionByOrderId = async (orderId: string) => {
  const { data, error } = await supabase
    .from('linkme_commissions')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get affiliate by organization ID
 * @param organizationId - Organization UUID
 * @returns Affiliate data
 */
export const getAffiliateByOrganizationId = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('linkme_affiliates')
    .select('*')
    .eq('organisation_id', organizationId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get affiliate by enseigne ID
 * @param enseigneId - Enseigne UUID
 * @returns Affiliate data
 */
export const getAffiliateByEnseigneId = async (enseigneId: string) => {
  const { data, error } = await supabase
    .from('linkme_affiliates')
    .select('*')
    .eq('enseigne_id', enseigneId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get LinkMe channel UUID
 * @returns LinkMe channel UUID
 */
export const getLinkmeeChannelId = async () => {
  const { data, error } = await supabase
    .from('sales_channels')
    .select('id')
    .eq('name', 'LinkMe')
    .single();

  if (error) throw error;
  return data.id;
};

/**
 * Cleanup test data
 * Deletes all test products and orders created during tests
 */
export const cleanupTestData = async () => {
  try {
    // Delete test products (starts with "Test Produit")
    await supabase.from('products').delete().ilike('name', 'Test Produit%');

    // Delete test orders (customer name starts with "Test Customer")
    await supabase
      .from('sales_orders')
      .delete()
      .ilike('customer_name', 'Test Customer%');

    // Delete test commissions related to deleted orders
    // (should cascade delete automatically if FK constraints are set)

    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    throw error;
  }
};

/**
 * Create test product
 * @param productData - Product data to insert
 * @returns Created product ID
 */
export const createTestProduct = async (productData: {
  name: string;
  description?: string;
  affiliate_payout_ht: number;
  store_at_verone: boolean;
  created_by_affiliate?: string;
  organisation_id?: string;
  enseigne_id?: string;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  stock_units?: number;
}) => {
  const { data, error } = await supabase
    .from('products')
    .insert({
      type: 'affiliate', // LinkMe products are always 'affiliate' type
      affiliate_approval_status: 'draft',
      ...productData,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
};

/**
 * Update product approval status
 * @param productId - Product UUID
 * @param status - New approval status
 * @param commissionRate - Optional commission rate (for approved status)
 * @param rejectionReason - Optional rejection reason (for rejected status)
 */
export const updateProductApprovalStatus = async (
  productId: string,
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected',
  options?: {
    commissionRate?: number;
    rejectionReason?: string;
  }
) => {
  const updateData: any = {
    affiliate_approval_status: status,
  };

  if (status === 'approved' && options?.commissionRate) {
    updateData.affiliate_commission_rate = options.commissionRate;
  }

  if (status === 'rejected' && options?.rejectionReason) {
    updateData.affiliate_rejection_reason = options.rejectionReason;
  }

  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId);

  if (error) throw error;
};

/**
 * Create test order
 * @param orderData - Order data to insert
 * @returns Created order ID
 */
export const createTestOrder = async (orderData: {
  customer_name: string;
  customer_email: string;
  channel_id: string;
  affiliate_id?: string;
  montant_ht: number;
  montant_ttc: number;
  status: string;
}) => {
  const { data, error } = await supabase
    .from('sales_orders')
    .insert(orderData)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
};

/**
 * Wait for condition with timeout
 * Useful for waiting for async operations (e.g., trigger execution)
 * @param condition - Async function that returns true when condition is met
 * @param timeout - Timeout in milliseconds (default: 10000)
 * @param interval - Check interval in milliseconds (default: 500)
 */
export const waitForCondition = async (
  condition: () => Promise<boolean>,
  timeout = 10000,
  interval = 500
) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
};
