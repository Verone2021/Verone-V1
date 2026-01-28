/**
 * Hook: useUpdateOrganisationOwnershipType
 * Met à jour le type de propriété d'une organisation (franchise/succursale)
 *
 * Contexte métier:
 * Le ownership_type conditionne tout le workflow des contacts dans les étapes suivantes :
 * - Étape 5 (Responsable) : Franchises peuvent voir contacts enseigne
 * - Étape 6 (Facturation) : Franchises = contacts locaux uniquement
 * - Étape 7 (Livraison) : Filtrage strict selon le type
 *
 * @module use-update-organisation-ownership-type
 * @since 2026-01-24
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

// =====================================================================
// TYPES
// =====================================================================

export type OwnershipType = 'succursale' | 'franchise';

interface UpdateOwnershipTypeParams {
  organisationId: string;
  ownershipType: OwnershipType;
}

// =====================================================================
// HOOK
// =====================================================================

/**
 * Hook pour mettre à jour le type de propriété d'une organisation
 *
 * @returns Mutation pour update ownership_type
 *
 * @example
 * ```tsx
 * const { mutateAsync: updateOwnershipType, isPending } = useUpdateOrganisationOwnershipType();
 *
 * const handleTypeSelect = async (type: 'franchise' | 'succursale') => {
 *   await updateOwnershipType({ organisationId: org.id, ownershipType: type });
 * };
 * ```
 */
export function useUpdateOrganisationOwnershipType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisationId,
      ownershipType,
    }: UpdateOwnershipTypeParams) => {
      const supabase = createClient();

      const { error } = await supabase
        .from('organisations')
        .update({ ownership_type: ownershipType })
        .eq('id', organisationId);

      if (error) {
        console.error('[useUpdateOrganisationOwnershipType] Error:', error);
        throw error;
      }

      return { organisationId, ownershipType };
    },
    onSuccess: async () => {
      // Invalider les caches pertinents pour rafraîchir les données
      await queryClient.invalidateQueries({
        queryKey: ['enseigne-organisations'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['organisation-detail'],
      });
      await queryClient.invalidateQueries({ queryKey: ['organisation-stats'] });
      toast.success('Type de restaurant enregistré');
    },
    onError: (error: Error) => {
      console.error(
        '[useUpdateOrganisationOwnershipType] Mutation error:',
        error
      );
      toast.error("Erreur lors de l'enregistrement du type de restaurant");
    },
  });
}

export default useUpdateOrganisationOwnershipType;
