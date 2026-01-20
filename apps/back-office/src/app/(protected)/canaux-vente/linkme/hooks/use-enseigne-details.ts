/**
 * Hook: use-enseigne-details
 * Récupération des détails d'une enseigne (marque parente)
 * =====================================================================
 * - Récupère l'enseigne via l'organisation (organisation.enseigne_id)
 * - Utilisé pour la facturation (adresse enseigne parente)
 *
 * @module use-enseigne-details
 * @since 2026-01-20
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ============================================
// TYPES
// ============================================

export interface EnseigneDetails {
  id: string;
  name: string;
  legalName: string | null;
  logoUrl: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
  };
  siret: string | null;
  vatNumber: string | null;
}

export interface OrganisationWithEnseigne {
  id: string;
  tradeName: string | null;
  legalName: string;
  logoUrl: string | null;
  ownershipType: 'succursale' | 'franchise' | null;
  address: {
    line1: string | null;
    line2: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
  };
  enseigne: EnseigneDetails | null;
}

// ============================================
// HOOKS
// ============================================

/**
 * Récupère les détails de l'organisation avec son enseigne parente
 *
 * @param organisationId - ID de l'organisation
 * @returns Organisation avec enseigne parente
 */
export function useOrganisationWithEnseigne(organisationId: string | null) {
  return useQuery({
    queryKey: ['organisation-with-enseigne', organisationId],
    queryFn: async (): Promise<OrganisationWithEnseigne | null> => {
      if (!organisationId) return null;

      const supabase = createClient();

      // Fetch organisation with its enseigne in one query
      const { data, error } = await supabase
        .from('organisations')
        .select(
          `
          id,
          trade_name,
          legal_name,
          logo_url,
          ownership_type,
          billing_address_line1,
          billing_address_line2,
          billing_postal_code,
          billing_city,
          billing_country,
          shipping_address_line1,
          shipping_postal_code,
          shipping_city,
          shipping_country,
          enseigne:enseignes (
            id,
            name,
            legal_name,
            logo_url,
            billing_address_line1,
            billing_address_line2,
            billing_postal_code,
            billing_city,
            billing_country,
            siret,
            vat_number
          )
        `
        )
        .eq('id', organisationId)
        .single();

      if (error) {
        console.error('[useOrganisationWithEnseigne] Error:', error);
        throw error;
      }

      if (!data) return null;

      // Extract enseigne data (handle array or object from Supabase join)
      const enseigneData = Array.isArray(data.enseigne)
        ? data.enseigne[0]
        : data.enseigne;

      return {
        id: data.id,
        tradeName: data.trade_name,
        legalName: data.legal_name,
        logoUrl: data.logo_url,
        ownershipType: data.ownership_type as 'succursale' | 'franchise' | null,
        address: {
          line1: data.shipping_address_line1 || data.billing_address_line1,
          line2: data.billing_address_line2,
          postalCode: data.shipping_postal_code || data.billing_postal_code,
          city: data.shipping_city || data.billing_city,
          country: data.shipping_country || data.billing_country,
        },
        enseigne: enseigneData
          ? {
              id: enseigneData.id,
              name: enseigneData.name,
              legalName: enseigneData.legal_name,
              logoUrl: enseigneData.logo_url,
              address: {
                line1: enseigneData.billing_address_line1,
                line2: enseigneData.billing_address_line2,
                postalCode: enseigneData.billing_postal_code,
                city: enseigneData.billing_city,
                country: enseigneData.billing_country,
              },
              siret: enseigneData.siret,
              vatNumber: enseigneData.vat_number,
            }
          : null,
      };
    },
    enabled: !!organisationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Récupère uniquement l'enseigne parente d'une organisation
 *
 * @param organisationId - ID de l'organisation
 * @returns Enseigne parente (ou null si pas d'enseigne)
 */
export function useEnseigneParent(organisationId: string | null) {
  const { data, isLoading, error } =
    useOrganisationWithEnseigne(organisationId);

  return {
    enseigne: data?.enseigne ?? null,
    organisation: data,
    isLoading,
    error,
  };
}
