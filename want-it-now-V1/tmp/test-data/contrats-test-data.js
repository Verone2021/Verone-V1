"use strict";
/**
 * Données de test réalistes pour le système de contrats Want It Now
 * Basées sur les règles métier françaises et les contraintes de la plateforme
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_HELPERS = exports.TEST_PERFORMANCE_DATA = exports.TEST_EDGE_CASES = exports.TEST_CONTRAT_SCENARIOS = exports.TEST_PROPRIETAIRES = exports.TEST_UNITES = exports.TEST_PROPRIETES = void 0;
// Propriétés de test - cas d'usage variés
exports.TEST_PROPRIETES = [
    // Cas 1: Villa individuelle (pas d'unités) - Nice
    {
        id: 'prop_villa_nice_001',
        nom: 'Villa Les Palmiers Nice',
        adresse_complete: '15 Avenue des Palmiers, 06000 Nice, France',
        type: 'villa',
        superficie_m2: 180,
        nb_pieces: 6,
        a_unites: false,
        organisation_id: 'org_wantitnow_001'
    },
    // Cas 2: Immeuble avec unités - Paris 16ème
    {
        id: 'prop_immeuble_paris_001',
        nom: 'Résidence Trocadéro',
        adresse_complete: '42 Avenue Kléber, 75016 Paris, France',
        type: 'immeuble',
        superficie_m2: 450,
        nb_pieces: 0, // Divisé en unités
        a_unites: true,
        organisation_id: 'org_wantitnow_001'
    },
    // Cas 3: Appartement individuel - Lyon
    {
        id: 'prop_appart_lyon_001',
        nom: 'Appartement Presqu\'île Lyon',
        adresse_complete: '8 Rue de la République, 69002 Lyon, France',
        type: 'appartement',
        superficie_m2: 85,
        nb_pieces: 3,
        a_unites: false,
        organisation_id: 'org_wantitnow_001'
    },
    // Cas 4: Chalet montagne - Chamonix
    {
        id: 'prop_chalet_chamonix_001',
        nom: 'Chalet Mont-Blanc Vue',
        adresse_complete: '25 Route des Pècles, 74400 Chamonix, France',
        type: 'chalet',
        superficie_m2: 120,
        nb_pieces: 5,
        a_unites: false,
        organisation_id: 'org_wantitnow_001'
    },
    // Cas 5: Maison avec dépendances (unités) - Bordeaux
    {
        id: 'prop_maison_bordeaux_001',
        nom: 'Maison de Maître Bordeaux',
        adresse_complete: '12 Cours de l\'Intendance, 33000 Bordeaux, France',
        type: 'maison',
        superficie_m2: 300,
        nb_pieces: 0, // Maison principale + studio indépendant
        a_unites: true,
        organisation_id: 'org_wantitnow_001'
    }
];
// Unités de test pour les propriétés divisées
exports.TEST_UNITES = [
    // Unités Résidence Trocadéro Paris
    {
        id: 'unit_paris_trocadero_01',
        propriete_id: 'prop_immeuble_paris_001',
        nom: 'Studio Étoile',
        numero: '01',
        type: 'studio',
        superficie_m2: 35,
        nb_pieces: 1,
        description: 'Studio moderne avec kitchenette équipée, vue Trocadéro'
    },
    {
        id: 'unit_paris_trocadero_02',
        propriete_id: 'prop_immeuble_paris_001',
        nom: 'Appartement Hausmanien',
        numero: '02',
        type: 'appartement',
        superficie_m2: 75,
        nb_pieces: 3,
        description: '2 chambres, salon, cuisine équipée, salle de bain avec baignoire'
    },
    {
        id: 'unit_paris_trocadero_03',
        propriete_id: 'prop_immeuble_paris_001',
        nom: 'Duplex Prestige',
        numero: '03',
        type: 'duplex',
        superficie_m2: 95,
        nb_pieces: 4,
        description: 'Duplex avec terrasse, 2 chambres, salon cathédrale'
    },
    // Unités Maison Bordeaux
    {
        id: 'unit_bordeaux_maison_principal',
        propriete_id: 'prop_maison_bordeaux_001',
        nom: 'Maison Principale',
        numero: 'A',
        type: 'maison',
        superficie_m2: 220,
        nb_pieces: 6,
        description: 'Maison de maître avec jardin, salon, salle à manger, 3 chambres'
    },
    {
        id: 'unit_bordeaux_studio_independant',
        propriete_id: 'prop_maison_bordeaux_001',
        nom: 'Studio Indépendant',
        numero: 'B',
        type: 'studio',
        superficie_m2: 25,
        nb_pieces: 1,
        description: 'Studio indépendant dans dépendance, entrée séparée'
    }
];
// Propriétaires de test - cas d'usage variés
exports.TEST_PROPRIETAIRES = [
    // Cas 1: Particulier français
    {
        id: 'proprio_jean_dupont',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@gmail.com',
        telephone: '+33 6 12 34 56 78',
        type: 'personne_physique',
        adresse: '15 Rue de la Paix, 75001 Paris, France'
    },
    // Cas 2: SCI familiale
    {
        id: 'proprio_sci_famille_martin',
        nom: 'SCI Famille Martin',
        prenom: '',
        email: 'contact@sci-martin.fr',
        telephone: '+33 1 42 33 44 55',
        type: 'personne_morale',
        siren_siret: '123456789',
        adresse: '8 Boulevard Saint-Germain, 75005 Paris, France'
    },
    // Cas 3: Particulier investisseur
    {
        id: 'proprio_marie_durand',
        nom: 'Durand',
        prenom: 'Marie',
        email: 'marie.durand@outlook.fr',
        telephone: '+33 6 87 65 43 21',
        type: 'personne_physique',
        adresse: '42 Avenue de la Liberté, 69003 Lyon, France'
    },
    // Cas 4: SARL immobilière
    {
        id: 'proprio_sarl_invest_sud',
        nom: 'SARL Invest Sud',
        prenom: '',
        email: 'direction@invest-sud.com',
        telephone: '+33 4 91 23 45 67',
        type: 'personne_morale',
        siren_siret: '987654321',
        adresse: '25 Cours Mirabeau, 13100 Aix-en-Provence, France'
    }
];
// Scenarios de contrats réalistes
exports.TEST_CONTRAT_SCENARIOS = {
    // Scénario 1: Contrat fixe - Villa Nice
    villa_nice_fixe: {
        propriete_id: 'prop_villa_nice_001',
        unite_id: null,
        type_contrat: 'fixe',
        date_debut: '2025-03-01',
        date_fin: '2026-02-28',
        meuble: true,
        autorisation_sous_location: true, // Obligatoire Want It Now
        besoin_renovation: false,
        commission_pourcentage: '12', // Négociable pour fixe
        usage_proprietaire_jours_max: '45', // < 60 jours règle
        // Financier fixe
        loyer_mensuel_ht: '2500.00',
        charges_mensuelles: '200.00',
        depot_garantie: '2500.00',
        jour_paiement_loyer: '5',
        // Bailleur
        bailleur_nom: 'Jean Dupont',
        bailleur_email: 'jean.dupont@gmail.com',
        bailleur_telephone: '+33 6 12 34 56 78',
        // Assurance
        attestation_assurance: true,
        nom_assureur: 'AXA France',
        numero_police: 'AXA-PNO-2025-001234',
        assurance_pertes_exploitation: true,
        protection_juridique: true,
        // Contact urgence
        contact_urgence_nom: 'Marie Dupont',
        contact_urgence_telephone: '+33 6 98 76 54 32',
        contact_urgence_email: 'marie.dupont@gmail.com',
        // Spécifique Want It Now
        type_activite_sous_location: 'courte_duree',
        conditions_sous_location: 'Durée minimum 3 nuits, maximum 8 personnes',
        duree_contrat_1an: true
    },
    // Scénario 2: Contrat variable - Studio Paris
    studio_paris_variable: {
        propriete_id: null,
        unite_id: 'unit_paris_trocadero_01',
        type_contrat: 'variable',
        date_debut: '2025-02-01',
        date_fin: '2026-01-31',
        meuble: true,
        autorisation_sous_location: true,
        besoin_renovation: false,
        commission_pourcentage: '10', // Fixe 10% pour variable
        usage_proprietaire_jours_max: '30',
        // Financier variable
        estimation_revenus_mensuels: '3200.00',
        methode_calcul_revenus: 'revenus_nets',
        dates_paiement: 'Mensuel le 10',
        frais_abonnement_internet: '45.00',
        frais_equipements_domotique: '25.00',
        // Bailleur SCI
        bailleur_nom: 'SCI Famille Martin',
        bailleur_email: 'contact@sci-martin.fr',
        bailleur_telephone: '+33 1 42 33 44 55',
        bailleur_siren_siret: '123456789',
        bailleur_representant_legal: 'Pierre Martin, Gérant',
        // Assurance complète
        attestation_assurance: true,
        nom_assureur: 'Allianz France',
        numero_police: 'ALL-PNO-2025-005678',
        assurance_pertes_exploitation: true,
        assurance_pertes_exploitation_details: 'Couverture 12 mois, plafond 50k€',
        assurance_occupation_illicite: true,
        protection_juridique: true,
        protection_juridique_details: 'Plafond 15k€, cabinet partenaire Lexpress',
        // Contact professionnel
        contact_urgence_nom: 'Want It Now Support',
        contact_urgence_telephone: '+33 1 80 00 00 00',
        contact_urgence_email: 'urgence@want-it-now.fr',
        // Spécifique plateforme
        type_activite_sous_location: 'mixte',
        conditions_sous_location: 'Courte durée 1-30 jours ou moyenne durée 1-11 mois',
        activites_permises: 'Hébergement touristique, télétravail, séminaires privés',
        duree_contrat_1an: true
    },
    // Scénario 3: Contrat fixe avec travaux - Chalet Chamonix
    chalet_chamonix_renovation: {
        propriete_id: 'prop_chalet_chamonix_001',
        unite_id: null,
        type_contrat: 'fixe',
        date_debut: '2025-04-01',
        date_fin: '2026-03-31',
        meuble: true,
        autorisation_sous_location: true,
        besoin_renovation: true, // Spécificité
        commission_pourcentage: '15', // Plus élevée avec travaux
        usage_proprietaire_jours_max: '60', // Maximum règle
        deduction_futurs_loyers: '5000', // Travaux déduits
        // Financier avec travaux
        loyer_mensuel_ht: '1800.00',
        charges_mensuelles: '300.00',
        depot_garantie: '3600.00',
        plafond_depannages_urgents: '800.00',
        // Autorisation travaux
        autorisation_travaux: true,
        conditions_remboursement_travaux: 'Travaux > 500€ avec accord préalable. Remboursement sur justificatifs.',
        // Spécifique montagne
        type_activite_sous_location: 'saisonniere',
        conditions_sous_location: 'Saison hiver et été uniquement. Max 12 personnes.',
        periodes_creuses: 'Mai-juin, septembre-novembre (hors vacances)',
        // Assurance montagne
        attestation_assurance: true,
        nom_assureur: 'MMA Montagne',
        numero_police: 'MMA-MONT-2025-009876',
        assurance_pertes_exploitation: true,
        assurance_occupation_illicite: false,
        protection_juridique: true
    }
};
// Données pour tests d'erreur et edge cases
exports.TEST_EDGE_CASES = {
    // Cas erreur: Commission variable incorrecte
    commission_variable_incorrecte: {
        type_contrat: 'variable',
        commission_pourcentage: '15', // Devrait être 10%
        expected_error: 'La commission pour les contrats variables doit être de 10%'
    },
    // Cas erreur: Usage propriétaire dépassé
    usage_proprietaire_depasse: {
        usage_proprietaire_jours_max: '75', // > 60 jours
        expected_error: 'L\'usage propriétaire ne peut pas dépasser 60 jours par an'
    },
    // Cas erreur: Sous-location refusée
    sous_location_refusee: {
        autorisation_sous_location: false,
        expected_error: 'L\'autorisation de sous-location est obligatoire pour Want It Now'
    },
    // Cas erreur: Propriété ET unité (exclusivité)
    propriete_et_unite: {
        propriete_id: 'prop_villa_nice_001',
        unite_id: 'unit_paris_trocadero_01',
        expected_error: 'Un contrat ne peut pas être lié à la fois à une propriété ET une unité'
    },
    // Cas erreur: Dates incohérentes
    dates_incoherentes: {
        date_debut: '2025-12-01',
        date_fin: '2025-06-01',
        expected_error: 'La date de fin doit être postérieure à la date de début'
    }
};
// Données pour tests de performance
exports.TEST_PERFORMANCE_DATA = {
    // Données volumineuses pour test de performance
    large_proprietes_set: Array.from({ length: 100 }, (_, i) => ({
        id: `prop_perf_test_${i.toString().padStart(3, '0')}`,
        nom: `Propriété Test ${i + 1}`,
        adresse_complete: `${i + 1} Rue de Test, ${75001 + (i % 20)} Paris, France`,
        type: ['appartement', 'maison', 'villa', 'studio'][i % 4],
        superficie_m2: 30 + Math.floor(Math.random() * 200),
        nb_pieces: 1 + Math.floor(Math.random() * 6),
        a_unites: i % 3 === 0,
        organisation_id: 'org_wantitnow_001'
    })),
    // Scénarios batch pour tests de charge
    batch_contracts_creation: Array.from({ length: 50 }, (_, i) => ({
        scenario_id: `batch_${i}`,
        concurrent: i < 10, // 10 premiers en concurrent
        data: {
            ...exports.TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
            propriete_id: `prop_perf_test_${i.toString().padStart(3, '0')}`,
            date_debut: `2025-${(1 + i % 12).toString().padStart(2, '0')}-01`
        }
    }))
};
// Helpers pour les tests
exports.TEST_HELPERS = {
    // Générer données aléatoires réalistes
    generateRandomContractData: (overrides = {}) => ({
        ...exports.TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        ...overrides,
        date_debut: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        commission_pourcentage: (Math.random() * 20 + 5).toFixed(1)
    }),
    // Valider structure données
    validateContractStructure: (data) => {
        const required = ['type_contrat', 'date_debut', 'date_fin', 'autorisation_sous_location'];
        return required.every(field => data[field] !== undefined);
    },
    // Mock données Supabase
    mockSupabaseResponse: (data, error = null) => ({
        data: error ? null : data,
        error: error ? { message: error } : null
    })
};
exports.default = {
    TEST_PROPRIETES: exports.TEST_PROPRIETES,
    TEST_UNITES: exports.TEST_UNITES,
    TEST_PROPRIETAIRES: exports.TEST_PROPRIETAIRES,
    TEST_CONTRAT_SCENARIOS: exports.TEST_CONTRAT_SCENARIOS,
    TEST_EDGE_CASES: exports.TEST_EDGE_CASES,
    TEST_PERFORMANCE_DATA: exports.TEST_PERFORMANCE_DATA,
    TEST_HELPERS: exports.TEST_HELPERS
};
