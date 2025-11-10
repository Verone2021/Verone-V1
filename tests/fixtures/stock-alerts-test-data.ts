/**
 * Fixtures de données de test pour système alertes stock
 * Phase 3 : Tests validation
 * Date : 2025-11-10
 */

import { createClient } from '@supabase/supabase-js';

// IDs stables pour tests reproductibles
export const TEST_IDS = {
  // Produits
  product_low_stock: 'test-low-stock-001-uuid',
  product_out_stock: 'test-out-stock-001-uuid',
  product_ordered: 'test-ordered-001-uuid',
  product_moq_high: 'test-moq-high-001-uuid',

  // Catégories
  category_test: 'test-category-001-uuid',

  // Fournisseurs
  supplier_standard: 'test-supplier-standard-uuid',
  supplier_high_moq: 'test-supplier-moq-uuid',

  // Commandes
  draft_order: 'test-draft-order-001-uuid',
  validated_order: 'test-validated-order-001-uuid',

  // Alertes
  alert_low_stock: 'test-alert-low-stock-uuid',
  alert_out_stock: 'test-alert-out-stock-uuid',
  alert_ordered: 'test-alert-ordered-uuid',
};

export const testProducts = {
  lowStock: {
    id: TEST_IDS.product_low_stock,
    name: 'Canapé Test Low Stock',
    sku: 'TEST-LOW-001',
    stock_real: 5,
    stock_forecasted_out: 0,
    stock_forecasted_in: 0,
    min_stock: 10,
    supplier_moq: 1,
    cost_price: 500,
    category_id: TEST_IDS.category_test,
    supplier_id: TEST_IDS.supplier_standard,
  },
  outOfStock: {
    id: TEST_IDS.product_out_stock,
    name: 'Canapé Test Out Stock',
    sku: 'TEST-OUT-001',
    stock_real: 0,
    stock_forecasted_out: 0,
    stock_forecasted_in: 0,
    min_stock: 10,
    supplier_moq: 1,
    cost_price: 600,
    category_id: TEST_IDS.category_test,
    supplier_id: TEST_IDS.supplier_standard,
  },
  noStockButOrdered: {
    id: TEST_IDS.product_ordered,
    name: 'Canapé Test Ordered',
    sku: 'TEST-ORDERED-001',
    stock_real: 0,
    stock_forecasted_out: 5,
    stock_forecasted_in: 0,
    min_stock: 10,
    supplier_moq: 1,
    cost_price: 700,
    category_id: TEST_IDS.category_test,
    supplier_id: TEST_IDS.supplier_standard,
  },
  highMoq: {
    id: TEST_IDS.product_moq_high,
    name: 'Canapé Test MOQ High',
    sku: 'TEST-MOQ-001',
    stock_real: 5,
    stock_forecasted_out: 0,
    stock_forecasted_in: 0,
    min_stock: 10,
    supplier_moq: 20,
    cost_price: 800,
    category_id: TEST_IDS.category_test,
    supplier_id: TEST_IDS.supplier_high_moq,
  },
};

export const testSuppliers = {
  standard: {
    id: TEST_IDS.supplier_standard,
    legal_name: 'Fournisseur Test Standard',
    type: 'supplier',
    minimum_order_amount: 0,
  },
  highMoq: {
    id: TEST_IDS.supplier_high_moq,
    legal_name: 'Fournisseur Test High MOQ',
    type: 'supplier',
    minimum_order_amount: 1000,
  },
};

export const testCategory = {
  id: TEST_IDS.category_test,
  name: 'Catégorie Test Alertes',
  description: 'Catégorie pour tests système alertes stock',
};

/**
 * Seed des données de test dans la base
 */
export async function seedStockAlertsTestData(
  supabaseUrl: string,
  supabaseKey: string
) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🌱 Seeding stock alerts test data...');

  // 1. Créer catégorie test
  const { error: categoryError } = await supabase
    .from('categories')
    .upsert([testCategory], { onConflict: 'id' });

  if (categoryError) {
    console.error('❌ Error seeding category:', categoryError);
    throw categoryError;
  }

  // 2. Créer fournisseurs test
  const { error: suppliersError } = await supabase
    .from('organisations')
    .upsert([testSuppliers.standard, testSuppliers.highMoq], {
      onConflict: 'id',
    });

  if (suppliersError) {
    console.error('❌ Error seeding suppliers:', suppliersError);
    throw suppliersError;
  }

  // 3. Créer produits test
  const products = Object.values(testProducts);
  const { error: productsError } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'id' });

  if (productsError) {
    console.error('❌ Error seeding products:', productsError);
    throw productsError;
  }

  // Les alertes seront créées automatiquement par le trigger sync_stock_alert_tracking()

  console.log('✅ Stock alerts test data seeded successfully');
  console.log(`   - ${products.length} products`);
  console.log(`   - ${Object.keys(testSuppliers).length} suppliers`);
  console.log(`   - 1 category`);

  return { success: true };
}

/**
 * Cleanup des données de test
 */
export async function cleanupStockAlertsTestData(
  supabaseUrl: string,
  supabaseKey: string
) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🧹 Cleaning up stock alerts test data...');

  // Supprimer dans l'ordre inverse pour respecter contraintes FK

  // 1. Supprimer alertes liées aux produits test
  const { error: alertsError } = await supabase
    .from('stock_alert_tracking')
    .delete()
    .in(
      'product_id',
      Object.values(TEST_IDS).filter(id => id.startsWith('test-'))
    );

  if (alertsError && alertsError.code !== 'PGRST116') {
    // PGRST116 = no rows found (OK)
    console.error('❌ Error cleaning alerts:', alertsError);
  }

  // 2. Supprimer items commandes test
  const { error: orderItemsError } = await supabase
    .from('purchase_order_items')
    .delete()
    .in(
      'product_id',
      Object.keys(testProducts).map(
        k => testProducts[k as keyof typeof testProducts].id
      )
    );

  if (orderItemsError && orderItemsError.code !== 'PGRST116') {
    console.error('❌ Error cleaning order items:', orderItemsError);
  }

  // 3. Supprimer commandes test
  const { error: ordersError } = await supabase
    .from('purchase_orders')
    .delete()
    .in('id', [TEST_IDS.draft_order, TEST_IDS.validated_order]);

  if (ordersError && ordersError.code !== 'PGRST116') {
    console.error('❌ Error cleaning orders:', ordersError);
  }

  // 4. Supprimer produits test
  const { error: productsError } = await supabase
    .from('products')
    .delete()
    .in(
      'id',
      Object.keys(testProducts).map(
        k => testProducts[k as keyof typeof testProducts].id
      )
    );

  if (productsError && productsError.code !== 'PGRST116') {
    console.error('❌ Error cleaning products:', productsError);
  }

  // 5. Supprimer fournisseurs test
  const { error: suppliersError } = await supabase
    .from('organisations')
    .delete()
    .in(
      'id',
      Object.keys(testSuppliers).map(
        k => testSuppliers[k as keyof typeof testSuppliers].id
      )
    );

  if (suppliersError && suppliersError.code !== 'PGRST116') {
    console.error('❌ Error cleaning suppliers:', suppliersError);
  }

  // 6. Supprimer catégorie test
  const { error: categoryError } = await supabase
    .from('categories')
    .delete()
    .eq('id', TEST_IDS.category_test);

  if (categoryError && categoryError.code !== 'PGRST116') {
    console.error('❌ Error cleaning category:', categoryError);
  }

  console.log('✅ Stock alerts test data cleaned successfully');

  return { success: true };
}

/**
 * Helper: Créer une commande draft pour tests
 */
export async function createTestDraftOrder(
  supabaseUrl: string,
  supabaseKey: string,
  productId: string,
  quantity: number = 10
) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Récupérer infos produit
  const { data: product } = await supabase
    .from('products')
    .select('supplier_id, cost_price')
    .eq('id', productId)
    .single();

  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  // Créer commande draft
  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert({
      id: TEST_IDS.draft_order,
      supplier_id: product.supplier_id,
      status: 'draft',
      po_number: 'PO-TEST-DRAFT-001',
    })
    .select()
    .single();

  if (orderError) {
    throw orderError;
  }

  // Ajouter item
  const { error: itemError } = await supabase
    .from('purchase_order_items')
    .insert({
      purchase_order_id: order.id,
      product_id: productId,
      quantity,
      unit_price: product.cost_price,
    });

  if (itemError) {
    throw itemError;
  }

  return order;
}
