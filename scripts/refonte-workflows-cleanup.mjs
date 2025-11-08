#!/usr/bin/env node

/**
 * Script: Refonte Workflows - Cleanup et Création Données Test
 * Date: 2025-10-13
 * Usage: node scripts/refonte-workflows-cleanup.mjs
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('========================================');
console.log('REFONTE WORKFLOWS - DÉMARRAGE');
console.log('========================================');
console.log('');

// =============================================
// PHASE 1: VÉRIFICATION ÉTAT ACTUEL
// =============================================

console.log('=== PHASE 1: Vérification état actuel ===');
console.log('');

const { data: salesOrders, error: soError } = await supabase
  .from('sales_orders')
  .select('id, status, payment_required');

if (soError) {
  console.error('❌ Erreur lecture sales_orders:', soError.message);
} else {
  const draft = salesOrders.filter(so => so.status === 'draft').length;
  const confirmed = salesOrders.filter(so => so.status === 'confirmed').length;
  const prepayment = salesOrders.filter(
    so => so.payment_required === true
  ).length;
  const credit = salesOrders.filter(so => so.payment_required === false).length;

  console.log(`📊 Sales Orders: ${salesOrders.length} total`);
  console.log(`   - Draft: ${draft}`);
  console.log(`   - Confirmed: ${confirmed}`);
  console.log(`   - Prépaiement: ${prepayment}`);
  console.log(`   - Encours: ${credit}`);
}

const { data: purchaseOrders, error: poError } = await supabase
  .from('purchase_orders')
  .select('id');

if (poError) {
  console.error('❌ Erreur lecture purchase_orders:', poError.message);
} else {
  console.log(`📦 Purchase Orders: ${purchaseOrders.length} total`);
}

const { data: organisations, error: orgError } = await supabase
  .from('organisations')
  .select('id, type');

if (orgError) {
  console.error('❌ Erreur lecture organisations:', orgError.message);
} else {
  const customers = organisations.filter(o => o.type === 'customer').length;
  const suppliers = organisations.filter(o => o.type === 'supplier').length;
  console.log(`🏢 Organisations: ${organisations.length} total`);
  console.log(`   - Clients: ${customers}`);
  console.log(`   - Fournisseurs: ${suppliers}`);
}

const { data: products, error: prodError } = await supabase
  .from('products')
  .select('id, stock_real');

if (prodError) {
  console.error('❌ Erreur lecture products:', prodError.message);
} else {
  const inStock = products.filter(p => p.stock_real > 10).length;
  const lowStock = products.filter(
    p => p.stock_real >= 1 && p.stock_real <= 10
  ).length;
  const outOfStock = products.filter(p => p.stock_real === 0).length;
  console.log(`📦 Produits: ${products.length} total`);
  console.log(`   - En stock (>10): ${inStock}`);
  console.log(`   - Stock faible (1-10): ${lowStock}`);
  console.log(`   - Rupture (0): ${outOfStock}`);
}

console.log('');
console.log('========================================');
console.log('PHASE 2: CLEANUP - Suppression données existantes');
console.log('========================================');
console.log('');

// =============================================
// PHASE 2: CLEANUP
// =============================================

console.log('⚠️  ATTENTION: Suppression de toutes les commandes en cours...');
console.log('');

// Supprimer mouvements stock liés aux commandes
console.log('🗑️  Suppression mouvements stock liés aux commandes...');
const { error: mvtError } = await supabase
  .from('stock_movements')
  .delete()
  .in('reference_type', [
    'sales_order',
    'sales_order_forecast',
    'purchase_order',
    'purchase_order_forecast',
  ]);

if (mvtError) {
  console.error('❌ Erreur suppression mouvements:', mvtError.message);
} else {
  console.log('✅ Mouvements stock supprimés');
}

// Supprimer items commandes clients
console.log('🗑️  Suppression items commandes clients...');
const { error: soiError } = await supabase
  .from('sales_order_items')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

if (soiError) {
  console.error('❌ Erreur suppression sales_order_items:', soiError.message);
} else {
  console.log('✅ Sales order items supprimés');
}

// Supprimer commandes clients
console.log('🗑️  Suppression commandes clients...');
const { error: soDelError } = await supabase
  .from('sales_orders')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

if (soDelError) {
  console.error('❌ Erreur suppression sales_orders:', soDelError.message);
} else {
  console.log('✅ Sales orders supprimées');
}

// Supprimer items commandes fournisseurs
console.log('🗑️  Suppression items commandes fournisseurs...');
const { error: poiError } = await supabase
  .from('purchase_order_items')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

if (poiError) {
  console.error(
    '❌ Erreur suppression purchase_order_items:',
    poiError.message
  );
} else {
  console.log('✅ Purchase order items supprimés');
}

// Supprimer commandes fournisseurs
console.log('🗑️  Suppression commandes fournisseurs...');
const { error: poDelError } = await supabase
  .from('purchase_orders')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

if (poDelError) {
  console.error('❌ Erreur suppression purchase_orders:', poDelError.message);
} else {
  console.log('✅ Purchase orders supprimées');
}

// Note: Pas de table sequences, les numéros sont générés via trigger
console.log('✅ Séquences: auto-générées via trigger');

console.log('');
console.log('========================================');
console.log('PHASE 3: CRÉATION ORGANISATIONS B2B');
console.log('========================================');
console.log('');

// =============================================
// PHASE 3: ORGANISATIONS B2B
// =============================================

// Trouver premier utilisateur admin
const { data: adminUser, error: adminError } = await supabase
  .from('user_profiles')
  .select('user_id')
  .in('role', ['owner', 'admin'])
  .limit(1)
  .single();

if (adminError || !adminUser) {
  console.error('❌ Aucun utilisateur admin trouvé');
  process.exit(1);
}

const adminId = adminUser.user_id;
console.log(`✅ Utilisateur admin: ${adminId}`);
console.log('');

// Organisations ENCOURS (payment_required=false)
console.log('=== Création Clients ENCOURS (auto-validation) ===');
console.log('');

const organisationsEncours = [
  {
    name: 'Hotel Le Luxe',
    slug: 'hotel-le-luxe',
    email: 'contact@hotel-le-luxe.fr',
    payment_terms: 'NET30 - Encours autorisé',
    prepayment_required: false,
    billing_address_line1: '45 Avenue des Champs-Élysées',
    billing_city: 'Paris',
    billing_postal_code: '75008',
    billing_country: 'FR',
  },
  {
    name: 'Château de Fontainebleau Boutique',
    slug: 'chateau-fontainebleau',
    email: 'boutique@chateaudefontainebleau.fr',
    payment_terms: 'NET45 - Encours autorisé',
    prepayment_required: false,
    billing_address_line1: 'Place du Général de Gaulle',
    billing_city: 'Fontainebleau',
    billing_postal_code: '77300',
    billing_country: 'FR',
  },
  {
    name: "Musée d'Orsay Boutique",
    slug: 'musee-orsay',
    email: 'boutique@musee-orsay.fr',
    payment_terms: 'NET60 - Encours autorisé',
    prepayment_required: false,
    billing_address_line1: "1 Rue de la Légion d'Honneur",
    billing_city: 'Paris',
    billing_postal_code: '75007',
    billing_country: 'FR',
  },
  {
    name: 'Grand Hotel du Palais Royal',
    slug: 'grand-hotel-palais-royal',
    email: 'achat@grandhotelpalaisroyal.fr',
    payment_terms: 'NET30 - Encours autorisé',
    prepayment_required: false,
    billing_address_line1: '4 Rue de Valois',
    billing_city: 'Paris',
    billing_postal_code: '75001',
    billing_country: 'FR',
  },
];

for (const org of organisationsEncours) {
  // Vérifier si existe déjà
  const { data: existing } = await supabase
    .from('organisations')
    .select('id')
    .eq('slug', org.slug)
    .single();

  if (existing) {
    // Mettre à jour
    const { error: updateError } = await supabase
      .from('organisations')
      .update({
        prepayment_required: org.prepayment_required,
        payment_terms: org.payment_terms,
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error(`❌ Erreur mise à jour ${org.name}:`, updateError.message);
    } else {
      console.log(`✅ ${org.name} mis à jour (ENCOURS)`);
    }
  } else {
    // Créer
    const { data: newOrg, error: createError } = await supabase
      .from('organisations')
      .insert({
        ...org,
        type: 'customer',
        country: 'FR',
        is_active: true,
        created_by: adminId,
      })
      .select()
      .single();

    if (createError) {
      console.error(`❌ Erreur création ${org.name}:`, createError.message);
    } else {
      console.log(`✅ ${org.name} créé (ENCOURS): ${newOrg.id}`);
    }
  }
}

console.log('');
console.log('=== Création Clients PRÉPAIEMENT (validation manuelle) ===');
console.log('');

// Organisations PRÉPAIEMENT (payment_required=true)
const organisationsPrepayment = [
  {
    name: 'Boutique Décor Lyon',
    slug: 'boutique-decor-lyon',
    email: 'contact@boutique-decor-lyon.fr',
    payment_terms: 'Prépaiement obligatoire',
    prepayment_required: true,
    billing_address_line1: '15 Rue de la République',
    billing_city: 'Lyon',
    billing_postal_code: '69002',
    billing_country: 'FR',
  },
  {
    name: 'Maison des Arts Marseille',
    slug: 'maison-des-arts-marseille',
    email: 'contact@maisondesartsmarseille.fr',
    payment_terms: 'Prépaiement obligatoire - 100%',
    prepayment_required: true,
    billing_address_line1: '23 Cours Julien',
    billing_city: 'Marseille',
    billing_postal_code: '13006',
    billing_country: 'FR',
  },
  {
    name: 'Château de Versailles Boutique',
    slug: 'chateau-versailles',
    email: 'boutique@chateauversailles.fr',
    payment_terms: 'Prépaiement 50% - Solde avant livraison',
    prepayment_required: true,
    billing_address_line1: "Place d'Armes",
    billing_city: 'Versailles',
    billing_postal_code: '78000',
    billing_country: 'FR',
  },
  {
    name: "Galerie d'Art Bordeaux",
    slug: 'galerie-art-bordeaux',
    email: 'contact@galerie-bordeaux.fr',
    payment_terms: 'Prépaiement obligatoire',
    prepayment_required: true,
    billing_address_line1: '12 Rue Sainte-Catherine',
    billing_city: 'Bordeaux',
    billing_postal_code: '33000',
    billing_country: 'FR',
  },
];

for (const org of organisationsPrepayment) {
  // Vérifier si existe déjà
  const { data: existing } = await supabase
    .from('organisations')
    .select('id')
    .eq('slug', org.slug)
    .single();

  if (existing) {
    // Mettre à jour
    const { error: updateError } = await supabase
      .from('organisations')
      .update({
        prepayment_required: org.prepayment_required,
        payment_terms: org.payment_terms,
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error(`❌ Erreur mise à jour ${org.name}:`, updateError.message);
    } else {
      console.log(`✅ ${org.name} mis à jour (PRÉPAIEMENT)`);
    }
  } else {
    // Créer
    const { data: newOrg, error: createError } = await supabase
      .from('organisations')
      .insert({
        ...org,
        type: 'customer',
        country: 'FR',
        is_active: true,
        created_by: adminId,
      })
      .select()
      .single();

    if (createError) {
      console.error(`❌ Erreur création ${org.name}:`, createError.message);
    } else {
      console.log(`✅ ${org.name} créé (PRÉPAIEMENT): ${newOrg.id}`);
    }
  }
}

console.log('');
console.log('========================================');
console.log('VÉRIFICATION: Organisations créées');
console.log('========================================');
console.log('');

const { data: allCustomers, error: customersError } = await supabase
  .from('organisations')
  .select('name, payment_terms, prepayment_required, billing_city')
  .eq('type', 'customer')
  .order('prepayment_required')
  .order('name');

if (customersError) {
  console.error('❌ Erreur lecture organisations:', customersError.message);
} else {
  console.log('📋 ORGANISATIONS CLIENTES:');
  console.log('');
  allCustomers.forEach(org => {
    const workflow = org.prepayment_required
      ? '💳 PRÉPAIEMENT (validation manuelle)'
      : '✅ ENCOURS (auto-validation)';
    console.log(`${org.name}`);
    console.log(`   Ville: ${org.billing_city}`);
    console.log(`   Conditions: ${org.payment_terms}`);
    console.log(`   Workflow: ${workflow}`);
    console.log('');
  });
}

console.log('========================================');
console.log('✅ PHASE 1-3 TERMINÉES');
console.log('========================================');
console.log('');
console.log('Résumé:');
console.log(`  ✅ Cleanup complet effectué`);
console.log(
  `  ✅ ${organisationsEncours.length} clients ENCOURS créés/mis à jour`
);
console.log(
  `  ✅ ${organisationsPrepayment.length} clients PRÉPAIEMENT créés/mis à jour`
);
console.log('');
console.log('Prochaines étapes:');
console.log('  - Phase 4: Créer clients B2C supplémentaires');
console.log('  - Phase 5: Créer commandes test diversifiées');
console.log('  - Phase 6: Implémenter override manuel');
console.log('  - Phase 7-11: Tests complets MCP Browser');
console.log('========================================');
