/**
 * Fixtures : Données de test Multi-Shipments
 * Date : 2025-11-12
 *
 * Setup données de test pour scénarios :
 * - Commande client avec 100 unités
 * - Expédition partielle 30 unités
 * - Expédition partielle 40 unités (total 70/100)
 * - Clôture partielle (30 unités restantes)
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export const TEST_IDS = {
  // Organisations
  customer: 'test-multi-ship-customer-uuid',
  supplier: 'test-multi-ship-supplier-uuid',

  // Product
  product: 'test-multi-ship-product-uuid',

  // Sales Order
  salesOrder: 'test-multi-ship-order-uuid',
  salesOrderItem: 'test-multi-ship-order-item-uuid',

  // Shipments
  shipment1: 'test-multi-ship-1-uuid',
  shipment2: 'test-multi-ship-2-uuid',

  // Tracking Events
  trackingEvent1: 'test-multi-ship-tracking-1-uuid',
  trackingEvent2: 'test-multi-ship-tracking-2-uuid',
} as const;

/**
 * Seed test data pour multi-shipments
 */
export async function seedMultiShipmentsTestData(
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('[Multi-Shipments Test] 🌱 Seeding test data...');

  // 1. Créer organisation client
  await supabase.from('organisations').insert({
    id: TEST_IDS.customer,
    name: 'Test Customer Multi-Ship',
    organisation_type: 'customer',
    email: 'customer-multiship@test.com',
    phone: '+33600000001',
    created_at: new Date().toISOString(),
  });

  // 2. Créer organisation supplier
  await supabase.from('organisations').insert({
    id: TEST_IDS.supplier,
    name: 'Test Supplier Multi-Ship',
    organisation_type: 'supplier',
    email: 'supplier-multiship@test.com',
    phone: '+33600000002',
    created_at: new Date().toISOString(),
  });

  // 3. Créer produit avec stock
  await supabase.from('products').insert({
    id: TEST_IDS.product,
    name: 'Canapé Test Multi-Ship',
    sku: 'TEST-MULTI-SHIP-001',
    supplier_id: TEST_IDS.supplier,
    condition: 'new',
    status: 'active',
    stock_quantity: 100, // Stock initial
    stock_forecasted_out: 0, // Sera mis à jour par trigger
    min_stock: 10,
    purchase_price: 500,
    selling_price: 1000,
    created_at: new Date().toISOString(),
  });

  // 4. Créer commande client (status=confirmed, 100 unités)
  await supabase.from('sales_orders').insert({
    id: TEST_IDS.salesOrder,
    order_number: 'SO-TEST-MULTI-001',
    customer_id: TEST_IDS.customer,
    status: 'confirmed',
    total_amount: 100000, // 100 unités * 1000€
    payment_status: 'paid',
    order_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  // 5. Créer ligne commande (100 unités)
  await supabase.from('sales_order_items').insert({
    id: TEST_IDS.salesOrderItem,
    sales_order_id: TEST_IDS.salesOrder,
    product_id: TEST_IDS.product,
    quantity: 100,
    unit_price: 1000,
    total_price: 100000,
    quantity_shipped: 0, // Sera mis à jour par trigger
    created_at: new Date().toISOString(),
  });

  // Attendre triggers (stock_forecasted_out devrait être 100)
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('[Multi-Shipments Test] ✅ Test data seeded successfully');
  console.log('   Customer:', TEST_IDS.customer);
  console.log('   Product:', TEST_IDS.product);
  console.log('   Sales Order:', TEST_IDS.salesOrder);
  console.log('   Initial stock_forecasted_out: 100');
}

/**
 * Cleanup test data après tests
 */
export async function cleanupMultiShipmentsTestData(
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('[Multi-Shipments Test] 🧹 Cleaning up test data...');

  // Ordre de suppression important (foreign keys)

  // 1. Tracking events
  await supabase
    .from('shipment_tracking_events')
    .delete()
    .in('id', [TEST_IDS.trackingEvent1, TEST_IDS.trackingEvent2]);

  // 2. Shipments
  await supabase
    .from('shipments')
    .delete()
    .in('id', [TEST_IDS.shipment1, TEST_IDS.shipment2]);

  // 3. Sales order items
  await supabase
    .from('sales_order_items')
    .delete()
    .eq('id', TEST_IDS.salesOrderItem);

  // 4. Sales orders
  await supabase.from('sales_orders').delete().eq('id', TEST_IDS.salesOrder);

  // 5. Products
  await supabase.from('products').delete().eq('id', TEST_IDS.product);

  // 6. Organisations
  await supabase
    .from('organisations')
    .delete()
    .in('id', [TEST_IDS.customer, TEST_IDS.supplier]);

  console.log('[Multi-Shipments Test] ✅ Cleanup completed');
}

/**
 * Helpers pour vérifier état database
 */
export async function getProductStock(
  supabase: SupabaseClient,
  productId: string
): Promise<{ stock_quantity: number; stock_forecasted_out: number }> {
  const { data, error } = await supabase
    .from('products')
    .select('stock_quantity, stock_forecasted_out')
    .eq('id', productId)
    .single();

  if (error) throw error;
  return data as { stock_quantity: number; stock_forecasted_out: number };
}

export async function getSalesOrderStatus(
  supabase: SupabaseClient,
  orderId: string
): Promise<{
  status: string;
  total_units: number;
  total_shipped: number;
}> {
  // Query order avec agrégation items
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select(
      `
      status,
      sales_order_items (
        quantity,
        quantity_shipped
      )
    `
    )
    .eq('id', orderId)
    .single();

  if (orderError) throw orderError;

  const items = (order as any).sales_order_items;
  const total_units = items.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0
  );
  const total_shipped = items.reduce(
    (sum: number, item: any) => sum + (item.quantity_shipped || 0),
    0
  );

  return {
    status: (order as any).status,
    total_units,
    total_shipped,
  };
}

export async function getShipmentsCount(
  supabase: SupabaseClient,
  orderId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true })
    .eq('sales_order_id', orderId);

  if (error) throw error;
  return count || 0;
}

export async function getTrackingEventsCount(
  supabase: SupabaseClient,
  shipmentId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('shipment_tracking_events')
    .select('*', { count: 'exact', head: true })
    .eq('shipment_id', shipmentId);

  if (error) throw error;
  return count || 0;
}
