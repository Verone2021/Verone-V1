import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://aorroydfjsrygmosnzrl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('=== AUDIT COMMISSIONS POKAWA - 2026-01-09 ===\n');

// 1. Identifier Pokawa
const { data: affiliate } = await supabase
  .from('linkme_affiliates')
  .select('id, slug')
  .eq('slug', 'pokawa')
  .single();

if (!affiliate) {
  console.error('Pokawa not found');
  process.exit(1);
}

console.log(`✅ Pokawa: ${affiliate.id}\n`);

// 2. Stats commissions (depuis linkme_commissions)
const { data: commissions, error: commError } = await supabase
  .from('linkme_commissions')
  .select(
    `
    id,
    order_id,
    affiliate_commission,
    affiliate_commission_ttc,
    status,
    sales_orders(order_number, created_at, total_ht, total_ttc, status)
  `
  )
  .eq('affiliate_id', affiliate.id);

if (commError) {
  console.error('Error:', commError.message);
  process.exit(1);
}

const validCommissions = (commissions || []).filter(
  c =>
    c.sales_orders?.status &&
    !['cancelled', 'draft'].includes(c.sales_orders.status)
);

const totalAffiliateHT = validCommissions.reduce(
  (s, c) => s + parseFloat(c.affiliate_commission || 0),
  0
);
const totalAffiliateTTC = validCommissions.reduce(
  (s, c) => s + parseFloat(c.affiliate_commission_ttc || 0),
  0
);
const commissionsZero = validCommissions.filter(
  c => parseFloat(c.affiliate_commission || 0) === 0
);

console.log('📊 STATISTIQUES GLOBALES');
console.log(`   Commandes totales: ${validCommissions.length}`);
console.log(`   Pokawa HT: ${totalAffiliateHT.toFixed(2)} €`);
console.log(`   Pokawa TTC: ${totalAffiliateTTC.toFixed(2)} €`);
console.log(`   Commissions à 0€: ${commissionsZero.length}\n`);

// 3. Détail commandes à 0€
if (commissionsZero.length > 0) {
  console.log('❌ COMMANDES AVEC COMMISSION = 0€');
  commissionsZero.forEach(c => {
    const order = c.sales_orders;
    console.log(
      `   ${order.order_number} | ${order.created_at?.substring(0, 10)} | ${order.total_ht}€ HT`
    );
  });
  console.log();
}

// 4. Analyser les 19 commandes problématiques
const problematicOrders = [
  'LINK-230026',
  'LINK-240006',
  'LINK-240009',
  'LINK-240010',
  'LINK-240011',
  'LINK-240012',
  'LINK-240013',
  'LINK-240014',
  'LINK-240016',
  'LINK-240017',
  'LINK-240019',
  'LINK-240022',
  'LINK-240025',
  'LINK-240031',
  'LINK-240033',
  'LINK-240038',
  'LINK-240046',
  'LINK-240060',
  'LINK-240075',
];

const problematic = commissionsZero.filter(c =>
  problematicOrders.includes(c.sales_orders?.order_number)
);

console.log(`🔍 ANALYSE 19 COMMANDES HISTORIQUES`);
console.log(`   Trouvées: ${problematic.length}/${problematicOrders.length}`);

if (problematic.length > 0) {
  const orderIds = problematic.map(c => c.order_id);

  // Récupérer les items
  const { data: items } = await supabase
    .from('sales_order_items')
    .select(
      'order_id, product_name, quantity, total_ht, retrocession_amount, affiliate_payout_ht'
    )
    .in('order_id', orderIds);

  const totalPayout = items.reduce(
    (s, i) => s + parseFloat(i.affiliate_payout_ht || 0),
    0
  );
  const commissionTheorique = totalPayout * 0.15;

  console.log(`   Total affiliate_payout_ht: ${totalPayout.toFixed(2)} €`);
  console.log(
    `   Commission théorique (15%): ${commissionTheorique.toFixed(2)} €`
  );
  console.log(`   Commission DB actuelle: 0.00 €`);
  console.log(`   ÉCART: ${commissionTheorique.toFixed(2)} € manquants\n`);
}

console.log('✅ Audit terminé');
