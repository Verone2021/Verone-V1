/**
 * PCG Sous-comptes de niveau 3 + agrégations globales
 * Sous-comptes les plus courants pour une classification fine
 */

import type { PcgCategory } from './pcg-types';
import { PCG_CLASSES } from './pcg-classes';
import { PCG_ACCOUNTS } from './pcg-accounts';

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
