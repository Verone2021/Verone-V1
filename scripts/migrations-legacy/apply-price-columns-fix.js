/**
 * 🔧 APPLICATION CORRECTIF: Colonnes Prix Manquantes
 * Date: 28/09/2025
 * Objectif: Appliquer le correctif via JavaScript et Supabase
 */

const { createClient } = require('@supabase/supabase-js')

async function applyPriceColumnsFix() {
  console.log('🔧 Application correctif colonnes prix...\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    console.log('📋 Étape 1: Ajout colonne price_ht...')

    // Note: Les ALTER TABLE doivent être exécutées via l'interface Supabase SQL Editor
    // car elles nécessitent des privilèges élevés

    console.log(`
🚨 IMPORTANT: Ce script détecte les colonnes manquantes.
   Les corrections SQL doivent être appliquées manuellement via:

   1. Supabase Dashboard → SQL Editor
   2. Exécuter le fichier: scripts/fix-missing-price-columns.sql

📋 COMMANDES SQL À EXÉCUTER:

-- Ajouter colonnes manquantes
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_ht NUMERIC(10,2) DEFAULT 0;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS supplier_cost_price NUMERIC(10,2);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS estimated_selling_price NUMERIC(10,2);

-- Contraintes business
ALTER TABLE products
ADD CONSTRAINT IF NOT EXISTS products_price_ht_positive
CHECK (price_ht >= 0);

-- Migration données
UPDATE products
SET price_ht = COALESCE(cost_price, 0)
WHERE price_ht = 0 OR price_ht IS NULL;

-- Index performance
CREATE INDEX IF NOT EXISTS idx_products_price_ht
ON products(price_ht)
WHERE price_ht IS NOT NULL;
`)

    // Test de validation post-correctif
    console.log('\n📋 Test validation (sera OK après application SQL)...')

    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('id, name, price_ht')
      .limit(1)

    if (testError && testError.code === '42703') {
      console.log('❌ Colonnes encore manquantes - Appliquer le SQL ci-dessus')
    } else if (testError) {
      console.log('❌ Erreur autre:', testError.message)
    } else {
      console.log('✅ Colonnes prix détectées - Correctif déjà appliqué')
      console.log('📊 Exemple données:', testData?.[0])
    }

  } catch (error) {
    console.error('💥 Erreur:', error)
  }

  console.log('\n🏁 Analyse terminée')
}

// Exécution
if (require.main === module) {
  applyPriceColumnsFix()
}

module.exports = { applyPriceColumnsFix }