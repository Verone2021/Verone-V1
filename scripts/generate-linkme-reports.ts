import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

async function generateReports() {
  // ============================================
  // 1. CONNEXION SUPABASE
  // ============================================
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl) {
    console.error(
      '❌ Erreur: NEXT_PUBLIC_SUPABASE_URL manquant dans .env.local'
    );
    process.exit(1);
  }

  // Utiliser service_role en priorité (bypasse RLS), sinon anon
  const supabaseKey = serviceRoleKey || anonKey;
  const keyType = serviceRoleKey
    ? 'service_role (bypasse RLS)'
    : 'anon (avec RLS)';

  if (!supabaseKey) {
    console.error('❌ Erreur: Aucune clé Supabase disponible');
    console.error(
      '   Vérifiez .env.local pour SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔄 Extraction des commandes LinkMe...');
  console.log('📊 URL Supabase:', supabaseUrl);
  console.log('🔑 Type de clé:', keyType);

  // ============================================
  // 2. EXTRACTION DONNÉES (Vue linkme_orders_with_margins + items)
  // ============================================
  const {
    data: rawOrders,
    error: ordersError,
    count,
  } = await supabase
    .from('linkme_orders_with_margins')
    .select(
      'id, order_number, created_at, total_ht, total_ttc, customer_name, status',
      { count: 'exact' }
    )
    .order('created_at', { ascending: true });

  console.log('📊 Nombre total de commandes (count):', count);
  console.log(
    '📊 Commandes retournées avant filtrage:',
    rawOrders?.length || 0
  );

  // Filtrer pour ne garder QUE les commandes expédiées (shipped)
  // Exclure les commandes en attente de validation (draft, pending_validation, etc.)
  const pendingOrders =
    rawOrders?.filter(order => order.status !== 'shipped') || [];

  const filteredOrders =
    rawOrders?.filter(order => order.status === 'shipped') || [];

  if (pendingOrders.length > 0) {
    console.log('\n⚠️  Commandes non expédiées exclues:', pendingOrders.length);
    pendingOrders.forEach(order => {
      console.log(
        `   - ${order.order_number} : ${order.customer_name} (status: ${order.status})`
      );
    });
  }

  console.log(
    '✅ Commandes expédiées (après filtrage):',
    filteredOrders.length
  );

  if (ordersError) {
    console.error('❌ Erreur extraction commandes:', ordersError);
    process.exit(1);
  }

  if (!filteredOrders || filteredOrders.length === 0) {
    console.error('❌ Aucune commande valide trouvée après filtrage');
    process.exit(1);
  }

  // Récupérer les items pour chaque commande
  const ordersWithItems = await Promise.all(
    filteredOrders.map(async order => {
      const { data: items } = await supabase
        .from('sales_order_items')
        .select(
          `
          quantity,
          unit_price_ht,
          total_ht,
          product:products(sku, name)
        `
        )
        .eq('sales_order_id', order.id);

      return {
        ...order,
        items: JSON.stringify(
          items?.map(item => ({
            product_sku: item.product?.sku || 'N/A',
            product_name: item.product?.name || 'Produit inconnu',
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            total_ht: item.total_ht,
          })) || []
        ),
      };
    })
  );

  const orders = ordersWithItems;

  console.log(`✅ ${orders.length} commandes extraites`);
  console.log(
    `📅 Première facture : ${new Date(orders[0].created_at).toLocaleDateString('fr-FR')}`
  );
  console.log(
    `📅 Dernière facture : ${new Date(orders[orders.length - 1].created_at).toLocaleDateString('fr-FR')}`
  );

  // ============================================
  // 3. GÉNÉRATION RAPPORT FACTURES
  // ============================================
  console.log('\n📝 Génération Rapport Factures...');

  // Grouper par mois (year-month)
  const ordersByMonth = new Map();
  for (const order of orders) {
    const date = new Date(order.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!ordersByMonth.has(monthKey)) {
      ordersByMonth.set(monthKey, []);
    }
    ordersByMonth.get(monthKey).push(order);
  }

  let mdFactures = `# RAPPORT FACTURES LINKME - HISTORIQUE COMPLET\n\n`;
  mdFactures += `**Date d'extraction** : ${new Date().toLocaleDateString('fr-FR')}\n`;
  mdFactures += `**Période couverte** : ${new Date(orders[0].created_at).toLocaleDateString('fr-FR')} → ${new Date(orders[orders.length - 1].created_at).toLocaleDateString('fr-FR')}\n`;
  mdFactures += `**Nombre total de factures** : ${orders.length}\n\n`;
  mdFactures += `---\n\n`;

  // Itérer par mois (chronologique)
  const sortedMonths = Array.from(ordersByMonth.keys()).sort();
  let grandTotalTTC = 0;

  for (const monthKey of sortedMonths) {
    const monthOrders = ordersByMonth.get(monthKey);
    const firstDate = new Date(monthOrders[0].created_at);
    const monthName = firstDate
      .toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
      .toUpperCase();

    mdFactures += `## ${monthName}\n\n`;
    mdFactures += `| N° Facture | Date | Client | Montant HT | TVA | Montant TTC |\n`;
    mdFactures += `|------------|------|--------|------------|-----|-------------|\n`;

    let monthTotalHT = 0;
    let monthTotalTTC = 0;

    for (const order of monthOrders) {
      const date = new Date(order.created_at).toLocaleDateString('fr-FR');
      const totalHT = parseFloat(order.total_ht || 0);
      const totalTTC = parseFloat(order.total_ttc || 0);
      const tva = totalTTC - totalHT;

      mdFactures += `| ${order.order_number} | ${date} | ${order.customer_name} | ${totalHT.toFixed(2)} € | ${tva.toFixed(2)} € | **${totalTTC.toFixed(2)} €** |\n`;
      monthTotalHT += totalHT;
      monthTotalTTC += totalTTC;
    }

    grandTotalTTC += monthTotalTTC;

    mdFactures += `\n**TOTAL ${monthName} : ${monthTotalTTC.toFixed(2)} €** (${monthOrders.length} factures)\n\n`;
    mdFactures += `---\n\n`;
  }

  // Récapitulatif annuel
  mdFactures += `## RECAPITULATIF GLOBAL\n\n`;
  mdFactures += `| Période | Nb Factures | Total TTC |\n`;
  mdFactures += `|---------|-------------|----------|\n`;
  mdFactures += `| ${new Date(orders[0].created_at).toLocaleDateString('fr-FR')} → ${new Date(orders[orders.length - 1].created_at).toLocaleDateString('fr-FR')} | ${orders.length} | **${grandTotalTTC.toFixed(2)} €** |\n\n`;

  // Écrire fichier Factures
  fs.writeFileSync('RAPPORT_FACTURES_LINKME_COMPLET.md', mdFactures);
  console.log('✅ RAPPORT_FACTURES_LINKME_COMPLET.md généré');

  // ============================================
  // 4. GÉNÉRATION RAPPORT PRODUITS
  // ============================================
  console.log('\n📝 Génération Rapport Produits...');

  let mdProduits = `# RAPPORT PRODUITS VENDUS LINKME - HISTORIQUE COMPLET\n\n`;
  mdProduits += `**Date d'extraction** : ${new Date().toLocaleDateString('fr-FR')}\n`;
  mdProduits += `**Période couverte** : ${new Date(orders[0].created_at).toLocaleDateString('fr-FR')} → ${new Date(orders[orders.length - 1].created_at).toLocaleDateString('fr-FR')}\n`;
  mdProduits += `**Nombre total de factures** : ${orders.length}\n\n`;
  mdProduits += `---\n\n`;

  // Cumul global pour calcul final
  const productMap = new Map();

  // Section détaillée par facture
  for (const order of orders) {
    const date = new Date(order.created_at).toLocaleDateString('fr-FR');
    const totalHT = parseFloat(order.total_ht || 0);

    mdProduits += `## ${order.order_number} - ${order.customer_name} - ${date} - ${totalHT.toFixed(2)} € HT\n\n`;
    mdProduits += `| Code | Désignation | Qté | PU HT | Total HT |\n`;
    mdProduits += `|------|-------------|-----|-------|----------|\n`;

    const items = JSON.parse(order.items || '[]');
    for (const item of items) {
      const unitPrice = parseFloat(item.unit_price_ht || 0);
      const total = parseFloat(item.total_ht || 0);
      mdProduits += `| ${item.product_sku || 'N/A'} | ${item.product_name} | ${item.quantity} | ${unitPrice.toFixed(2)} € | ${total.toFixed(2)} € |\n`;

      // Agrégation pour cumul global
      const sku = item.product_sku || 'N/A';
      if (!productMap.has(sku)) {
        productMap.set(sku, {
          name: item.product_name,
          quantity: 0,
          total_ht: 0,
        });
      }
      const product = productMap.get(sku);
      product.quantity += parseInt(item.quantity || 0);
      product.total_ht += total;
    }

    mdProduits += `\n**Total facture :** ${totalHT.toFixed(2)} € HT\n\n`;
    mdProduits += `---\n\n`;
  }

  // Cumul global des produits
  mdProduits += `## CUMUL DES PRODUITS VENDUS (TOUTES PÉRIODES)\n\n`;
  mdProduits += `### Produits\n`;
  mdProduits += `| Code | Désignation | Quantité totale | CA HT |\n`;
  mdProduits += `|------|-------------|----------------|-------|\n`;

  // Tri par SKU
  const sortedProducts = Array.from(productMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  for (const [sku, data] of sortedProducts) {
    mdProduits += `| ${sku} | ${data.name} | ${data.quantity} | ${data.total_ht.toFixed(2)} € |\n`;
  }

  const totalHT = Array.from(productMap.values()).reduce(
    (sum, p) => sum + p.total_ht,
    0
  );
  mdProduits += `\n### Totaux\n`;
  mdProduits += `- **Total HT cumulé :** ${totalHT.toFixed(2)} €\n`;
  mdProduits += `- **Nombre de factures traitées :** ${orders.length}\n`;
  mdProduits += `- **Période :** ${new Date(orders[0].created_at).toLocaleDateString('fr-FR')} → ${new Date(orders[orders.length - 1].created_at).toLocaleDateString('fr-FR')}\n\n`;

  // Écrire fichier Produits
  fs.writeFileSync('RAPPORT_PRODUITS_VENDUS_LINKME_COMPLET.md', mdProduits);
  console.log('✅ RAPPORT_PRODUITS_VENDUS_LINKME_COMPLET.md généré');

  // ============================================
  // 5. RÉSUMÉ FINAL
  // ============================================
  console.log('\n✅ RAPPORTS GÉNÉRÉS AVEC SUCCÈS\n');
  console.log('📄 Fichiers créés:');
  console.log('   - RAPPORT_FACTURES_LINKME_COMPLET.md');
  console.log('   - RAPPORT_PRODUITS_VENDUS_LINKME_COMPLET.md');
  console.log(`\n📊 Statistiques:`);
  console.log(`   - ${orders.length} factures traitées`);
  console.log(`   - ${productMap.size} produits distincts`);
  console.log(`   - ${totalHT.toFixed(2)} € HT total`);
  console.log(`   - ${grandTotalTTC.toFixed(2)} € TTC total`);
}

// Exécuter la fonction
generateReports().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
