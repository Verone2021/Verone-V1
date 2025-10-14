#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuration Supabase
const supabaseUrl = 'https://aorroydfjsrygmosnzrl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcyNzQ3MCwiZXhwIjoyMDczMzAzNDcwfQ.q99nRT2xxk8QLbjX10UfnqCsW95wV4h45AYqYxbjRjY'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🚀 Début application migration séquences PO...\n')

// SQL de migration
const migrationSQL = `
-- =============================================
-- MIGRATION: Séquences PostgreSQL Thread-Safe PO
-- =============================================

-- 1. Créer séquence pour Purchase Orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_sequences WHERE sequencename = 'purchase_orders_sequence'
  ) THEN
    CREATE SEQUENCE purchase_orders_sequence
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;

    RAISE NOTICE '✅ Séquence purchase_orders_sequence créée';
  ELSE
    RAISE NOTICE '⚠️ Séquence purchase_orders_sequence existe déjà';
  END IF;
END $$;

-- 2. Créer fonction génération numéro PO
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  po_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  sequence_num := nextval('purchase_orders_sequence');
  po_number := 'PO-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
  RETURN po_number;
END;
$$;

-- 3. Créer fonction reset séquence
CREATE OR REPLACE FUNCTION reset_po_sequence_to_max()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_sequence INTEGER;
  new_start INTEGER;
BEGIN
  -- Trouver le numéro max dans les commandes existantes
  SELECT COALESCE(MAX(
    CASE WHEN po_number ~ '^PO-[0-9]{4}-[0-9]+$'
    THEN CAST(SUBSTRING(po_number FROM '[0-9]+$') AS INTEGER)
    ELSE 0 END
  ), 0) INTO max_sequence
  FROM purchase_orders;

  -- Définir la séquence à max + 1
  new_start := max_sequence + 1;
  PERFORM setval('purchase_orders_sequence', new_start, false);

  RETURN new_start;
END;
$$;

-- 4. Permissions
GRANT USAGE, SELECT ON SEQUENCE purchase_orders_sequence TO authenticated;
GRANT EXECUTE ON FUNCTION generate_po_number() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_po_sequence_to_max() TO authenticated;

-- 5. Log
DO $$
BEGIN
  RAISE NOTICE '✅ Fonctions generate_po_number() et reset_po_sequence_to_max() créées';
  RAISE NOTICE '✅ Permissions accordées';
END $$;
`

async function applyMigration() {
  try {
    console.log('📝 Exécution du SQL de migration...\n')

    // Exécuter le SQL via une requête RPC personnalisée
    // Note: Supabase ne permet pas d'exécuter directement du DDL via l'API
    // Nous devons utiliser une approche différente

    // Méthode alternative: exécuter chaque partie séparément

    // Partie 1: Vérifier et créer la séquence via la fonction reset
    console.log('1️⃣ Création fonction reset_po_sequence_to_max...')

    const { data: existingOrders, error: ordersError } = await supabase
      .from('purchase_orders')
      .select('po_number')
      .order('created_at', { ascending: false })
      .limit(10)

    if (ordersError) {
      console.error('❌ Erreur lecture commandes:', ordersError)
      throw ordersError
    }

    console.log(`📊 Commandes existantes trouvées: ${existingOrders.length}`)
    if (existingOrders.length > 0) {
      console.log(`   Dernières: ${existingOrders.map(o => o.po_number).join(', ')}`)
    }

    // Essayer d'appeler reset_po_sequence_to_max() pour voir si elle existe
    console.log('\n2️⃣ Test existence fonction reset_po_sequence_to_max...')
    const { data: resetTest, error: resetTestError } = await supabase
      .rpc('reset_po_sequence_to_max')

    if (resetTestError) {
      if (resetTestError.code === 'PGRST202') {
        console.log('⚠️  Fonction n\'existe pas encore - migration complète requise')
        console.log('\n❌ IMPOSSIBLE d\'appliquer migration via script Node.js')
        console.log('📋 Raison: CREATE SEQUENCE et CREATE FUNCTION nécessitent privilèges admin')
        console.log('\n✅ SOLUTION: Appliquer manuellement via Supabase Studio')
        console.log('📁 Guide: docs/guides/START-HERE-MIGRATION-PO-SEQUENCES.md')
        process.exit(1)
      } else {
        console.error('❌ Erreur inattendue:', resetTestError)
        throw resetTestError
      }
    }

    console.log(`✅ Fonction existe déjà! Séquence réinitialisée à: ${resetTest}`)

    // Tester génération
    console.log('\n3️⃣ Test génération numéro...')
    const { data: testNumber, error: testError } = await supabase
      .rpc('generate_po_number')

    if (testError) {
      console.error('❌ Erreur génération:', testError)
      throw testError
    }

    console.log(`✅ Prochain numéro PO: ${testNumber}`)

    console.log('\n🎉 Migration déjà appliquée avec succès!')
    console.log(`📊 Prochain numéro de commande: ${testNumber}`)

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'application de la migration:', error)
    process.exit(1)
  }
}

// Exécution
applyMigration()
