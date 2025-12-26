/**
 * Plan Comptable Général (PCG) - Catégories Comptables
 * Conforme au PCG français 2025 - Classe 6 (Charges)
 *
 * Sources:
 * - ANC PCG 2025: https://www.anc.gouv.fr
 * - Indy: https://www.indy.fr/guide/tenue-comptable/plan-comptable/compte-classe-six/
 * - Pennylane: https://www.pennylane.com/fr/fiches-pratiques/plan-comptable/classe-6---comptes-de-charges
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
