#!/usr/bin/env tsx

/**
 * Audit LinkMe Commission Model - 2026-01-09
 *
 * Analyse 3 anomalies critiques:
 * 1. Produits affiliés sans commission définie
 * 2. Produits affiliés avec margin_rate != 0 (violation règle métier)
 * 3. Commissions à 0€ pour produits Pokawa
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../packages/@verone/types/src/supabase';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variables d'environnement manquantes:");
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error(
    '   - SUPABASE_KEY (service role or anon):',
    supabaseKey ? '✓' : '✗'
  );
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function audit1_productsWithoutCommission() {
  console.log('\n=== AUDIT 1: Produits affiliés sans commission définie ===\n');

  const { data, error } = await supabase
    .from('products')
    .select(
      'id, name, sku, created_by_affiliate, affiliate_commission_rate, affiliate_approval_status'
    )
    .not('created_by_affiliate', 'is', null)
    .is('affiliate_commission_rate', null);

  if (error) {
    console.error('❌ Erreur:', error.message);
    return;
  }

  if (data.length === 0) {
    console.log('✅ Aucun produit affilié sans commission (OK)');
    return;
  }

  console.log(
    `⚠️  ${data.length} produit(s) trouvé(s) SANS commission définie:\n`
  );
  data.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name} (SKU: ${p.sku})`);
    console.log(`   - ID: ${p.id}`);
    console.log(`   - Créé par: ${p.created_by_affiliate}`);
    console.log(`   - Statut approval: ${p.affiliate_approval_status}`);
    console.log(`   - Commission: NULL ⚠️\n`);
  });
}

async function audit2_affiliateProductsWithMarginRate() {
  console.log(
    '\n=== AUDIT 2: Produits affiliés avec margin_rate != 0 (violation règle métier) ===\n'
  );

  // Query directe sans RPC pour éviter problèmes de déploiement
  const { data: selectionItems, error: lsiError } = await supabase
    .from('linkme_selection_items')
    .select(
      'id, margin_rate, product_id, products(name, sku, created_by_affiliate)'
    )
    .not('products.created_by_affiliate', 'is', null)
    .neq('margin_rate', 0);

  if (lsiError) {
    console.error('❌ Erreur:', lsiError.message);
    return;
  }

  if (!selectionItems || selectionItems.length === 0) {
    console.log('✅ Aucune violation détectée (OK)');
    return;
  }

  console.log(
    `⚠️  ${selectionItems.length} item(s) de sélection avec margin_rate != 0:\n`
  );
  selectionItems.forEach((item, i) => {
    const product = item.products as any;
    console.log(`${i + 1}. ${product?.name} (SKU: ${product?.sku})`);
    console.log(`   - Selection Item ID: ${item.id}`);
    console.log(`   - margin_rate: ${item.margin_rate} ⚠️ (devrait être 0)`);
    console.log(`   - Product ID: ${item.product_id}\n`);
  });
}

async function audit3_zeroCommissions() {
  console.log('\n=== AUDIT 3: Commissions à 0€ pour produits affiliés ===\n');

  // Query directe : récupérer les commissions à 0€
  const { data: commissions, error } = await supabase
    .from('linkme_commissions')
    .select(
      'id, order_id, affiliate_commission, created_at, sales_orders(total_ht)'
    )
    .eq('affiliate_commission', 0)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Erreur:', error.message);
    return;
  }

  if (!commissions || commissions.length === 0) {
    console.log('✅ Aucune commission à 0€ détectée (OK)');
    return;
  }

  console.log(`⚠️  ${commissions.length} commission(s) à 0€ trouvée(s):\n`);

  for (const c of commissions) {
    const salesOrder = c.sales_orders as any;

    // Récupérer les produits de la commande pour vérifier s'ils sont affiliés
    const { data: items } = await supabase
      .from('sales_order_items')
      .select('product_id, products(name, sku, created_by_affiliate)')
      .eq('sales_order_id', c.order_id);

    const affiliateProducts = items?.filter(
      (item: any) => item.products?.created_by_affiliate !== null
    );

    if (affiliateProducts && affiliateProducts.length > 0) {
      console.log(`Commande: ${c.order_id}`);
      console.log(`   - Commission ID: ${c.id}`);
      console.log(`   - Total HT commande: ${salesOrder?.total_ht}€`);
      console.log(`   - Commission affilié: ${c.affiliate_commission}€ ⚠️`);
      console.log(`   - Produits affiliés:`);
      affiliateProducts.forEach((item: any) => {
        console.log(
          `     * ${item.products?.name} (SKU: ${item.products?.sku})`
        );
      });
      console.log('');
    }
  }
}

async function main() {
  console.log('🔍 AUDIT LINKME COMMISSION MODEL - 2026-01-09');
  console.log('================================================\n');

  await audit1_productsWithoutCommission();
  await audit2_affiliateProductsWithMarginRate();
  await audit3_zeroCommissions();

  console.log('\n================================================');
  console.log('✅ Audit terminé');
}

main().catch(console.error);
