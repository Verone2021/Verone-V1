'use client';

/**
 * Hook: useEnseigneIdFromAffiliate
 *
 * Récupère l'enseigne_id depuis un affiliateId donné.
 * Version SANS dépendance à AuthContext, utilisable dans les pages publiques.
 *
 * @module useEnseigneIdFromAffiliate
 * @since 2026-01-15 (LM-ORD-010)
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

/**
 * Récupère l'enseigne_id depuis un affiliateId
 *
 * @param {string | null} affiliateId - L'ID de l'affiliate
 * @returns {string | null} L'enseigne_id ou null si non disponible
 *
 * @example
 * ```tsx
 * const enseigneId = useEnseigneIdFromAffiliate(affiliateId);
 * const { data: parentOrg } = useEnseigneParentOrganisation(enseigneId);
 * ```
 */
export function useEnseigneIdFromAffiliate(affiliateId: string | null) {
  return useQuery({
    queryKey: ['enseigne-id-from-affiliate', affiliateId],
    queryFn: async (): Promise<string | null> => {
      if (!affiliateId) return null;

      const supabase = createClient();

      const { data, error } = await supabase
        .from('linkme_affiliates')
        .select('enseigne_id')
        .eq('id', affiliateId)
        .maybeSingle();

      if (error) {
        console.error(
          '[useEnseigneIdFromAffiliate] Error fetching enseigne_id:',
          error
        );
        throw error;
      }

      return data?.enseigne_id ?? null;
    },
    enabled: !!affiliateId,
    staleTime: 5 * 60 * 1000, // 5 minutes (rarement modifié)
  });
}

export default useEnseigneIdFromAffiliate;
