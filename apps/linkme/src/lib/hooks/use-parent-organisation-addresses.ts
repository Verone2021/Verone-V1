'use client';

/**
 * Hook: useParentOrganisationAddresses
 *
 * Récupère les adresses de facturation de l'organisation mère (parent).
 * Combine useEnseigneParentOrganisation + useEntityAddresses pour récupérer
 * l'adresse de la maison mère d'une enseigne.
 *
 * Utilisé pour afficher l'option "Adresse maison mère" dans BillingStep
 * (uniquement pour les restaurants propres/succursales).
 *
 * @module useParentOrganisationAddresses
 * @since 2026-01-24
 */

import { useMemo } from 'react';

import { useEnseigneParentOrganisation } from './use-enseigne-parent-organisation';
import { useEntityAddresses, type Address } from './use-entity-addresses';

/**
 * Parent organisation with addresses
 */
export interface ParentOrganisationWithAddresses {
  /** Parent organisation info */
  parentOrg: {
    id: string;
    legal_name: string | null;
    trade_name: string | null;
    address_line1: string | null;
    postal_code: string | null;
    city: string | null;
    siret: string | null;
    email: string | null;
  } | null;
  /** Billing addresses of the parent organisation */
  billingAddresses: Address[];
  /** Default billing address (if any) */
  defaultBillingAddress: Address | null;
  /** Primary address (from org fields, not addresses table) */
  primaryAddress: {
    addressLine1: string | null;
    postalCode: string | null;
    city: string | null;
    legalName: string | null;
    tradeName: string | null;
    siret: string | null;
  } | null;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Récupère les adresses de facturation de l'organisation mère
 *
 * @param enseigneId - L'ID de l'enseigne
 * @returns Parent organisation avec ses adresses de facturation
 *
 * @example
 * ```tsx
 * const enseigneId = useEnseigneId();
 * const { parentOrg, billingAddresses, primaryAddress, isLoading } =
 *   useParentOrganisationAddresses(enseigneId);
 *
 * if (parentOrg && primaryAddress) {
 *   console.log(`Maison mère : ${parentOrg.legal_name}`);
 *   console.log(`Adresse : ${primaryAddress.addressLine1}, ${primaryAddress.city}`);
 * }
 * ```
 */
export function useParentOrganisationAddresses(
  enseigneId: string | null
): ParentOrganisationWithAddresses {
  // 1. Get parent organisation
  const { data: parentOrg, isLoading: parentLoading } =
    useEnseigneParentOrganisation(enseigneId);

  // 2. Get addresses from addresses table
  const { data: addressesData, isLoading: addressesLoading } =
    useEntityAddresses('organisation', parentOrg?.id || null, 'billing');

  // 3. Build primary address from organisation fields
  const primaryAddress = useMemo(() => {
    if (!parentOrg) return null;

    // Only return if we have at least address_line1
    if (!parentOrg.address_line1) return null;

    return {
      addressLine1: parentOrg.address_line1,
      postalCode: parentOrg.postal_code,
      city: parentOrg.city,
      legalName: parentOrg.legal_name,
      tradeName: parentOrg.trade_name,
      siret: parentOrg.siret,
    };
  }, [parentOrg]);

  // 4. Combine results
  return {
    parentOrg: parentOrg || null,
    billingAddresses: addressesData?.billing || [],
    defaultBillingAddress: addressesData?.defaults?.billing || null,
    primaryAddress,
    isLoading: parentLoading || addressesLoading,
  };
}

export default useParentOrganisationAddresses;
