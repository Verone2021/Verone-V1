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

// Types pour le retour Supabase (query avec join)
// NB: la table enseignes ne contient que id, name, logo_url (+ meta)
// Les données billing/siret/vat sont sur l'org parente (is_enseigne_parent=true)
interface EnseigneRow {
  id: string;
  name: string;
  logo_url: string | null;
}

interface EnseigneParentOrgRow {
  legal_name: string;
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_postal_code: string | null;
  billing_city: string | null;
  billing_country: string | null;
  siret: string | null;
  vat_number: string | null;
}

interface OrganisationRow {
  id: string;
  trade_name: string | null;
  legal_name: string;
  logo_url: string | null;
  ownership_type: 'succursale' | 'franchise' | null;
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_postal_code: string | null;
  billing_city: string | null;
  billing_country: string | null;
  shipping_address_line1: string | null;
  shipping_postal_code: string | null;
  shipping_city: string | null;
  shipping_country: string | null;
  enseigne: EnseigneRow | null;
}

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

      // Query 1: Organisation avec join enseigne (colonnes existantes uniquement)
      const { data: rawData, error } = await supabase
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
            logo_url
          )
        `
        )
        .eq('id', organisationId)
        .single();

      if (error) {
        console.error('[useOrganisationWithEnseigne] Error:', error);
        throw error;
      }

      if (!rawData) return null;

      // Type assertion pour le retour Supabase avec join
      const data = rawData as OrganisationRow;
      const enseigneData = data.enseigne;

      // Query 2: Récupérer l'org parente de l'enseigne (billing/siret/vat)
      let parentOrgData: EnseigneParentOrgRow | null = null;
      if (enseigneData) {
        const { data: parentOrg } = await supabase
          .from('organisations')
          .select(
            'legal_name, billing_address_line1, billing_address_line2, billing_postal_code, billing_city, billing_country, siret, vat_number'
          )
          .eq('enseigne_id', enseigneData.id)
          .eq('is_enseigne_parent', true)
          .maybeSingle();

        parentOrgData = parentOrg as EnseigneParentOrgRow | null;
      }

      return {
        id: data.id,
        tradeName: data.trade_name,
        legalName: data.legal_name,
        logoUrl: data.logo_url,
        ownershipType: data.ownership_type,
        address: {
          line1: data.shipping_address_line1 ?? data.billing_address_line1,
          line2: data.billing_address_line2,
          postalCode: data.shipping_postal_code ?? data.billing_postal_code,
          city: data.shipping_city ?? data.billing_city,
          country: data.shipping_country ?? data.billing_country,
        },
        enseigne: enseigneData
          ? {
              id: enseigneData.id,
              name: enseigneData.name,
              legalName: parentOrgData?.legal_name ?? null,
              logoUrl: enseigneData.logo_url,
              address: {
                line1: parentOrgData?.billing_address_line1 ?? null,
                line2: parentOrgData?.billing_address_line2 ?? null,
                postalCode: parentOrgData?.billing_postal_code ?? null,
                city: parentOrgData?.billing_city ?? null,
                country: parentOrgData?.billing_country ?? null,
              },
              siret: parentOrgData?.siret ?? null,
              vatNumber: parentOrgData?.vat_number ?? null,
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
