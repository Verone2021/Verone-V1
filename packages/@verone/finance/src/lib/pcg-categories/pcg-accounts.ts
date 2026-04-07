/**
 * PCG Comptes de niveau 2 — Agrégation complète
 * Combines Charges (Classe 6) + Tiers/Produits (Classes 4, 5, 7)
 */

import type { PcgCategory } from './pcg-types';
import { PCG_ACCOUNTS_CHARGES } from './pcg-accounts-charges';
import { PCG_ACCOUNTS_TIERS_PRODUITS } from './pcg-accounts-tiers-produits';

export const PCG_ACCOUNTS: PcgCategory[] = [
  ...PCG_ACCOUNTS_CHARGES,
  ...PCG_ACCOUNTS_TIERS_PRODUITS,
];
