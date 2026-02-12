/**
 * Hook: useEnseigneOrganisations
 * Charge les organisations liées à l'enseigne d'un affiliate
 *
 * Relation DB:
 * linkme_affiliates.enseigne_id → enseignes.id ← organisations.enseigne_id
 *
 * @module use-enseigne-organisations
 * @since 2026-01-05
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// =====================================================================
// TYPES
// =====================================================================

export type OrganisationOwnershipType = 'propre' | 'succursale' | 'franchise';

export interface EnseigneOrganisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  city: string | null;
  postal_code: string | null;
  shipping_address_line1: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  logo_url: string | null;
  ownership_type: OrganisationOwnershipType | null;
  latitude: number | null;
  longitude: number | null;
  country: string | null; // Pour calcul TVA (FR=20%, autres=0%)
}

interface UseEnseigneOrganisationsOptions {
  /** Ne charger que si affiliateId est fourni */
  enabled?: boolean;
}

// =====================================================================
// HOOK
// =====================================================================

/**
 * Hook pour charger les organisations d'une enseigne via l'affiliate
 *
 * @param affiliateId - ID de l'affiliate (depuis la sélection)
 * @param options - Options du hook
 * @returns Liste des organisations approuvées de l'enseigne
 *
 * @example
 * ```tsx
 * const { data: organisations, isLoading } = useEnseigneOrganisations(affiliateId);
 * ```
 */
export function useEnseigneOrganisations(
  affiliateId: string | null,
  options: UseEnseigneOrganisationsOptions = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['enseigne-organisations', affiliateId],
    queryFn: async (): Promise<EnseigneOrganisation[]> => {
      if (!affiliateId) return [];

      const supabase = createClient();

      // 1. Récupérer enseigne_id de l'affiliate
      const { data: affiliate, error: affiliateError } = await supabase
        .from('linkme_affiliates')
        .select('enseigne_id')
        .eq('id', affiliateId)
        .single();

      if (affiliateError) {
        console.error('Error fetching affiliate:', affiliateError);
        throw affiliateError;
      }

      if (!affiliate?.enseigne_id) {
        // Affiliate sans enseigne (organisation_admin) → pas d'organisations à charger
        return [];
      }

      // 2. Récupérer organisations de l'enseigne avec adresses, logo, type et coordonnées GPS
      const { data: organisations, error: orgError } = await supabase
        .from('organisations')
        .select(
          'id, legal_name, trade_name, city, postal_code, shipping_address_line1, shipping_city, shipping_postal_code, logo_url, ownership_type, latitude, longitude, country'
        )
        .eq('enseigne_id', affiliate.enseigne_id)
        .eq('approval_status', 'approved')
        .is('archived_at', null)
        .order('trade_name', { ascending: true, nullsFirst: false });

      if (orgError) {
        console.error('Error fetching organisations:', orgError);
        throw orgError;
      }

      return (organisations || []) as EnseigneOrganisation[];
    },
    enabled: enabled && !!affiliateId,
    staleTime: 60000, // 1 minute
  });
}

export default useEnseigneOrganisations;
