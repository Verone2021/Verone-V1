'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import type { Database } from '@verone/types';
import type { UpdateLinkMeDetailsInput } from './types';

/**
 * Mise à jour des détails LinkMe d'une commande
 * Utilisé par l'admin pour compléter/modifier les infos des Étapes 1-3
 */
async function updateLinkMeDetails(
  input: UpdateLinkMeDetailsInput
): Promise<{ success: boolean }> {
  const supabase = createClient();

  // Convertir les valeurs undefined en conservant null uniquement où autorisé
  const cleanedUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input.updates)) {
    if (value !== undefined) {
      cleanedUpdates[key] = value;
    }
  }

  type LinkMeDetailsInsert =
    Database['public']['Tables']['sales_order_linkme_details']['Insert'];

  // Required NOT NULL fields for INSERT (defaults for new records)
  const upsertData: LinkMeDetailsInsert = {
    sales_order_id: input.orderId,
    requester_type: 'manual_entry',
    requester_name: '',
    requester_email: '',
    ...cleanedUpdates,
    updated_at: new Date().toISOString(),
  } as LinkMeDetailsInsert;

  const { error } = await supabase
    .from('sales_order_linkme_details')
    .upsert(upsertData, { onConflict: 'sales_order_id' });

  if (error) {
    console.error('Erreur update LinkMe details:', error);
    throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
  }

  return { success: true };
}

/**
 * Hook: useUpdateLinkMeDetails
 * Permet à l'admin de modifier les détails LinkMe d'une commande
 */
export function useUpdateLinkMeDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLinkMeDetails,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkme-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['pending-orders'] }),
      ]);
    },
  });
}
