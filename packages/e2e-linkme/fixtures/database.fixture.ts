import { test as base } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Database fixture types
 */
type DatabaseWorkerFixtures = {
  supabaseWorker: SupabaseClient;
};

type DatabaseTestFixtures = {
  supabase: SupabaseClient;
  db: {
    getProductById: (productId: string) => Promise<any>;
    getOrderById: (orderId: string) => Promise<any>;
    getCommissionByOrderId: (orderId: string) => Promise<any>;
    getAffiliateByOrganizationId: (organizationId: string) => Promise<any>;
    getAffiliateByEnseigneId: (enseigneId: string) => Promise<any>;
    getLinkmeeChannelId: () => Promise<string>;
    createTestProduct: (productData: any) => Promise<string>;
    updateProductApprovalStatus: (
      productId: string,
      status: string,
      options?: any
    ) => Promise<void>;
    createTestOrder: (orderData: any) => Promise<string>;
    waitForCondition: (
      condition: () => Promise<boolean>,
      timeout?: number,
      interval?: number
    ) => Promise<boolean>;
    cleanupTestData: () => Promise<void>;
  };
};

/**
 * Extend Playwright test with database fixtures
 * Uses worker-scoped Supabase client for better performance
 *
 * Usage:
 * ```typescript
 * import { test, expect } from './fixtures/database.fixture';
 *
 * test('my test', async ({ db }) => {
 *   const product = await db.getProductById('uuid');
 *   expect(product.name).toBe('Test Product');
 * });
 * ```
 */
export const test = base.extend<DatabaseTestFixtures, DatabaseWorkerFixtures>({
  /**
   * Worker-scoped Supabase client
   * Shared across all tests in the same worker process
   */
  supabaseWorker: [
    async ({}, use) => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
        );
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      await use(supabase);

      // No cleanup needed for worker-scoped fixtures
    },
    { scope: 'worker' },
  ],

  /**
   * Test-scoped Supabase client
   * For tests that need direct access to Supabase
   */
  supabase: async ({ supabaseWorker }, use) => {
    await use(supabaseWorker);
  },

  /**
   * Database helper functions
   * Provides convenient methods for common database operations
   */
  db: async ({ supabaseWorker }, use) => {
    const helpers = {
      /**
       * Get product by ID
       */
      getProductById: async (productId: string) => {
        const { data, error } = await supabaseWorker
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (error) throw error;
        return data;
      },

      /**
       * Get order by ID with items
       */
      getOrderById: async (orderId: string) => {
        const { data, error } = await supabaseWorker
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
      },

      /**
       * Get commission by order ID
       */
      getCommissionByOrderId: async (orderId: string) => {
        const { data, error } = await supabaseWorker
          .from('linkme_commissions')
          .select('*')
          .eq('order_id', orderId)
          .single();

        if (error) throw error;
        return data;
      },

      /**
       * Get affiliate by organization ID
       */
      getAffiliateByOrganizationId: async (organizationId: string) => {
        const { data, error } = await supabaseWorker
          .from('linkme_affiliates')
          .select('*')
          .eq('organisation_id', organizationId)
          .single();

        if (error) throw error;
        return data;
      },

      /**
       * Get affiliate by enseigne ID
       */
      getAffiliateByEnseigneId: async (enseigneId: string) => {
        const { data, error } = await supabaseWorker
          .from('linkme_affiliates')
          .select('*')
          .eq('enseigne_id', enseigneId)
          .single();

        if (error) throw error;
        return data;
      },

      /**
       * Get LinkMe channel UUID
       */
      getLinkmeeChannelId: async () => {
        const { data, error } = await supabaseWorker
          .from('sales_channels')
          .select('id')
          .eq('name', 'LinkMe')
          .single();

        if (error) throw error;
        return data.id;
      },

      /**
       * Create test product
       */
      createTestProduct: async (productData: {
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
        affiliate_commission_rate?: number;
      }) => {
        const { data, error } = await supabaseWorker
          .from('products')
          .insert({
            type: 'affiliate',
            affiliate_approval_status: 'draft',
            ...productData,
          })
          .select('id')
          .single();

        if (error) throw error;
        return data.id;
      },

      /**
       * Update product approval status
       */
      updateProductApprovalStatus: async (
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

        const { error } = await supabaseWorker
          .from('products')
          .update(updateData)
          .eq('id', productId);

        if (error) throw error;
      },

      /**
       * Create test order
       */
      createTestOrder: async (orderData: {
        customer_name: string;
        customer_email: string;
        channel_id: string;
        affiliate_id?: string;
        montant_ht: number;
        montant_ttc: number;
        status: string;
      }) => {
        const { data, error } = await supabaseWorker
          .from('sales_orders')
          .insert(orderData)
          .select('id')
          .single();

        if (error) throw error;
        return data.id;
      },

      /**
       * Wait for condition with timeout
       * Useful for waiting for async operations (e.g., trigger execution)
       */
      waitForCondition: async (
        condition: () => Promise<boolean>,
        timeout = 10000,
        interval = 500
      ) => {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
          if (await condition()) {
            return true;
          }
          await new Promise(resolve => setTimeout(resolve, interval));
        }

        throw new Error(`Condition not met within ${timeout}ms`);
      },

      /**
       * Cleanup test data
       * Deletes all test products and orders created during tests
       */
      cleanupTestData: async () => {
        try {
          // Delete test products (starts with "Test Produit")
          await supabaseWorker
            .from('products')
            .delete()
            .ilike('name', 'Test Produit%');

          // Delete test orders (customer name starts with "Test Customer")
          await supabaseWorker
            .from('sales_orders')
            .delete()
            .ilike('customer_name', 'Test Customer%');

          console.log('✅ Test data cleaned up successfully');
        } catch (error) {
          console.error('❌ Error cleaning up test data:', error);
          throw error;
        }
      },
    };

    await use(helpers);
  },
});

export { expect } from '@playwright/test';
