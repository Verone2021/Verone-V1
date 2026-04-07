/**
 * PCG Catégories suggérées et mapping legacy
 */

import type { PcgCategory } from './pcg-types';
import { PCG_MAP } from './pcg-subaccounts';

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
 * Catégories suggérées pour les REVENUS (Classe 7)
 * Utilisées pour les entrées d'argent (paiements clients, etc.)
 */
export const PCG_SUGGESTED_INCOME_CATEGORIES: PcgCategory[] = [
  PCG_MAP.get('706')!, // Prestations de services (services clients)
  PCG_MAP.get('707')!, // Ventes de marchandises (mobilier)
  PCG_MAP.get('708')!, // Produits des activités annexes
  PCG_MAP.get('758')!, // Produits divers de gestion (remboursements)
  PCG_MAP.get('768')!, // Autres produits financiers (intérêts, gains)
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
