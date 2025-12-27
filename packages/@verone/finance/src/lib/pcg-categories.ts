/**
 * Plan Comptable Général (PCG) - Catégories Comptables COMPLET
 * Conforme au PCG français 2025 - Classes 1 à 8
 *
 * Classes du PCG:
 * - Classe 1: Comptes de capitaux
 * - Classe 2: Comptes d'immobilisations
 * - Classe 3: Comptes de stocks et en-cours
 * - Classe 4: Comptes de tiers
 * - Classe 5: Comptes financiers
 * - Classe 6: Comptes de charges
 * - Classe 7: Comptes de produits
 * - Classe 8: Comptes spéciaux
 *
 * Sources:
 * - ANC PCG 2025: https://www.anc.gouv.fr
 * - Indy: https://www.indy.fr/guide/tenue-comptable/plan-comptable/
 * - Pennylane: https://www.pennylane.com/fr/fiches-pratiques/plan-comptable/
 */

export interface PcgCategory {
  code: string;
  label: string;
  parentCode: string | null;
  level: 1 | 2 | 3;
  description?: string;
  icon?: string;
}

/**
 * Catégories PCG de niveau 1 (Classes principales)
 * Utilisées pour le regroupement dans les graphiques
 */
export const PCG_CLASSES: PcgCategory[] = [
  // ============================================================
  // CLASSE 1 - COMPTES DE CAPITAUX
  // ============================================================
  {
    code: '10',
    label: 'Capital et réserves',
    parentCode: null,
    level: 1,
    description: 'Capital social, réserves légales et statutaires',
    icon: '🏛️',
  },
  {
    code: '11',
    label: 'Report à nouveau',
    parentCode: null,
    level: 1,
    description: 'Bénéfices ou pertes reportés',
    icon: '📊',
  },
  {
    code: '12',
    label: "Résultat de l'exercice",
    parentCode: null,
    level: 1,
    description: "Bénéfice ou perte de l'exercice",
    icon: '📈',
  },
  {
    code: '16',
    label: 'Emprunts et dettes',
    parentCode: null,
    level: 1,
    description: 'Emprunts bancaires, dettes financières',
    icon: '🏦',
  },

  // ============================================================
  // CLASSE 2 - COMPTES D'IMMOBILISATIONS
  // ============================================================
  {
    code: '20',
    label: 'Immobilisations incorporelles',
    parentCode: null,
    level: 1,
    description: 'Brevets, licences, fonds de commerce, logiciels',
    icon: '💡',
  },
  {
    code: '21',
    label: 'Immobilisations corporelles',
    parentCode: null,
    level: 1,
    description: 'Terrains, constructions, matériel, véhicules',
    icon: '🏗️',
  },
  {
    code: '26',
    label: 'Participations',
    parentCode: null,
    level: 1,
    description: 'Participations dans des sociétés',
    icon: '🤝',
  },
  {
    code: '28',
    label: 'Amortissements des immobilisations',
    parentCode: null,
    level: 1,
    description: 'Amortissements cumulés',
    icon: '📉',
  },

  // ============================================================
  // CLASSE 3 - COMPTES DE STOCKS
  // ============================================================
  {
    code: '31',
    label: 'Matières premières',
    parentCode: null,
    level: 1,
    description: 'Stocks de matières premières',
    icon: '🧱',
  },
  {
    code: '32',
    label: 'Autres approvisionnements',
    parentCode: null,
    level: 1,
    description: 'Fournitures, emballages stockés',
    icon: '📦',
  },
  {
    code: '35',
    label: 'Stocks de produits',
    parentCode: null,
    level: 1,
    description: 'Produits finis et en-cours',
    icon: '🏭',
  },
  {
    code: '37',
    label: 'Stocks de marchandises',
    parentCode: null,
    level: 1,
    description: 'Marchandises destinées à la revente',
    icon: '🛍️',
  },

  // ============================================================
  // CLASSE 4 - COMPTES DE TIERS
  // ============================================================
  {
    code: '40',
    label: 'Fournisseurs',
    parentCode: null,
    level: 1,
    description: 'Dettes envers les fournisseurs',
    icon: '🚚',
  },
  {
    code: '41',
    label: 'Clients',
    parentCode: null,
    level: 1,
    description: 'Créances clients',
    icon: '👤',
  },
  {
    code: '42',
    label: 'Personnel',
    parentCode: null,
    level: 1,
    description: 'Dettes et créances envers le personnel',
    icon: '👥',
  },
  {
    code: '43',
    label: 'Sécurité sociale et organismes sociaux',
    parentCode: null,
    level: 1,
    description: 'Cotisations URSSAF, retraite, etc.',
    icon: '🏥',
  },
  {
    code: '44',
    label: 'État et collectivités',
    parentCode: null,
    level: 1,
    description: 'TVA, impôts, taxes diverses',
    icon: '🏛️',
  },
  {
    code: '45',
    label: 'Groupe et associés',
    parentCode: null,
    level: 1,
    description: 'Comptes courants associés',
    icon: '🤝',
  },
  {
    code: '46',
    label: 'Débiteurs et créditeurs divers',
    parentCode: null,
    level: 1,
    description: 'Autres créances et dettes',
    icon: '📋',
  },

  // ============================================================
  // CLASSE 5 - COMPTES FINANCIERS
  // ============================================================
  {
    code: '51',
    label: 'Banques',
    parentCode: null,
    level: 1,
    description: 'Comptes bancaires',
    icon: '🏦',
  },
  {
    code: '53',
    label: 'Caisse',
    parentCode: null,
    level: 1,
    description: 'Espèces en caisse',
    icon: '💵',
  },
  {
    code: '58',
    label: 'Virements internes',
    parentCode: null,
    level: 1,
    description: 'Transferts entre comptes',
    icon: '🔄',
  },

  // ============================================================
  // CLASSE 6 - COMPTES DE CHARGES
  // ============================================================
  {
    code: '60',
    label: 'Achats',
    parentCode: null,
    level: 1,
    description: 'Achats de biens et services stockés ou non stockés',
    icon: '🛒',
  },
  {
    code: '61',
    label: 'Services extérieurs',
    parentCode: null,
    level: 1,
    description: 'Services sous-traités et externalisés',
    icon: '🏢',
  },
  {
    code: '62',
    label: 'Autres services extérieurs',
    parentCode: null,
    level: 1,
    description: 'Services externes non sous-traités',
    icon: '📋',
  },
  {
    code: '63',
    label: 'Impôts et taxes',
    parentCode: null,
    level: 1,
    description: 'Charges fiscales (hors IS)',
    icon: '📊',
  },
  {
    code: '64',
    label: 'Charges de personnel',
    parentCode: null,
    level: 1,
    description: 'Salaires et charges sociales',
    icon: '👥',
  },
  {
    code: '65',
    label: 'Autres charges de gestion',
    parentCode: null,
    level: 1,
    description: 'Charges de gestion diverses',
    icon: '📁',
  },
  {
    code: '66',
    label: 'Charges financières',
    parentCode: null,
    level: 1,
    description: 'Intérêts et frais financiers',
    icon: '💰',
  },
  {
    code: '67',
    label: 'Charges exceptionnelles',
    parentCode: null,
    level: 1,
    description: 'Charges hors exploitation courante',
    icon: '⚠️',
  },
  {
    code: '68',
    label: 'Dotations aux amortissements et provisions',
    parentCode: null,
    level: 1,
    description: 'Amortissements, dépréciations, provisions',
    icon: '📉',
  },
  {
    code: '69',
    label: 'Participation et impôts sur les bénéfices',
    parentCode: null,
    level: 1,
    description: 'Participation des salariés, IS',
    icon: '🧾',
  },

  // ============================================================
  // CLASSE 7 - COMPTES DE PRODUITS
  // ============================================================
  {
    code: '70',
    label: 'Ventes de produits et services',
    parentCode: null,
    level: 1,
    description: "Chiffre d'affaires principal",
    icon: '💰',
  },
  {
    code: '71',
    label: 'Production stockée',
    parentCode: null,
    level: 1,
    description: 'Variation des stocks de produits',
    icon: '📦',
  },
  {
    code: '72',
    label: 'Production immobilisée',
    parentCode: null,
    level: 1,
    description: "Travaux faits par l'entreprise pour elle-même",
    icon: '🏗️',
  },
  {
    code: '74',
    label: "Subventions d'exploitation",
    parentCode: null,
    level: 1,
    description: 'Aides et subventions reçues',
    icon: '🏛️',
  },
  {
    code: '75',
    label: 'Autres produits de gestion',
    parentCode: null,
    level: 1,
    description: 'Redevances, revenus divers',
    icon: '📊',
  },
  {
    code: '76',
    label: 'Produits financiers',
    parentCode: null,
    level: 1,
    description: 'Intérêts, dividendes, gains de change',
    icon: '📈',
  },
  {
    code: '77',
    label: 'Produits exceptionnels',
    parentCode: null,
    level: 1,
    description: 'Plus-values de cession, autres produits',
    icon: '⭐',
  },
  {
    code: '78',
    label: 'Reprises sur amortissements et provisions',
    parentCode: null,
    level: 1,
    description: 'Reprises de provisions, dépréciations',
    icon: '📈',
  },
  {
    code: '79',
    label: 'Transferts de charges',
    parentCode: null,
    level: 1,
    description: "Charges transférées à d'autres comptes",
    icon: '🔄',
  },

  // ============================================================
  // CLASSE 8 - COMPTES SPÉCIAUX (si nécessaire)
  // ============================================================
  {
    code: '80',
    label: 'Engagements hors bilan',
    parentCode: null,
    level: 1,
    description: 'Engagements donnés et reçus',
    icon: '📝',
  },
];

/**
 * Catégories PCG de niveau 2 (Comptes)
 * Catégories les plus couramment utilisées pour la classification
 */
export const PCG_ACCOUNTS: PcgCategory[] = [
  // Classe 60 - Achats
  {
    code: '601',
    label: 'Matières premières',
    parentCode: '60',
    level: 2,
    description: 'Matières entrant dans la composition des produits',
  },
  {
    code: '602',
    label: 'Autres approvisionnements',
    parentCode: '60',
    level: 2,
    description: 'Combustibles, fournitures diverses stockées',
  },
  {
    code: '604',
    label: 'Prestations de services',
    parentCode: '60',
    level: 2,
    description: 'Études et prestations de services',
  },
  {
    code: '606',
    label: 'Fournitures non stockées',
    parentCode: '60',
    level: 2,
    description: "Eau, énergie, fournitures d'entretien",
  },
  {
    code: '607',
    label: 'Achats de marchandises',
    parentCode: '60',
    level: 2,
    description: "Marchandises revendues en l'état",
  },

  // Classe 61 - Services extérieurs
  {
    code: '611',
    label: 'Sous-traitance',
    parentCode: '61',
    level: 2,
    description: 'Travaux sous-traités à des tiers',
  },
  {
    code: '612',
    label: 'Crédit-bail (leasing)',
    parentCode: '61',
    level: 2,
    description: 'Location-financement',
  },
  {
    code: '613',
    label: 'Locations',
    parentCode: '61',
    level: 2,
    description: 'Loyers bureaux, véhicules, matériel',
  },
  {
    code: '614',
    label: 'Charges locatives',
    parentCode: '61',
    level: 2,
    description: 'Charges liées aux locaux loués',
  },
  {
    code: '615',
    label: 'Entretiens et réparations',
    parentCode: '61',
    level: 2,
    description: 'Maintenance et réparations',
  },
  {
    code: '616',
    label: 'Assurances',
    parentCode: '61',
    level: 2,
    description: "Primes d'assurance tous types",
  },

  // Classe 62 - Autres services extérieurs
  {
    code: '621',
    label: 'Personnel extérieur',
    parentCode: '62',
    level: 2,
    description: 'Intérimaires, personnel détaché',
  },
  {
    code: '622',
    label: 'Honoraires',
    parentCode: '62',
    level: 2,
    description: 'Comptable, avocat, consultant',
  },
  {
    code: '623',
    label: 'Publicité et marketing',
    parentCode: '62',
    level: 2,
    description: 'Communication, publicité, relations publiques',
  },
  {
    code: '624',
    label: 'Transports',
    parentCode: '62',
    level: 2,
    description: 'Frais de transport et livraison',
  },
  {
    code: '625',
    label: 'Déplacements et réceptions',
    parentCode: '62',
    level: 2,
    description: 'Voyages, repas, hébergement professionnels',
  },
  {
    code: '626',
    label: 'Télécommunications',
    parentCode: '62',
    level: 2,
    description: 'Téléphone, internet, poste',
  },
  {
    code: '627',
    label: 'Services bancaires',
    parentCode: '62',
    level: 2,
    description: 'Frais bancaires, commissions',
  },
  {
    code: '628',
    label: 'Divers',
    parentCode: '62',
    level: 2,
    description: 'Cotisations professionnelles, autres',
  },

  // Classe 63 - Impôts et taxes
  {
    code: '631',
    label: 'Taxes sur rémunérations',
    parentCode: '63',
    level: 2,
    description: 'Taxe sur salaires, apprentissage',
  },
  {
    code: '635',
    label: 'Autres impôts et taxes',
    parentCode: '63',
    level: 2,
    description: 'CFE, CVAE, taxes foncières',
  },

  // Classe 64 - Charges de personnel
  {
    code: '641',
    label: 'Rémunérations du personnel',
    parentCode: '64',
    level: 2,
    description: 'Salaires bruts',
  },
  {
    code: '645',
    label: 'Charges sociales',
    parentCode: '64',
    level: 2,
    description: 'Cotisations URSSAF, retraite, mutuelle',
  },
  {
    code: '648',
    label: 'Autres charges de personnel',
    parentCode: '64',
    level: 2,
    description: 'Formation, médecine du travail',
  },

  // Classe 65 - Autres charges de gestion
  {
    code: '651',
    label: 'Redevances et licences',
    parentCode: '65',
    level: 2,
    description: 'Brevets, licences, logiciels (SaaS)',
  },
  {
    code: '654',
    label: 'Pertes sur créances',
    parentCode: '65',
    level: 2,
    description: 'Créances irrécouvrables',
  },
  {
    code: '658',
    label: 'Charges diverses de gestion',
    parentCode: '65',
    level: 2,
    description: 'Autres charges de gestion',
  },

  // Classe 66 - Charges financières
  {
    code: '661',
    label: "Intérêts d'emprunts",
    parentCode: '66',
    level: 2,
    description: 'Intérêts sur emprunts bancaires',
  },
  {
    code: '666',
    label: 'Pertes de change',
    parentCode: '66',
    level: 2,
    description: 'Pertes sur opérations en devises',
  },

  // Classe 67 - Charges exceptionnelles
  {
    code: '671',
    label: 'Charges exceptionnelles de gestion',
    parentCode: '67',
    level: 2,
    description: 'Pénalités, amendes, dons',
  },
  {
    code: '675',
    label: 'Valeurs comptables cessions',
    parentCode: '67',
    level: 2,
    description: 'Valeur comptable des éléments cédés',
  },

  // Classe 68 - Dotations aux amortissements et provisions
  {
    code: '681',
    label: 'Dotations aux amortissements',
    parentCode: '68',
    level: 2,
    description: 'Dotations aux amortissements exploitation',
  },
  {
    code: '686',
    label: 'Dotations aux provisions financières',
    parentCode: '68',
    level: 2,
    description: 'Provisions pour risques financiers',
  },

  // Classe 69 - Impôts sur les bénéfices
  {
    code: '695',
    label: 'Impôt sur les bénéfices',
    parentCode: '69',
    level: 2,
    description: 'IS (Impôt sur les Sociétés)',
  },

  // ============================================================
  // CLASSE 4 - COMPTES DE TIERS (niveau 2)
  // ============================================================
  {
    code: '401',
    label: 'Fournisseurs - Comptes',
    parentCode: '40',
    level: 2,
    description: 'Fournisseurs ordinaires',
  },
  {
    code: '403',
    label: 'Fournisseurs - Effets à payer',
    parentCode: '40',
    level: 2,
    description: 'Lettres de change à payer',
  },
  {
    code: '404',
    label: "Fournisseurs d'immobilisations",
    parentCode: '40',
    level: 2,
    description: "Achats d'équipements et immobilisations",
  },
  {
    code: '408',
    label: 'Fournisseurs - Factures non parvenues',
    parentCode: '40',
    level: 2,
    description: 'Factures en attente de réception',
  },
  {
    code: '411',
    label: 'Clients - Comptes',
    parentCode: '41',
    level: 2,
    description: 'Créances clients ordinaires',
  },
  {
    code: '413',
    label: 'Clients - Effets à recevoir',
    parentCode: '41',
    level: 2,
    description: 'Lettres de change à recevoir',
  },
  {
    code: '416',
    label: 'Clients douteux ou litigieux',
    parentCode: '41',
    level: 2,
    description: 'Créances douteuses',
  },
  {
    code: '418',
    label: 'Clients - Produits non encore facturés',
    parentCode: '41',
    level: 2,
    description: 'Produits à facturer',
  },
  {
    code: '421',
    label: 'Personnel - Rémunérations dues',
    parentCode: '42',
    level: 2,
    description: 'Salaires nets à payer',
  },
  {
    code: '425',
    label: 'Personnel - Avances et acomptes',
    parentCode: '42',
    level: 2,
    description: 'Avances sur salaires',
  },
  {
    code: '431',
    label: 'Sécurité sociale',
    parentCode: '43',
    level: 2,
    description: 'Cotisations URSSAF',
  },
  {
    code: '437',
    label: 'Autres organismes sociaux',
    parentCode: '43',
    level: 2,
    description: 'Retraites, prévoyance, mutuelle',
  },
  {
    code: '4411',
    label: 'TVA due/État',
    parentCode: '44',
    level: 2,
    description: "TVA à payer à l'État",
  },
  {
    code: '44566',
    label: 'TVA déductible sur achats',
    parentCode: '44',
    level: 2,
    description: 'TVA récupérable',
  },
  {
    code: '44567',
    label: 'TVA déductible sur immobilisations',
    parentCode: '44',
    level: 2,
    description: "TVA sur acquisitions d'immobilisations",
  },
  {
    code: '44571',
    label: 'TVA collectée',
    parentCode: '44',
    level: 2,
    description: 'TVA facturée aux clients',
  },
  {
    code: '455',
    label: 'Associés - Comptes courants',
    parentCode: '45',
    level: 2,
    description: 'Apports en compte courant',
  },
  {
    code: '467',
    label: 'Autres comptes débiteurs/créditeurs',
    parentCode: '46',
    level: 2,
    description: 'Créances et dettes diverses',
  },

  // ============================================================
  // CLASSE 5 - COMPTES FINANCIERS (niveau 2)
  // ============================================================
  {
    code: '512',
    label: 'Banque - Compte courant',
    parentCode: '51',
    level: 2,
    description: 'Compte courant bancaire principal',
  },
  {
    code: '514',
    label: 'Chèques à encaisser',
    parentCode: '51',
    level: 2,
    description: "Chèques en attente d'encaissement",
  },
  {
    code: '517',
    label: 'Autres organismes financiers',
    parentCode: '51',
    level: 2,
    description: "Comptes dans d'autres établissements",
  },
  {
    code: '531',
    label: 'Caisse siège social',
    parentCode: '53',
    level: 2,
    description: 'Caisse principale',
  },
  {
    code: '580',
    label: 'Virements internes',
    parentCode: '58',
    level: 2,
    description: "Transferts entre comptes de l'entreprise",
  },

  // ============================================================
  // CLASSE 7 - COMPTES DE PRODUITS (niveau 2)
  // ============================================================
  {
    code: '701',
    label: 'Ventes de produits finis',
    parentCode: '70',
    level: 2,
    description: 'Ventes de biens fabriqués',
  },
  {
    code: '706',
    label: 'Prestations de services',
    parentCode: '70',
    level: 2,
    description: 'Facturation de services',
  },
  {
    code: '707',
    label: 'Ventes de marchandises',
    parentCode: '70',
    level: 2,
    description: "Revente en l'état",
  },
  {
    code: '708',
    label: 'Produits des activités annexes',
    parentCode: '70',
    level: 2,
    description: 'Commissions, ports facturés',
  },
  {
    code: '709',
    label: 'Rabais, remises et ristournes accordés',
    parentCode: '70',
    level: 2,
    description: 'Réductions accordées aux clients',
  },
  {
    code: '713',
    label: 'Variation des stocks de produits',
    parentCode: '71',
    level: 2,
    description: 'Écart de stock produits finis',
  },
  {
    code: '721',
    label: 'Immobilisations incorporelles',
    parentCode: '72',
    level: 2,
    description: 'Production immobilisée incorporelle',
  },
  {
    code: '722',
    label: 'Immobilisations corporelles',
    parentCode: '72',
    level: 2,
    description: 'Production immobilisée corporelle',
  },
  {
    code: '741',
    label: "Subventions d'exploitation",
    parentCode: '74',
    level: 2,
    description: "Aides reçues pour l'exploitation",
  },
  {
    code: '751',
    label: 'Redevances perçues',
    parentCode: '75',
    level: 2,
    description: 'Redevances sur brevets, licences',
  },
  {
    code: '758',
    label: 'Produits divers de gestion',
    parentCode: '75',
    level: 2,
    description: 'Autres produits de gestion courante',
  },
  {
    code: '761',
    label: 'Produits de participations',
    parentCode: '76',
    level: 2,
    description: 'Dividendes reçus',
  },
  {
    code: '764',
    label: 'Revenus des valeurs mobilières',
    parentCode: '76',
    level: 2,
    description: 'Intérêts sur placements',
  },
  {
    code: '766',
    label: 'Gains de change',
    parentCode: '76',
    level: 2,
    description: 'Gains sur opérations en devises',
  },
  {
    code: '768',
    label: 'Autres produits financiers',
    parentCode: '76',
    level: 2,
    description: 'Produits financiers divers',
  },
  {
    code: '771',
    label: 'Produits exceptionnels de gestion',
    parentCode: '77',
    level: 2,
    description: 'Pénalités perçues, autres',
  },
  {
    code: '775',
    label: "Produits de cessions d'éléments d'actif",
    parentCode: '77',
    level: 2,
    description: 'Prix de vente des immobilisations cédées',
  },
  {
    code: '781',
    label: 'Reprises sur amortissements exploitation',
    parentCode: '78',
    level: 2,
    description: "Reprises de provisions d'exploitation",
  },
  {
    code: '791',
    label: "Transferts de charges d'exploitation",
    parentCode: '79',
    level: 2,
    description: 'Charges transférées',
  },
];

/**
 * Sous-comptes PCG les plus courants (niveau 3)
 * Pour une classification plus fine
 */
export const PCG_SUBACCOUNTS: PcgCategory[] = [
  // 606 - Fournitures non stockées
  {
    code: '6061',
    label: 'Eau, énergie',
    parentCode: '606',
    level: 3,
    description: 'Électricité, gaz, eau',
  },
  {
    code: '6063',
    label: "Fournitures d'entretien",
    parentCode: '606',
    level: 3,
    description: "Produits d'entretien, petit outillage",
  },
  {
    code: '6064',
    label: 'Fournitures administratives',
    parentCode: '606',
    level: 3,
    description: 'Papeterie, fournitures de bureau',
  },

  // 613 - Locations
  {
    code: '6132',
    label: 'Locations immobilières',
    parentCode: '613',
    level: 3,
    description: 'Loyers bureaux, entrepôts',
  },
  {
    code: '6135',
    label: 'Locations mobilières',
    parentCode: '613',
    level: 3,
    description: 'Location de matériel, véhicules',
  },

  // 622 - Honoraires
  {
    code: '6226',
    label: 'Honoraires professionnels',
    parentCode: '622',
    level: 3,
    description: 'Comptable, avocat, consultant, notaire',
  },
  {
    code: '6227',
    label: 'Frais juridiques',
    parentCode: '622',
    level: 3,
    description: "Frais d'actes et contentieux",
  },

  // 623 - Publicité
  {
    code: '6231',
    label: 'Annonces et insertions',
    parentCode: '623',
    level: 3,
    description: 'Publicité presse, web, radio',
  },
  {
    code: '6234',
    label: 'Cadeaux clients',
    parentCode: '623',
    level: 3,
    description: 'Cadeaux clientèle, objets publicitaires',
  },

  // 625 - Déplacements
  {
    code: '6251',
    label: 'Voyages et déplacements',
    parentCode: '625',
    level: 3,
    description: 'Billets train/avion, carburant, péages',
  },
  {
    code: '6256',
    label: 'Missions',
    parentCode: '625',
    level: 3,
    description: 'Hôtel, repas en déplacement',
  },
  {
    code: '6257',
    label: 'Réceptions',
    parentCode: '625',
    level: 3,
    description: "Repas d'affaires, réceptions clients",
  },

  // 626 - Télécommunications
  {
    code: '6261',
    label: 'Frais postaux',
    parentCode: '626',
    level: 3,
    description: 'Affranchissement, colis',
  },
  {
    code: '6262',
    label: 'Téléphone et internet',
    parentCode: '626',
    level: 3,
    description: 'Abonnements télécoms, internet',
  },

  // 627 - Services bancaires
  {
    code: '6278',
    label: 'Frais bancaires',
    parentCode: '627',
    level: 3,
    description: 'Tenue de compte, CB, virements',
  },

  // 671 - Charges exceptionnelles
  {
    code: '6712',
    label: 'Pénalités et amendes',
    parentCode: '671',
    level: 3,
    description: 'Amendes fiscales, pénalités',
  },
  {
    code: '6713',
    label: 'Dons',
    parentCode: '671',
    level: 3,
    description: 'Dons à des associations',
  },
];

/**
 * Toutes les catégories PCG combinées
 */
export const ALL_PCG_CATEGORIES: PcgCategory[] = [
  ...PCG_CLASSES,
  ...PCG_ACCOUNTS,
  ...PCG_SUBACCOUNTS,
];

/**
 * Map code -> catégorie pour accès rapide
 */
export const PCG_MAP = new Map<string, PcgCategory>(
  ALL_PCG_CATEGORIES.map(cat => [cat.code, cat])
);

/**
 * Catégories suggérées pour l'affichage dans les sélecteurs
 * (les plus couramment utilisées en entreprise)
 */
export const PCG_SUGGESTED_CATEGORIES: PcgCategory[] = [
  PCG_MAP.get('607')!, // Achats de marchandises
  PCG_MAP.get('613')!, // Locations
  PCG_MAP.get('616')!, // Assurances
  PCG_MAP.get('622')!, // Honoraires
  PCG_MAP.get('623')!, // Publicité et marketing
  PCG_MAP.get('625')!, // Déplacements et réceptions
  PCG_MAP.get('626')!, // Télécommunications
  PCG_MAP.get('627')!, // Services bancaires
  PCG_MAP.get('651')!, // Redevances et licences (SaaS)
].filter(Boolean);

/**
 * Mapping ancien système -> PCG
 * Pour la migration des anciennes catégories
 */
export const LEGACY_TO_PCG_MAP: Record<string, string> = {
  bank_fees: '627', // Services bancaires
  subscription: '651', // Redevances et licences (SaaS)
  supplies: '606', // Fournitures non stockées
  transport: '624', // Transports
  marketing: '623', // Publicité et marketing
  taxes: '635', // Autres impôts et taxes
  insurance: '616', // Assurances
  professional_services: '622', // Honoraires
  software: '651', // Redevances et licences (SaaS)
  telecom: '626', // Télécommunications
  rent: '613', // Locations
  purchase_stock: '607', // Achats de marchandises
  other: '658', // Charges diverses de gestion
};

/**
 * Obtenir la catégorie PCG à partir d'un code
 */
export function getPcgCategory(code: string): PcgCategory | undefined {
  return PCG_MAP.get(code);
}

/**
 * Obtenir la catégorie parente (classe) d'un code
 */
export function getPcgParentClass(code: string): PcgCategory | undefined {
  const classCode = code.substring(0, 2);
  return PCG_CLASSES.find(c => c.code === classCode);
}

/**
 * Obtenir tous les enfants d'une catégorie
 */
export function getPcgChildren(parentCode: string): PcgCategory[] {
  return ALL_PCG_CATEGORIES.filter(cat => cat.parentCode === parentCode);
}

/**
 * Construire le chemin complet d'une catégorie
 * Ex: "62 > 627 > 6278" pour "Frais bancaires"
 */
export function getPcgPath(code: string): string[] {
  const path: string[] = [];
  let current = getPcgCategory(code);

  while (current) {
    path.unshift(current.code);
    current = current.parentCode
      ? getPcgCategory(current.parentCode)
      : undefined;
  }

  return path;
}

/**
 * Obtenir le libellé complet avec hiérarchie
 * Ex: "Autres services extérieurs > Services bancaires"
 */
export function getPcgFullLabel(code: string): string {
  const path = getPcgPath(code);
  return path.map(c => getPcgCategory(c)?.label || c).join(' > ');
}

/**
 * Convertir une ancienne catégorie vers le code PCG
 */
export function migrateLegacyCategory(legacyCategory: string): string {
  return LEGACY_TO_PCG_MAP[legacyCategory] || '658'; // Défaut: Charges diverses
}

/**
 * Grouper des montants par classe PCG (niveau 1)
 * Utile pour les graphiques donut
 */
export function groupByPcgClass(
  items: Array<{ pcgCode: string; amount: number }>
): Array<{ code: string; label: string; total: number }> {
  const grouped = new Map<string, number>();

  for (const item of items) {
    const classCode = item.pcgCode.substring(0, 2);
    const current = grouped.get(classCode) || 0;
    grouped.set(classCode, current + Math.abs(item.amount));
  }

  return Array.from(grouped.entries())
    .map(([code, total]) => {
      const category = getPcgCategory(code);
      return {
        code,
        label: category?.label || `Classe ${code}`,
        total,
      };
    })
    .sort((a, b) => b.total - a.total);
}
