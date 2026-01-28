import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://aorroydfjsrygmosnzrl.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3Mjc0NzAsImV4cCI6MjA3MzMwMzQ3MH0.fRi7svC8bAr3wihH76pfQnaq7tjuBMypAEi6q-rHCTA';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('=== AUDIT COMMISSIONS POKAWA - 2026-01-09 ===\n');

// 1. Identifier Pokawa
console.log('1️⃣  Recherche Pokawa affiliate...');
const { data: affiliate, error: affiliateError } = await supabase
  .from('linkme_affiliates')
  .select('id, organisation_id, slug, created_at')
  .ilike('slug', '%pokawa%')
  .single();

if (affiliateError) {
  console.error('❌ Erreur:', affiliateError.message);
  process.exit(1);
}

console.log(`✅ Pokawa trouvé: ID=${affiliate.id}, Slug=${affiliate.slug}\n`);

// 2. Statistiques globales commandes
console.log('2️⃣  Statistiques globales commandes Pokawa...');
const { data: orders, error: ordersError } = await supabase
  .from('sales_orders')
  .select('id, order_number, created_at, total_ht, total_ttc, status')
  .eq('affiliate_id', affiliate.id)
  .not('status', 'in', '(cancelled,draft)');

if (ordersError) {
  console.error('❌ Erreur:', ordersError.message);
  process.exit(1);
}

const totalHT = orders.reduce((sum, o) => sum + parseFloat(o.total_ht || 0), 0);
const totalTTC = orders.reduce(
  (sum, o) => sum + parseFloat(o.total_ttc || 0),
  0
);
const dates = orders.map(o => o.created_at).sort();

console.log(`   Total commandes: ${orders.length}`);
console.log(`   Période: ${dates[0]} → ${dates[dates.length - 1]}`);
console.log(`   Total HT: ${totalHT.toFixed(2)} €`);
console.log(`   Total TTC: ${totalTTC.toFixed(2)} €\n`);

// 3. Commissions actuelles
console.log('3️⃣  Commissions en base de données...');
const { data: commissions, error: commissionsError } = await supabase
  .from('linkme_commissions')
  .select(
    `
    id,
    order_id,
    affiliate_commission,
    affiliate_commission_ttc,
    verone_commission,
    verone_commission_ttc,
    sales_orders!inner(order_number, affiliate_id, status)
  `
  )
  .eq('sales_orders.affiliate_id', affiliate.id)
  .not('sales_orders.status', 'in', '(cancelled,draft)');

if (commissionsError) {
  console.error('❌ Erreur:', commissionsError.message);
} else {
  const totalAffiliateHT = commissions.reduce(
    (sum, c) => sum + parseFloat(c.affiliate_commission || 0),
    0
  );
  const totalAffiliateTTC = commissions.reduce(
    (sum, c) => sum + parseFloat(c.affiliate_commission_ttc || 0),
    0
  );
  const totalVeroneHT = commissions.reduce(
    (sum, c) => sum + parseFloat(c.verone_commission || 0),
    0
  );
  const totalVeroneTTC = commissions.reduce(
    (sum, c) => sum + parseFloat(c.verone_commission_ttc || 0),
    0
  );
  const commissionsZero = commissions.filter(
    c => parseFloat(c.affiliate_commission || 0) === 0
  ).length;
  const commissionsNeg = commissions.filter(
    c => parseFloat(c.affiliate_commission || 0) < 0
  ).length;

  console.log(`   Total records: ${commissions.length}`);
  console.log(`   Commissions à 0€: ${commissionsZero}`);
  console.log(`   Commissions négatives: ${commissionsNeg}`);
  console.log(`   Total Pokawa HT: ${totalAffiliateHT.toFixed(2)} €`);
  console.log(`   Total Pokawa TTC: ${totalAffiliateTTC.toFixed(2)} €`);
  console.log(`   Total Vérone HT: ${totalVeroneHT.toFixed(2)} €`);
  console.log(`   Total Vérone TTC: ${totalVeroneTTC.toFixed(2)} €\n`);
}

// 4. Liste des commandes à 0€
console.log('4️⃣  Commandes avec commission = 0€...');
const orderIds = orders.map(o => o.id);
const { data: zeroCommissions, error: _zeroError } = await supabase
  .from('linkme_commissions')
  .select(
    `
    id,
    order_id,
    affiliate_commission,
    affiliate_commission_ttc,
    sales_orders!inner(order_number, created_at, total_ht, total_ttc)
  `
  )
  .in('order_id', orderIds)
  .eq('affiliate_commission', 0);

// Trouver aussi les commandes SANS commission
const ordersWithCommission = new Set(commissions.map(c => c.order_id));
const ordersWithoutCommission = orders.filter(
  o => !ordersWithCommission.has(o.id)
);

console.log(
  `   Commandes avec commission = 0€: ${zeroCommissions?.length || 0}`
);
console.log(`   Commandes SANS commission: ${ordersWithoutCommission.length}`);

if (zeroCommissions?.length > 0) {
  console.log('\n   Détails commandes à 0€:');
  zeroCommissions.forEach(c => {
    console.log(
      `   - ${c.sales_orders.order_number} (${c.sales_orders.created_at?.substring(0, 10)}) - HT: ${c.sales_orders.total_ht}€`
    );
  });
}

if (ordersWithoutCommission.length > 0) {
  console.log('\n   Détails commandes SANS commission:');
  ordersWithoutCommission.forEach(o => {
    console.log(
      `   - ${o.order_number} (${o.created_at?.substring(0, 10)}) - HT: ${o.total_ht}€`
    );
  });
}

// 5. Analyse détaillée des 19 commandes problématiques
console.log('\n5️⃣  Analyse détaillée des 19 commandes à 0€...');
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

const { data: problematicOrdersData, error: problematicError } = await supabase
  .from('sales_orders')
  .select('id, order_number, created_at, total_ht, total_ttc')
  .in('order_number', problematicOrders)
  .eq('affiliate_id', affiliate.id);

if (!problematicError && problematicOrdersData) {
  console.log(
    `   Trouvées: ${problematicOrdersData.length}/${problematicOrders.length}`
  );

  // Vérifier items de ces commandes
  const problematicOrderIds = problematicOrdersData.map(o => o.id);
  const { data: items, error: _itemsError } = await supabase
    .from('sales_order_items')
    .select(
      'order_id, product_name, quantity, unit_price_ht, total_ht, retrocession_amount, custom_commission_rate, affiliate_payout_ht'
    )
    .in('order_id', problematicOrderIds);

  if (items) {
    const totalRetrocession = items.reduce(
      (sum, i) => sum + parseFloat(i.retrocession_amount || 0),
      0
    );
    console.log(`   Total items: ${items.length}`);
    console.log(
      `   Total retrocession_amount (legacy): ${totalRetrocession.toFixed(2)} €`
    );

    // Items avec affiliate_payout_ht
    const itemsWithPayout = items.filter(
      i => i.affiliate_payout_ht && parseFloat(i.affiliate_payout_ht) > 0
    );
    console.log(`   Items avec affiliate_payout_ht: ${itemsWithPayout.length}`);

    if (itemsWithPayout.length > 0) {
      const totalPayout = itemsWithPayout.reduce(
        (sum, i) => sum + parseFloat(i.affiliate_payout_ht || 0),
        0
      );
      console.log(`   Total affiliate_payout_ht: ${totalPayout.toFixed(2)} €`);
      console.log(
        `   Commission théorique (15%): ${(totalPayout * 0.15).toFixed(2)} €`
      );
    }
  }
}

console.log('\n✅ Audit terminé');
