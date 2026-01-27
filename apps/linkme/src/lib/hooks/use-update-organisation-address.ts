/**
 * Hook: useUpdateOrganisationAddress
 * Permet de mettre à jour les données d'adresse/facturation d'une organisation
 *
 * Utilisé dans le BillingStep pour sauvegarder les modifications
 * de SIRET, TVA, adresse de facturation, etc.
 *
 * @module use-update-organisation-address
 * @since 2026-01-24
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// =====================================================================
// TYPES
// =====================================================================

export interface UpdateOrganisationAddressParams {
  organisationId: string;
  addressData: {
    // Adresse de facturation
    billing_address_line1?: string | null;
    billing_address_line2?: string | null;
    billing_postal_code?: string | null;
    billing_city?: string | null;
    billing_country?: string | null;
    // Informations légales
    siret?: string | null;
    vat_number?: string | null;
    legal_name?: string | null;
    trade_name?: string | null;
  };
}

// =====================================================================
// HOOK
// =====================================================================

/**
 * Hook pour mettre à jour l'adresse de facturation d'une organisation
 *
 * @returns Mutation TanStack Query avec:
 *   - mutate/mutateAsync: Fonction pour lancer la mise à jour
 *   - isPending: État de chargement
 *   - isError: Erreur rencontrée
 *   - isSuccess: Mise à jour réussie
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUpdateOrganisationAddress();
 *
 * const handleSave = () => {
 *   mutate({
 *     organisationId: 'uuid-xxx',
 *     addressData: {
 *       siret: '123 456 789 00012',
 *       billing_address_line1: '10 rue Example',
 *       billing_postal_code: '75001',
 *       billing_city: 'Paris',
 *     },
 *   });
 * };
 * ```
 */
export function useUpdateOrganisationAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisationId,
      addressData,
    }: UpdateOrganisationAddressParams) => {
      const supabase = createClient();

      // Filtrer les champs undefined
      const updateData = Object.fromEntries(
        Object.entries(addressData).filter(([, value]) => value !== undefined)
      );

      const { data, error } = await supabase
        .from('organisations')
        .update(updateData)
        .eq('id', organisationId)
        .select('id')
        .single();

      if (error) {
        console.error('[useUpdateOrganisationAddress] Error:', error);
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
      }

      return data;
    },
    onSuccess: async (_, { organisationId }) => {
      // Invalider le cache pour rafraîchir les données
      await queryClient.invalidateQueries({
        queryKey: ['organisation-detail', organisationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['entity-addresses', 'organisation', organisationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['enseigne-organisations'],
      });
    },
  });
}

export default useUpdateOrganisationAddress;
