/**
 * Hook: useApproveOrder
 * Approbation des commandes depuis LinkMe
 *
 * Même source de vérité que le back-office (sales_orders.status = 'pending_approval')
 * Bidirectionnel: approuvé ici = approuvé dans back-office et vice-versa
 *
 * @module use-approve-order
 * @since 2026-01-10
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ============================================
// TYPES
// ============================================

export interface IApproveOrderInput {
  orderId: string;
}

export interface IApproveOrderResult {
  success: boolean;
  message: string;
}

// ============================================
// APPROVE FUNCTION
// ============================================

/**
 * Approuve une commande en attente de validation
 * - Transition: pending_approval -> draft
 */
async function approveOrderFn(
  input: IApproveOrderInput
): Promise<IApproveOrderResult> {
  const supabase = createClient();

  // Vérifier que la commande existe et est en attente
  const { data: order, error: fetchError } = await supabase
    .from('sales_orders')
    .select('id, order_number, status')
    .eq('id', input.orderId)
    .single();

  if (fetchError) {
    throw new Error(`Commande non trouvée: ${fetchError.message}`);
  }

  if (order.status !== 'pending_approval') {
    throw new Error("Cette commande n'est pas en attente d'approbation");
  }

  // Mettre à jour la commande: pending_approval -> draft
  const { error: updateError } = await supabase
    .from('sales_orders')
    .update({
      status: 'draft',
      pending_admin_validation: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.orderId);

  if (updateError) {
    throw new Error(`Erreur lors de l'approbation: ${updateError.message}`);
  }

  return {
    success: true,
    message: `Commande ${order.order_number} approuvée avec succès`,
  };
}

// ============================================
// HOOK
// ============================================

/**
 * Hook pour approuver une commande depuis LinkMe
 */
export function useApproveOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveOrderFn,
    onSuccess: () => {
      // Invalider les queries pour rafraîchir les données
      void queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
    },
  });
}

export default useApproveOrder;
