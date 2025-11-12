/**
 * Script test API shipments
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aorroydfjsrygmosnzrl.supabase.co';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcyNzQ3MCwiZXhwIjoyMDczMzAzNDcwfQ.q99nRT2xxk8QLbjX10UfnqCsW95wV4h45AYqYxbjRjY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('📋 Récupération commande SO-2025-00026...\n');

  // 1. Get order ID
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select(
      `
      id,
      order_number,
      customer_id,
      status,
      shipping_address
    `
    )
    .eq('order_number', 'SO-2025-00026')
    .single();

  if (orderError) {
    console.error('❌ Erreur:', orderError);
    return;
  }

  console.log('✅ Commande trouvée:');
  console.log(`   ID: ${order.id}`);
  console.log(`   Numéro: ${order.order_number}`);
  console.log(`   Status: ${order.status}`);
  console.log(
    `   Adresse livraison: ${order.shipping_address ? JSON.stringify(order.shipping_address, null, 2) : 'N/A'}\n`
  );

  // 2. Get items separately
  const { data: items } = await supabase
    .from('sales_order_items')
    .select('id, product_id, quantity')
    .eq('sales_order_id', order.id);

  console.log(`📦 Items trouvés: ${items?.length || 0}`);
  if (items && items.length > 0) {
    items.forEach((item: any, index: number) => {
      console.log(
        `   ${index + 1}. Item ID: ${item.id}, Product ID: ${item.product_id}, Quantité: ${item.quantity}`
      );
    });
  }

  console.log('\n✅ Prêt pour test API création shipment');
  console.log(`   URL: http://localhost:3000/api/sales-shipments/create`);
  console.log(`   Order ID: ${order.id}`);
  console.log(
    `   Item IDs: ${items?.map((i: any) => i.id).join(', ') || 'N/A'}`
  );
}

main().catch(console.error);
