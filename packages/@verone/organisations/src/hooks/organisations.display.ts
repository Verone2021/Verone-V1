'use client';

import type { Organisation } from '@verone/types';

import type { OrganisationFilters } from './organisations.types';
import { useOrganisations } from './use-organisations';

/**
 * Helper function: Retourne le nom d'affichage préféré d'une organisation
 * Si l'organisation a un nom commercial différent, retourne trade_name
 * Sinon, retourne legal_name (dénomination sociale)
 */
export function getOrganisationDisplayName(
  organisation: Organisation | null | undefined
): string {
  if (!organisation) return '';
  if (organisation.has_different_trade_name && organisation.trade_name) {
    return organisation.trade_name;
  }
  return organisation.legal_name;
}

/**
 * Format compact pour cartes/listes : "trade_name (legal_name)" si différents
 * Exemple : "Pokawa Aix-La-Pioline (ANK)"
 */
export function getOrganisationCardName(
  organisation: Organisation | null | undefined
): string {
  if (!organisation) return '';
  if (organisation.has_different_trade_name && organisation.trade_name) {
    return `${organisation.trade_name} (${organisation.legal_name})`;
  }
  return organisation.trade_name ?? organisation.legal_name;
}

export function useSuppliers(filters?: Omit<OrganisationFilters, 'type'>) {
  return useOrganisations({ ...filters, type: 'supplier' });
}

export function useCustomers(filters?: Omit<OrganisationFilters, 'type'>) {
  return useOrganisations({ ...filters, type: 'customer' });
}
