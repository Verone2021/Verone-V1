/**
 * Script pour créer 2 propriétaires test seulement
 * Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_ACCESS_TOKEN=... node seed-2-proprietaires-test.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_ACCESS_TOKEN

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.log('Requis: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_ACCESS_TOKEN')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seed2ProprietairesTest() {
  console.log('🚀 Création de 2 propriétaires test...')
  
  try {
    // 1. Personne morale - SCI Immobilier Test
    console.log('\n🏢 Création personne morale - SCI...')
    
    const personneMorale = {
      type: 'morale',
      nom: 'SCI Immobilier Test',
      email: 'contact@sci-test.fr',
      telephone: '01 23 45 67 89',
      forme_juridique: 'SCI',
      numero_identification: 'SIRET 123 456 789 00001',
      capital_social: 50000,
      nombre_parts_total: 500,
      adresse: '10 rue de Test',
      code_postal: '75001',
      ville: 'Paris',
      pays: 'FR',
      is_brouillon: false,
      is_active: true
    }
    
    const { data: sciData, error: sciError } = await supabase
      .from('proprietaires')
      .insert(personneMorale)
      .select()
    
    if (sciError) {
      console.error('❌ Erreur création SCI:', sciError.message)
      return
    }
    
    console.log('✅ SCI Immobilier Test créée')
    const sciId = sciData[0].id
    
    // Associés pour la SCI
    console.log('\n👥 Ajout des associés...')
    
    const associes = [
      {
        proprietaire_id: sciId,
        type: 'physique',
        nom: 'Durand',
        prenom: 'Michel',
        date_naissance: '1970-03-20',
        lieu_naissance: 'Paris',
        nationalite: 'Française',
        nombre_parts: 300,
        ordre_affichage: 0
      },
      {
        proprietaire_id: sciId,
        type: 'physique',
        nom: 'Lefebvre',
        prenom: 'Claire',
        date_naissance: '1975-08-15',
        lieu_naissance: 'Lyon',
        nationalite: 'Française',
        nombre_parts: 200,
        ordre_affichage: 1
      }
    ]
    
    for (const associe of associes) {
      const { error } = await supabase
        .from('associes')
        .insert(associe)
      
      if (error) {
        console.error(`❌ Erreur ajout associé ${associe.nom}:`, error.message)
      } else {
        console.log(`✅ Associé ${associe.nom} ${associe.prenom} ajouté (${associe.nombre_parts} parts)`)
      }
    }
    
    // 2. Personne physique
    console.log('\n👤 Création personne physique...')
    
    const personnePhysique = {
      type: 'physique',
      nom: 'Martin',
      prenom: 'Jean-Pierre',
      email: 'jp.martin@test.com',
      telephone: '06 12 34 56 78',
      date_naissance: '1975-03-15',
      lieu_naissance: 'Paris',
      nationalite: 'Française',
      adresse: '25 avenue Test',
      code_postal: '75002',
      ville: 'Paris',
      pays: 'FR',
      is_brouillon: false,
      is_active: true
    }
    
    const { data: physiqueData, error: physiqueError } = await supabase
      .from('proprietaires')
      .insert(personnePhysique)
      .select()
    
    if (physiqueError) {
      console.error('❌ Erreur création personne physique:', physiqueError.message)
      return
    }
    
    console.log('✅ Jean-Pierre Martin créé')
    
    // 3. Vérification finale
    console.log('\n📊 Vérification finale:')
    
    const { count: totalCount } = await supabase
      .from('proprietaires')
      .select('*', { count: 'exact', head: true })
    
    const { count: physiqueCount } = await supabase
      .from('proprietaires')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'physique')
    
    const { count: moraleCount } = await supabase
      .from('proprietaires')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'morale')
    
    const { count: associesCount } = await supabase
      .from('associes')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   Total propriétaires: ${totalCount}`)
    console.log(`   Personnes physiques: ${physiqueCount}`)
    console.log(`   Personnes morales: ${moraleCount}`)
    console.log(`   Associés: ${associesCount}`)
    
    if (totalCount === 2 && physiqueCount === 1 && moraleCount === 1 && associesCount === 2) {
      console.log('\n🎉 CRÉATION RÉUSSIE!')
      console.log('✅ 2 propriétaires test créés parfaitement')
      console.log('✅ 1 SCI avec 2 associés (500 parts totales)')
      console.log('✅ 1 personne physique')
    } else {
      console.log('\n⚠️ Problème dans la création - vérifier les données')
    }
    
  } catch (error) {
    console.error('💥 Erreur globale:', error)
  }
}

// Exécuter la création
seed2ProprietairesTest()