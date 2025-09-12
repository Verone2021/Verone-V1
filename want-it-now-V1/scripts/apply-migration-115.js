#!/usr/bin/env node

/**
 * Script pour appliquer la migration 115 directement via l'API Supabase
 * Alternative au CLI Supabase en cas de problèmes d'authentification
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase depuis les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration115() {
  console.log('🚀 Début application migration 115...')
  
  try {
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../supabase/migrations/115_improve_proprietaire_deletion_rules.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration 115 lue:', migrationSQL.length, 'caractères')
    
    // Diviser le SQL en statements individuels (éviter les problèmes avec BEGIN/COMMIT)
    const sqlStatements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.match(/^(BEGIN|COMMIT)$/i))
    
    console.log('🔄 Application de', sqlStatements.length, 'statements SQL...')
    
    // Appliquer chaque statement individuellement
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i]
      
      // Ignorer les commentaires et statements vides
      if (statement.startsWith('--') || statement.trim() === '') {
        continue
      }
      
      console.log(`📝 Statement ${i + 1}/${sqlStatements.length}:`, statement.substring(0, 100) + '...')
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error(`❌ Erreur statement ${i + 1}:`, error)
        throw error
      }
      
      console.log(`✅ Statement ${i + 1} appliqué avec succès`)
    }
    
    console.log('🎉 Migration 115 appliquée avec succès!')
    
    // Vérifier que les fonctions existent maintenant
    await verifyRPCFunctions()
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error)
    process.exit(1)
  }
}

async function verifyRPCFunctions() {
  console.log('🔍 Vérification des fonctions RPC...')
  
  const testId = 'd0b7af99-cdb4-449c-8398-5d6774f98fb6' // ID de test depuis la page
  
  try {
    // Test can_delete_proprietaire
    const { data: canDelete, error: canDeleteError } = await supabase
      .rpc('can_delete_proprietaire', { prop_id: testId })
    
    if (canDeleteError) {
      console.error('❌ Fonction can_delete_proprietaire non trouvée:', canDeleteError)
    } else {
      console.log('✅ can_delete_proprietaire fonctionne:', canDelete)
    }
    
    // Test get_proprietaire_deletion_impact
    const { data: impact, error: impactError } = await supabase
      .rpc('get_proprietaire_deletion_impact', { prop_id: testId })
    
    if (impactError) {
      console.error('❌ Fonction get_proprietaire_deletion_impact non trouvée:', impactError)
    } else {
      console.log('✅ get_proprietaire_deletion_impact fonctionne:', impact ? 'Données reçues' : 'Pas de données')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Alternative : créer directement les fonctions les plus critiques
async function createEssentialFunctions() {
  console.log('🔧 Création des fonctions RPC essentielles...')
  
  const functions = [
    // Fonction can_delete_proprietaire
    `
    CREATE OR REPLACE FUNCTION can_delete_proprietaire(prop_id UUID)
    RETURNS BOOLEAN AS $$
    DECLARE
        has_properties BOOLEAN := FALSE;
        has_active_associates BOOLEAN := FALSE;
    BEGIN
        -- Vérifier si le propriétaire possède des propriétés
        SELECT EXISTS(
            SELECT 1 FROM propriete_proprietaires 
            WHERE proprietaire_id = prop_id
        ) INTO has_properties;
        
        -- Vérifier si le propriétaire a des associés actifs
        SELECT EXISTS(
            SELECT 1 FROM associes 
            WHERE proprietaire_id = prop_id 
            AND date_sortie IS NULL
            AND is_active = true
        ) INTO has_active_associates;
        
        -- Ne peut pas supprimer si possède des propriétés ou a des associés actifs
        RETURN NOT (has_properties OR has_active_associates);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `,
    
    // Fonction get_proprietaire_deletion_impact
    `
    CREATE OR REPLACE FUNCTION get_proprietaire_deletion_impact(prop_id UUID)
    RETURNS jsonb AS $$
    DECLARE
        proprietaire_record RECORD;
        properties_data jsonb := '[]';
        associates_data jsonb := '[]';
        result jsonb;
    BEGIN
        -- Récupérer les informations du propriétaire
        SELECT * INTO proprietaire_record
        FROM proprietaires
        WHERE id = prop_id AND is_active = true;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'error', 'Propriétaire non trouvé ou inactif',
                'can_delete', false
            );
        END IF;
        
        -- Récupérer les propriétés
        SELECT jsonb_agg(
            jsonb_build_object(
                'propriete_id', p.id,
                'propriete_nom', p.nom,
                'pourcentage', pp.pourcentage
            )
        ) INTO properties_data
        FROM propriete_proprietaires pp
        JOIN proprietes p ON pp.propriete_id = p.id
        WHERE pp.proprietaire_id = prop_id
        AND p.is_active = true;
        
        -- Récupérer les associés actifs
        IF proprietaire_record.type = 'morale' THEN
            SELECT jsonb_agg(
                jsonb_build_object(
                    'associe_id', a.id,
                    'nom', a.nom,
                    'prenom', a.prenom,
                    'nombre_parts', a.nombre_parts
                )
            ) INTO associates_data
            FROM associes a
            WHERE a.proprietaire_id = prop_id
            AND a.date_sortie IS NULL
            AND a.is_active = true;
        END IF;
        
        -- Construire le résultat
        result := jsonb_build_object(
            'proprietaire', jsonb_build_object(
                'id', proprietaire_record.id,
                'nom_complet', CASE 
                    WHEN proprietaire_record.type = 'physique' 
                    THEN CONCAT(proprietaire_record.prenom, ' ', proprietaire_record.nom)
                    ELSE proprietaire_record.nom
                END,
                'type', proprietaire_record.type
            ),
            'impact', jsonb_build_object(
                'properties_count', COALESCE(jsonb_array_length(properties_data), 0),
                'associates_count', COALESCE(jsonb_array_length(associates_data), 0),
                'contracts_count', 0,
                'properties', COALESCE(properties_data, '[]'),
                'associates', COALESCE(associates_data, '[]'),
                'contracts', '[]'
            ),
            'can_delete', can_delete_proprietaire(prop_id)
        );
        
        RETURN result;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `,
    
    // Permissions
    `GRANT EXECUTE ON FUNCTION can_delete_proprietaire(UUID) TO authenticated;`,
    `GRANT EXECUTE ON FUNCTION get_proprietaire_deletion_impact(UUID) TO authenticated;`
  ]
  
  for (let i = 0; i < functions.length; i++) {
    const func = functions[i].trim()
    console.log(`📝 Création fonction ${i + 1}/${functions.length}...`)
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: func })
      
      if (error) {
        console.error(`❌ Erreur fonction ${i + 1}:`, error)
      } else {
        console.log(`✅ Fonction ${i + 1} créée`)
      }
    } catch (error) {
      console.error(`❌ Erreur fonction ${i + 1}:`, error)
    }
  }
}

// Exécution
if (require.main === module) {
  createEssentialFunctions().then(() => {
    console.log('🎉 Fonctions RPC essentielles créées!')
    process.exit(0)
  }).catch(error => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
}

module.exports = { applyMigration115, createEssentialFunctions }