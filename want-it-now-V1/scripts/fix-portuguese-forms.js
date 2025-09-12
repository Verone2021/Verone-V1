#!/usr/bin/env node

/**
 * Script de correction rapide pour les formes juridiques portugaises
 * Ajoute LDA, SA_PT, SL à l'ENUM forme_juridique_enum via Supabase client
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.error('Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixPortugueseForms() {
  console.log('🔧 Correction des formes juridiques portugaises...')
  
  try {
    // Exécuter la migration SQL directement
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        BEGIN;
        
        -- Ajouter les valeurs manquantes à l'ENUM
        DO $$
        BEGIN
          -- Ajouter LDA si pas déjà présent
          IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LDA' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'forme_juridique_enum')) THEN
            ALTER TYPE forme_juridique_enum ADD VALUE 'LDA';
          END IF;
          
          -- Ajouter SA_PT si pas déjà présent  
          IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SA_PT' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'forme_juridique_enum')) THEN
            ALTER TYPE forme_juridique_enum ADD VALUE 'SA_PT';
          END IF;
          
          -- Ajouter SL si pas déjà présent
          IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SL' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'forme_juridique_enum')) THEN
            ALTER TYPE forme_juridique_enum ADD VALUE 'SL';
          END IF;
          
          -- Ajouter SU si pas déjà présent
          IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SU' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'forme_juridique_enum')) THEN
            ALTER TYPE forme_juridique_enum ADD VALUE 'SU';
          END IF;
          
          RAISE NOTICE '✅ Formes juridiques portugaises ajoutées avec succès !';
        END $$;
        
        COMMIT;
      `
    })

    if (error) {
      console.error('❌ Erreur lors de l\'exécution SQL:', error)
      return false
    }

    console.log('✅ Formes juridiques portugaises ajoutées avec succès !')
    console.log('🇵🇹 LDA, SA_PT, SL, SU maintenant acceptés par la base de données')
    console.log('🚀 Vous pouvez maintenant sauvegarder JARDIM PRÓSPERO LDA')
    
    return true
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    return false
  }
}

// Alternative : Mettre à jour directement via table
async function alternativeUpdate() {
  console.log('🔄 Tentative de méthode alternative...')
  
  try {
    // Vérifier si nous pouvons lire les types existants
    const { data: currentTypes, error: readError } = await supabase
      .from('pg_enum')
      .select('enumlabel')
      .join('pg_type', 'pg_enum.enumtypid', 'pg_type.oid')
      .eq('pg_type.typname', 'forme_juridique_enum')
      
    if (readError) {
      console.error('❌ Impossible de lire les types existants:', readError)
      return false
    }
    
    console.log('📋 Types existants:', currentTypes?.map(t => t.enumlabel))
    
    return true
    
  } catch (error) {
    console.error('❌ Erreur méthode alternative:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Script de correction des formes juridiques portugaises')
  console.log('============================================================')
  
  // Essayer la méthode principale
  const success = await fixPortugueseForms()
  
  if (!success) {
    console.log('⚠️ Méthode principale échouée, essai alternative...')
    await alternativeUpdate()
  }
  
  console.log('============================================================')
  console.log('✅ Script terminé')
}

main().catch(console.error)