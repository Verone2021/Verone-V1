'use client';

/**
 * Hook: useEnseigneParentOrganisation
 *
 * Récupère l'organisation mère (parent) d'une enseigne.
 * L'organisation mère est identifiée par : enseigne_id + is_enseigne_parent = TRUE
 *
 * Utilisé pour l'option "Utiliser l'organisation mère" dans la facturation (restaurants propres).
 *
 * @module useEnseigneParentOrganisation
 * @since 2026-01-15 (LM-ORD-009)
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

/**
 * Récupère l'organisation mère d'une enseigne
 *
 * @param {string | null} enseigneId - L'ID de l'enseigne
 * @returns Query result avec l'organisation mère ou null
 *
 * @example
 * ```tsx
 * const enseigneId = useEnseigneId();
 * const { data: parentOrg } = useEnseigneParentOrganisation(enseigneId);
 *
 * if (parentOrg) {
 *   console.log(`Organisation mère : ${parentOrg.legal_name}`);
 * }
 * ```
 */
export function useEnseigneParentOrganisation(enseigneId: string | null) {
  return useQuery({
    queryKey: ['enseigne-parent-org', enseigneId],
    queryFn: async () => {
      if (!enseigneId) return null;

      const supabase = createClient();

      const { data, error } = await supabase
        .from('organisations')
        .select(
          `
          id,
          legal_name,
          trade_name,
          address_line1,
          postal_code,
          city,
          siret,
          email
        `
        )
        .eq('enseigne_id', enseigneId)
        .eq('is_enseigne_parent', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          '[useEnseigneParentOrganisation] Error fetching parent organisation:',
          error
        );
        throw error;
      }

      return data;
    },
    enabled: !!enseigneId,
    staleTime: 5 * 60 * 1000, // 5 minutes (données rarement modifiées)
  });
}

export default useEnseigneParentOrganisation;
