/**
 * PCG Comptes de niveau 2 — Classe 6 (Charges)
 * Codes 60x à 69x
 */

import type { PcgCategory } from './pcg-types';

export const PCG_ACCOUNTS_CHARGES: PcgCategory[] = [
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
];
