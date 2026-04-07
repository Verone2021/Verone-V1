/**
 * PCG Classe 1 à 8 — Catégories de niveau 1 (Classes principales)
 * Utilisées pour le regroupement dans les graphiques
 */

import type { PcgCategory } from './pcg-types';

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
