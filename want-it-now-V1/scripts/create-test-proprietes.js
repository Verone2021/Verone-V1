const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ACCESS_TOKEN,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createTestData() {
  console.log('🎯 Création de données de test pour les propriétés...\n');
  
  try {
    // 1. Récupérer une organisation active
    const { data: orgs } = await supabase
      .from('organisations')
      .select('id, nom, pays')
      .eq('is_active', true)
      .limit(1);
    
    if (!orgs || orgs.length === 0) {
      console.log('❌ Aucune organisation active trouvée');
      return;
    }
    
    const org = orgs[0];
    console.log(`✅ Organisation: ${org.nom} (${org.pays})`);
    
    // 2. Créer ou récupérer des propriétaires
    const { data: proprietaires } = await supabase
      .from('proprietaires')
      .select('id, nom, prenom, type')
      .limit(2);
    
    let proprietaireIds = proprietaires?.map(p => p.id) || [];
    
    if (proprietaireIds.length === 0) {
      console.log('📝 Création de propriétaires de test...');
      
      // Créer un propriétaire physique
      const { data: prop1 } = await supabase
        .from('proprietaires')
        .insert({
          type: 'physique',
          nom: 'Martin',
          prenom: 'Jean',
          email: 'jean.martin@example.com',
          telephone: '06 12 34 56 78',
          is_active: true
        })
        .select()
        .single();
      
      // Créer un propriétaire morale
      const { data: prop2 } = await supabase
        .from('proprietaires')
        .insert({
          type: 'morale',
          nom: 'Invest Immo SARL',
          email: 'contact@invest-immo.fr',
          forme_juridique: 'SARL',
          capital_social: 50000,
          is_active: true
        })
        .select()
        .single();
      
      if (prop1) proprietaireIds.push(prop1.id);
      if (prop2) proprietaireIds.push(prop2.id);
      
      console.log('✅ Propriétaires créés');
    }
    
    // 3. Créer plusieurs propriétés avec différents statuts
    const proprietes = [
      {
        organisation_id: org.id,
        nom: 'Appartement Centre Ville',
        type: 'appartement',
        statut: 'louee',
        description: 'Bel appartement T3 en centre-ville, proche commerces et transports',
        adresse_ligne1: '15 Rue de la République',
        code_postal: '75001',
        ville: 'Paris',
        pays: org.pays,
        surface_habitable: 75,
        nombre_pieces: 3,
        nombre_chambres: 2,
        nombre_salles_bain: 1,
        etage: 3,
        annee_construction: 1985,
        prix_acquisition: 250000,
        loyer_mensuel: 1200,
        charges_mensuelles: 150,
        taxe_fonciere: 1500,
        a_ascenseur: true,
        a_parking: true,
        nombre_places_parking: 1,
        a_balcon: true,
        surface_balcon: 8,
        dpe_classe: 'C',
        dpe_valeur: 120,
        ges_classe: 'D',
        ges_valeur: 25
      },
      {
        organisation_id: org.id,
        nom: 'Maison Familiale Banlieue',
        type: 'maison',
        statut: 'disponible',
        description: 'Grande maison familiale avec jardin, idéale pour famille',
        adresse_ligne1: '45 Avenue des Fleurs',
        code_postal: '92100',
        ville: 'Boulogne-Billancourt',
        pays: org.pays,
        surface_habitable: 120,
        surface_terrain: 450,
        nombre_pieces: 5,
        nombre_chambres: 4,
        nombre_salles_bain: 2,
        nombre_etages: 2,
        annee_construction: 1998,
        prix_acquisition: 450000,
        loyer_mensuel: 2200,
        charges_mensuelles: 200,
        taxe_fonciere: 2800,
        a_parking: true,
        nombre_places_parking: 2,
        a_jardin: true,
        surface_jardin: 350,
        a_terrasse: true,
        surface_terrasse: 25,
        dpe_classe: 'B',
        dpe_valeur: 85,
        ges_classe: 'B',
        ges_valeur: 12
      },
      {
        organisation_id: org.id,
        nom: 'Studio Étudiant',
        type: 'appartement',
        statut: 'louee',
        description: 'Studio meublé proche université',
        adresse_ligne1: '8 Rue des Étudiants',
        code_postal: '69003',
        ville: 'Lyon',
        pays: org.pays,
        surface_habitable: 25,
        nombre_pieces: 1,
        nombre_chambres: 0,
        nombre_salles_bain: 1,
        etage: 4,
        annee_construction: 2010,
        prix_acquisition: 95000,
        loyer_mensuel: 550,
        charges_mensuelles: 50,
        taxe_fonciere: 450,
        a_ascenseur: true,
        dpe_classe: 'A',
        dpe_valeur: 45,
        ges_classe: 'A',
        ges_valeur: 5
      },
      {
        organisation_id: org.id,
        nom: 'Immeuble de Rapport',
        type: 'immeuble',
        statut: 'achetee',
        description: 'Immeuble de 6 appartements, bon rendement locatif',
        adresse_ligne1: '22 Boulevard Victor Hugo',
        code_postal: '13001',
        ville: 'Marseille',
        pays: org.pays,
        surface_habitable: 420,
        nombre_pieces: 24,
        nombre_etages: 4,
        annee_construction: 1975,
        prix_acquisition: 850000,
        valeur_actuelle: 950000,
        charges_mensuelles: 800,
        taxe_fonciere: 6500,
        a_unites: true,
        nombre_unites: 6,
        dpe_classe: 'D',
        dpe_valeur: 180,
        ges_classe: 'E',
        ges_valeur: 40
      },
      {
        organisation_id: org.id,
        nom: 'Local Commercial',
        type: 'commerce',
        statut: 'louee',
        description: 'Local commercial bien situé, rue passante',
        adresse_ligne1: '10 Rue du Commerce',
        code_postal: '33000',
        ville: 'Bordeaux',
        pays: org.pays,
        surface_habitable: 85,
        annee_construction: 1990,
        prix_acquisition: 180000,
        loyer_mensuel: 1500,
        charges_mensuelles: 100,
        taxe_fonciere: 2200,
        dpe_classe: 'E',
        dpe_valeur: 220,
        ges_classe: 'F',
        ges_valeur: 55
      },
      {
        organisation_id: org.id,
        nom: 'Terrain à Bâtir',
        type: 'terrain',
        statut: 'evaluation',
        description: 'Terrain constructible, viabilisé, belle exposition',
        adresse_ligne1: 'Chemin des Vignes',
        code_postal: '06000',
        ville: 'Nice',
        pays: org.pays,
        surface_terrain: 800,
        prix_acquisition: 120000,
        valeur_actuelle: 140000,
        notes_internes: 'Potentiel pour villa ou division en 2 lots'
      },
      {
        organisation_id: org.id,
        nom: 'Appartement en Négociation',
        type: 'appartement',
        statut: 'negociation',
        description: 'T4 avec vue mer, négociation en cours',
        adresse_ligne1: '50 Promenade des Anglais',
        code_postal: '06200',
        ville: 'Nice',
        pays: org.pays,
        surface_habitable: 95,
        nombre_pieces: 4,
        nombre_chambres: 3,
        nombre_salles_bain: 2,
        etage: 6,
        annee_construction: 2005,
        prix_acquisition: 580000,
        a_ascenseur: true,
        a_parking: true,
        a_terrasse: true,
        surface_terrasse: 20,
        notes_internes: 'Vendeur pressé, possibilité de négocier -10%'
      },
      {
        organisation_id: org.id,
        nom: 'Projet Sourcing Centre',
        type: 'appartement',
        statut: 'sourcing',
        description: 'Recherche T2 secteur gare pour investissement locatif',
        adresse_ligne1: 'Secteur Gare',
        code_postal: '31000',
        ville: 'Toulouse',
        pays: org.pays,
        surface_habitable: 45,
        nombre_pieces: 2,
        nombre_chambres: 1,
        prix_acquisition: 150000,
        notes_internes: 'Budget max 160k, recherche en cours avec 3 agences'
      }
    ];
    
    console.log('\n📦 Création des propriétés...');
    
    for (const prop of proprietes) {
      const { data, error } = await supabase
        .from('proprietes')
        .insert(prop)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Erreur création ${prop.nom}:`, error.message);
      } else {
        console.log(`✅ ${prop.nom} (${prop.statut})`);
        
        // Ajouter des quotités pour certaines propriétés
        if (proprietaireIds.length > 0 && Math.random() > 0.3) {
          const nbProprietaires = Math.min(Math.floor(Math.random() * 2) + 1, proprietaireIds.length);
          let remainingPercent = 100;
          
          for (let i = 0; i < nbProprietaires; i++) {
            const isLast = i === nbProprietaires - 1;
            const percent = isLast ? remainingPercent : Math.floor(Math.random() * remainingPercent * 0.7);
            
            await supabase
              .from('propriete_proprietaires')
              .insert({
                propriete_id: data.id,
                proprietaire_id: proprietaireIds[i],
                pourcentage: percent,
                date_acquisition: new Date().toISOString()
              });
            
            remainingPercent -= percent;
          }
        }
        
        // Créer des unités pour l'immeuble
        if (prop.a_unites && data.id) {
          console.log('   📐 Création des unités...');
          const unites = [
            { numero: 'A1', type: 't2', etage: 0, surface_habitable: 55, nombre_pieces: 2, nombre_chambres: 1, est_louee: true, loyer_mensuel: 650 },
            { numero: 'A2', type: 't3', etage: 0, surface_habitable: 75, nombre_pieces: 3, nombre_chambres: 2, est_louee: true, loyer_mensuel: 850 },
            { numero: 'B1', type: 't2', etage: 1, surface_habitable: 60, nombre_pieces: 2, nombre_chambres: 1, est_louee: true, loyer_mensuel: 700 },
            { numero: 'B2', type: 'studio', etage: 1, surface_habitable: 30, nombre_pieces: 1, nombre_chambres: 0, est_louee: false, disponible: true },
            { numero: 'C1', type: 't3', etage: 2, surface_habitable: 80, nombre_pieces: 3, nombre_chambres: 2, est_louee: true, loyer_mensuel: 950 },
            { numero: 'C2', type: 't4', etage: 2, surface_habitable: 95, nombre_pieces: 4, nombre_chambres: 3, est_louee: true, loyer_mensuel: 1100 }
          ];
          
          for (const unite of unites) {
            await supabase
              .from('unites')
              .insert({
                ...unite,
                propriete_id: data.id,
                charges_mensuelles: unite.loyer_mensuel * 0.1
              });
          }
          console.log('   ✅ 6 unités créées');
        }
      }
    }
    
    // 4. Résumé
    console.log('\n📊 RÉSUMÉ DES DONNÉES CRÉÉES');
    console.log('================================');
    
    const { count: propCount } = await supabase
      .from('proprietes')
      .select('*', { count: 'exact', head: true });
    
    const { count: uniteCount } = await supabase
      .from('unites')
      .select('*', { count: 'exact', head: true });
    
    const { data: stats } = await supabase
      .from('proprietes_stats_v')
      .select('*')
      .eq('organisation_id', org.id)
      .single();
    
    console.log(`✅ Total propriétés: ${propCount}`);
    console.log(`✅ Total unités: ${uniteCount}`);
    
    if (stats) {
      console.log(`\n📈 Statistiques organisation ${org.nom}:`);
      console.log(`   - Propriétés louées: ${stats.proprietes_louees || 0}`);
      console.log(`   - Propriétés disponibles: ${stats.proprietes_disponibles || 0}`);
      console.log(`   - En négociation: ${stats.proprietes_negociation || 0}`);
      console.log(`   - En sourcing: ${stats.proprietes_sourcing || 0}`);
      if (stats.revenus_mensuels) {
        console.log(`   - Revenus mensuels: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.revenus_mensuels)}`);
      }
      if (stats.rendement_moyen) {
        console.log(`   - Rendement moyen: ${parseFloat(stats.rendement_moyen).toFixed(2)}%`);
      }
    }
    
    console.log('\n🎉 Données de test créées avec succès !');
    
  } catch (error) {
    console.error('💥 Erreur:', error);
  }
}

createTestData();