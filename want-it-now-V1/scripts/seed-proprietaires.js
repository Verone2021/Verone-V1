/**
 * Script de seed pour créer des données test dans la table proprietaires
 * Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_ACCESS_TOKEN=... node scripts/seed-proprietaires.js
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

// Données de test
const proprietairesPhysiques = [
  {
    type: 'physique',
    nom: 'Martin',
    prenom: 'Jean-Pierre',
    email: 'jp.martin@example.com',
    telephone: '06 12 34 56 78',
    date_naissance: '1975-03-15',
    lieu_naissance: 'Paris',
    nationalite: 'Française',
    adresse: '15 rue de la République',
    code_postal: '75001',
    ville: 'Paris',
    pays: 'France',
    is_brouillon: false,
    is_active: true
  },
  {
    type: 'physique',
    nom: 'Dubois',
    prenom: 'Marie-Claire',
    email: 'mc.dubois@example.com',
    telephone: '06 98 76 54 32',
    date_naissance: '1982-07-22',
    lieu_naissance: 'Lyon',
    nationalite: 'Française',
    adresse: '45 avenue des Champs',
    code_postal: '69000',
    ville: 'Lyon',
    pays: 'France',
    is_brouillon: false,
    is_active: true
  },
  {
    type: 'physique',
    nom: 'Bernard',
    prenom: 'Sophie',
    email: 'sophie.bernard@example.com',
    telephone: '07 11 22 33 44',
    date_naissance: '1990-11-08',
    lieu_naissance: 'Marseille',
    nationalite: 'Française',
    adresse: '78 boulevard de la Mer',
    code_postal: '13000',
    ville: 'Marseille',
    pays: 'France',
    is_brouillon: false,
    is_active: true
  },
  {
    type: 'physique',
    nom: 'Petit',
    prenom: 'François',
    email: 'f.petit@example.com',
    telephone: '06 55 44 33 22',
    date_naissance: '1968-05-30',
    lieu_naissance: 'Bordeaux',
    nationalite: 'Française',
    adresse: '12 place du Marché',
    code_postal: '33000',
    ville: 'Bordeaux',
    pays: 'France',
    is_brouillon: false,
    is_active: true
  },
  {
    type: 'physique',
    nom: 'Moreau',
    prenom: 'Julie',
    email: 'julie.moreau@example.com',
    telephone: '06 77 88 99 00',
    date_naissance: '1985-09-12',
    lieu_naissance: 'Nantes',
    nationalite: 'Française',
    adresse: '23 rue du Commerce',
    code_postal: '44000',
    ville: 'Nantes',
    pays: 'France',
    is_brouillon: true, // Brouillon
    is_active: true
  },
  {
    type: 'physique',
    nom: 'Garcia',
    prenom: 'Carlos',
    email: 'c.garcia@example.com',
    telephone: '06 33 22 11 00',
    date_naissance: '1978-02-18',
    lieu_naissance: 'Madrid',
    nationalite: 'Espagnole',
    adresse: '56 avenue de l\'Europe',
    code_postal: '06000',
    ville: 'Nice',
    pays: 'France',
    is_brouillon: false,
    is_active: true
  },
  {
    type: 'physique',
    nom: 'Schmidt',
    prenom: 'Hans',
    email: 'h.schmidt@example.com',
    telephone: '06 44 55 66 77',
    date_naissance: '1972-08-25',
    lieu_naissance: 'Berlin',
    nationalite: 'Allemande',
    adresse: '89 rue de Strasbourg',
    code_postal: '67000',
    ville: 'Strasbourg',
    pays: 'France',
    is_brouillon: false,
    is_active: true
  },
  {
    type: 'physique',
    nom: 'Rossi',
    prenom: 'Anna',
    email: 'anna.rossi@example.com',
    telephone: '07 88 99 00 11',
    date_naissance: '1988-12-03',
    lieu_naissance: 'Rome',
    nationalite: 'Italienne',
    adresse: '34 boulevard Victor Hugo',
    code_postal: '06500',
    ville: 'Menton',
    pays: 'France',
    is_brouillon: true, // Brouillon
    is_active: true
  }
]

const proprietairesMorales = [
  {
    type: 'morale',
    nom: 'Immobilier Prestige SARL',
    email: 'contact@immobilier-prestige.fr',
    telephone: '01 42 86 82 00',
    forme_juridique: 'SARL',
    numero_identification: 'SIRET 123 456 789 00012',
    capital_social: 100000,
    nombre_parts_total: 1000,
    adresse: '50 avenue des Champs-Élysées',
    code_postal: '75008',
    ville: 'Paris',
    pays: 'France',
    is_brouillon: false,
    is_active: true
  },
  {
    type: 'morale',
    nom: 'Investissements Plus SAS',
    email: 'info@investplus.fr',
    telephone: '04 78 42 55 66',
    forme_juridique: 'SAS',
    numero_identification: 'SIRET 987 654 321 00034',
    capital_social: 250000,
    nombre_parts_total: 2500,
    adresse: '120 rue de la République',
    code_postal: '69002',
    ville: 'Lyon',
    pays: 'France',
    is_brouillon: false,
    is_active: true
  },
  {
    type: 'morale',
    nom: 'Patrimoine & Associés',
    email: 'contact@patrimoine-associes.fr',
    telephone: '05 56 91 22 33',
    forme_juridique: 'SCI',
    numero_identification: 'SIRET 456 789 123 00056',
    capital_social: 50000,
    nombre_parts_total: 500,
    adresse: '25 quai des Chartrons',
    code_postal: '33000',
    ville: 'Bordeaux',
    pays: 'France',
    is_brouillon: false,
    is_active: true
  },
  {
    type: 'morale',
    nom: 'Global Properties SA',
    email: 'info@global-properties.com',
    telephone: '01 55 27 39 00',
    forme_juridique: 'SA',
    numero_identification: 'SIRET 789 123 456 00078',
    capital_social: 500000,
    nombre_parts_total: 5000,
    adresse: '100 boulevard Haussmann',
    code_postal: '75009',
    ville: 'Paris',
    pays: 'France',
    is_brouillon: true, // Brouillon
    is_active: true
  },
  {
    type: 'morale',
    nom: 'Riviera Invest SARL',
    email: 'contact@riviera-invest.fr',
    telephone: '04 93 16 20 00',
    forme_juridique: 'SARL',
    numero_identification: 'SIRET 321 654 987 00090',
    capital_social: 75000,
    nombre_parts_total: 750,
    adresse: '15 promenade des Anglais',
    code_postal: '06000',
    ville: 'Nice',
    pays: 'France',
    is_brouillon: false,
    is_active: true
  }
]

async function seedProprietaires() {
  console.log('🚀 Début du seed des propriétaires...')
  
  try {
    // 1. Insérer les propriétaires physiques (sans organisation_id)
    console.log('\n📝 Insertion des personnes physiques...')
    for (const proprietaire of proprietairesPhysiques) {
      const { data, error } = await supabase
        .from('proprietaires')
        .insert(proprietaire)
        .select()
      
      if (error) {
        console.error(`❌ Erreur pour ${proprietaire.nom} ${proprietaire.prenom}:`, error.message)
      } else {
        console.log(`✅ ${proprietaire.nom} ${proprietaire.prenom} créé(e)`)
      }
    }
    
    // 2. Insérer les propriétaires morales (sans organisation_id)
    console.log('\n🏢 Insertion des personnes morales...')
    const proprietairesMoralesIds = []
    
    for (const proprietaire of proprietairesMorales) {
      const { data, error } = await supabase
        .from('proprietaires')
        .insert(proprietaire)
        .select()
      
      if (error) {
        console.error(`❌ Erreur pour ${proprietaire.nom}:`, error.message)
      } else {
        console.log(`✅ ${proprietaire.nom} créé`)
        if (data && data[0]) {
          proprietairesMoralesIds.push(data[0].id)
        }
      }
    }
    
    // 3. Ajouter des associés pour les 2 premières personnes morales
    if (proprietairesMoralesIds.length >= 2) {
      console.log('\n👥 Ajout des associés pour les personnes morales...')
      
      // Associés pour la première personne morale (sans organisation_id)
      const associes1 = [
        {
          proprietaire_id: proprietairesMoralesIds[0],
          type: 'physique',
          nom: 'Durand',
          prenom: 'Michel',
          date_naissance: '1970-03-20',
          lieu_naissance: 'Paris',
          nationalite: 'Française',
          nombre_parts: 600,
          ordre_affichage: 0
        },
        {
          proprietaire_id: proprietairesMoralesIds[0],
          type: 'physique',
          nom: 'Lefebvre',
          prenom: 'Claire',
          date_naissance: '1975-08-15',
          lieu_naissance: 'Lyon',
          nationalite: 'Française',
          nombre_parts: 400,
          ordre_affichage: 1
        }
      ]
      
      // Associés pour la deuxième personne morale (sans organisation_id)
      const associes2 = [
        {
          proprietaire_id: proprietairesMoralesIds[1],
          type: 'physique',
          nom: 'Thomas',
          prenom: 'Philippe',
          date_naissance: '1965-12-10',
          lieu_naissance: 'Marseille',
          nationalite: 'Française',
          nombre_parts: 1500,
          ordre_affichage: 0
        },
        {
          proprietaire_id: proprietairesMoralesIds[1],
          type: 'morale',
          nom: 'Holding Financière SA',
          prenom: null,
          forme_juridique: 'SA',
          numero_identification: 'SIRET 555 444 333 00022',
          nombre_parts: 1000,
          ordre_affichage: 1
        }
      ]
      
      // Insérer les associés
      for (const associe of [...associes1, ...associes2]) {
        const { error } = await supabase
          .from('associes')
          .insert(associe)
        
        if (error) {
          console.error(`❌ Erreur ajout associé ${associe.nom}:`, error.message)
        } else {
          console.log(`✅ Associé ${associe.nom} ${associe.prenom || ''} ajouté`)
        }
      }
    }
    
    // 5. Afficher le résumé
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
    
    const { count: brouillonCount } = await supabase
      .from('proprietaires')
      .select('*', { count: 'exact', head: true })
      .eq('is_brouillon', true)
    
    console.log('\n📊 Résumé:')
    console.log(`Total propriétaires: ${totalCount}`)
    console.log(`Personnes physiques: ${physiqueCount}`)
    console.log(`Personnes morales: ${moraleCount}`)
    console.log(`Brouillons: ${brouillonCount}`)
    
    console.log('\n✅ Seed terminé avec succès!')
    
  } catch (error) {
    console.error('💥 Erreur globale:', error)
  }
}

// Exécuter le seed
seedProprietaires()