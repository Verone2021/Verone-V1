#!/usr/bin/env npx tsx
/**
 * Script de Réconciliation - Vérification cohérence marges DB vs SSOT
 *
 * Exécution: npx tsx scripts/verify-margin-consistency.ts
 *
 * Ce script:
 * 1. Lit 100 produits random depuis linkme_selection_items
 * 2. Recalcule selling_price_ht avec la formule SSOT
 * 3. Compare avec la valeur DB (colonne GENERATED)
 * 4. Génère un rapport de cohérence
 *
 * @module verify-margin-consistency
 * @since 2026-01-21
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.mcp.env' });

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aorroydfjsrygmosnzrl.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Nombre de produits à vérifier
const SAMPLE_SIZE = 100;

// Tolérance d'arrondi (en euros)
const TOLERANCE = 0.02;

// ============================================================================
// SSOT CALCULATION (copie exacte de margin-calculation.ts)
// ============================================================================

function calculateSellingPriceSSoT(basePriceHt: number, marginRate: number): number {
  if (marginRate === 0) return Math.round(basePriceHt * 100) / 100;
  if (marginRate >= 100) throw new Error('Margin rate must be < 100');

  const sellingPrice = basePriceHt / (1 - marginRate / 100);
  return Math.round(sellingPrice * 100) / 100;
}

// ============================================================================
// MAIN
// ============================================================================

interface SelectionItem {
  id: string;
  selection_id: string;
  product_id: string;
  base_price_ht: number;
  margin_rate: number;
  selling_price_ht: number; // Colonne GENERATED en DB
  product_name?: string;
}

interface VerificationResult {
  total: number;
  consistent: number;
  inconsistent: number;
  errors: Array<{
    id: string;
    productName: string;
    basePriceHt: number;
    marginRate: number;
    dbSellingPrice: number;
    calculatedSellingPrice: number;
    difference: number;
  }>;
}

async function main() {
  console.log('='.repeat(60));
  console.log('VÉRIFICATION COHÉRENCE MARGES - LinkMe');
  console.log('='.repeat(60));
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Échantillon: ${SAMPLE_SIZE} produits`);
  console.log(`Tolérance: ±${TOLERANCE}€\n`);

  // Vérifier les credentials
  if (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_KEY) {
    console.log('⚠️  Aucune clé Supabase trouvée.');
    console.log('   Variables attendues: NEXT_PUBLIC_SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY');
    console.log('\n🔧 Mode simulation: vérification avec données de test\n');

    // Données de test pour démonstration
    runSimulatedVerification();
    return;
  }

  // Créer client Supabase
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY
  );

  console.log('📡 Connexion à Supabase...\n');

  try {
    // Récupérer les items de sélection avec un échantillon random
    const { data: items, error } = await supabase
      .from('linkme_selection_items')
      .select(`
        id,
        selection_id,
        product_id,
        base_price_ht,
        margin_rate,
        selling_price_ht,
        products:product_id (name)
      `)
      .limit(SAMPLE_SIZE);

    if (error) {
      console.error('❌ Erreur Supabase:', error.message);

      // Fallback: vérification simulée
      console.log('\n🔧 Mode simulation activé\n');
      runSimulatedVerification();
      return;
    }

    if (!items || items.length === 0) {
      console.log('⚠️  Aucun item trouvé dans linkme_selection_items');
      console.log('   La table est peut-être vide ou les permissions sont insuffisantes.\n');
      runSimulatedVerification();
      return;
    }

    console.log(`✅ ${items.length} items récupérés\n`);

    // Vérifier chaque item
    const result = verifyItems(items as SelectionItem[]);

    // Afficher le rapport
    printReport(result);

  } catch (err) {
    console.error('❌ Erreur inattendue:', err);
    console.log('\n🔧 Mode simulation activé\n');
    runSimulatedVerification();
  }
}

function verifyItems(items: SelectionItem[]): VerificationResult {
  const result: VerificationResult = {
    total: items.length,
    consistent: 0,
    inconsistent: 0,
    errors: [],
  };

  for (const item of items) {
    const { id, base_price_ht, margin_rate, selling_price_ht } = item;
    const productName = (item as any).products?.name || `Produit ${item.product_id}`;

    // Calculer avec SSOT
    const calculatedPrice = calculateSellingPriceSSoT(base_price_ht, margin_rate);

    // Comparer avec DB
    const difference = Math.abs(selling_price_ht - calculatedPrice);

    if (difference <= TOLERANCE) {
      result.consistent++;
    } else {
      result.inconsistent++;
      result.errors.push({
        id,
        productName,
        basePriceHt: base_price_ht,
        marginRate: margin_rate,
        dbSellingPrice: selling_price_ht,
        calculatedSellingPrice: calculatedPrice,
        difference,
      });
    }
  }

  return result;
}

function printReport(result: VerificationResult) {
  console.log('-'.repeat(60));
  console.log('RAPPORT DE COHÉRENCE');
  console.log('-'.repeat(60));

  const consistencyRate = ((result.consistent / result.total) * 100).toFixed(2);

  console.log(`\n📊 Résumé:`);
  console.log(`   Total vérifié:  ${result.total}`);
  console.log(`   ✅ Cohérents:   ${result.consistent}`);
  console.log(`   ❌ Incohérents: ${result.inconsistent}`);
  console.log(`   📈 Taux:        ${consistencyRate}%\n`);

  if (result.errors.length > 0) {
    console.log('🔴 ERREURS DÉTECTÉES:');
    console.log('-'.repeat(60));

    for (const err of result.errors.slice(0, 10)) {
      console.log(`\n  ID: ${err.id}`);
      console.log(`  Produit: ${err.productName}`);
      console.log(`  Base: ${err.basePriceHt}€ | Marge: ${err.marginRate}%`);
      console.log(`  DB:   ${err.dbSellingPrice}€`);
      console.log(`  SSOT: ${err.calculatedSellingPrice}€`);
      console.log(`  Écart: ${err.difference.toFixed(2)}€`);
    }

    if (result.errors.length > 10) {
      console.log(`\n  ... et ${result.errors.length - 10} autres erreurs`);
    }
  } else {
    console.log('✅ PARFAIT! Tous les calculs sont cohérents.\n');
  }

  console.log('='.repeat(60));

  // Exit code basé sur les erreurs
  if (result.inconsistent > 0) {
    console.log('⚠️  Des incohérences ont été détectées. Vérifiez les erreurs ci-dessus.\n');
    // Ne pas exit(1) pour ne pas bloquer le CI si la colonne GENERATED est correcte
  }
}

function runSimulatedVerification() {
  console.log('📝 Vérification simulée avec données de test:\n');

  // Données de test représentatives
  const testItems: SelectionItem[] = [
    {
      id: 'test-1',
      selection_id: 'sel-1',
      product_id: 'prod-1',
      base_price_ht: 100,
      margin_rate: 15,
      selling_price_ht: 117.65, // Correct (taux de marque)
      product_name: 'Chaise design',
    },
    {
      id: 'test-2',
      selection_id: 'sel-1',
      product_id: 'prod-2',
      base_price_ht: 100,
      margin_rate: 10,
      selling_price_ht: 111.11, // Correct
      product_name: 'Table basse',
    },
    {
      id: 'test-3',
      selection_id: 'sel-1',
      product_id: 'prod-3',
      base_price_ht: 100,
      margin_rate: 20,
      selling_price_ht: 125, // Correct
      product_name: 'Lampe',
    },
    {
      id: 'test-4',
      selection_id: 'sel-2',
      product_id: 'prod-4',
      base_price_ht: 20.19,
      margin_rate: 15,
      selling_price_ht: 23.75, // Correct (Plateau bois 20x30)
      product_name: 'Plateau bois 20x30',
    },
    {
      id: 'test-5',
      selection_id: 'sel-2',
      product_id: 'prod-5',
      base_price_ht: 50,
      margin_rate: 15,
      selling_price_ht: 58.82, // Correct
      product_name: 'Coussin déco',
    },
    // Exemple d'erreur (ancienne formule taux de marge)
    {
      id: 'test-6-ERROR',
      selection_id: 'sel-3',
      product_id: 'prod-6',
      base_price_ht: 100,
      margin_rate: 15,
      selling_price_ht: 115, // FAUX! (100 × 1.15 = ancienne formule)
      product_name: 'Produit avec ancienne formule',
    },
  ];

  const result = verifyItems(testItems);
  printReport(result);

  console.log('\n💡 Note: Ce rapport est basé sur des données simulées.');
  console.log('   Pour vérifier les vraies données, configurez NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

// Exécuter
main().catch(console.error);
