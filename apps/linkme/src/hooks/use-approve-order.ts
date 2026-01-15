/**
 * Hook: useApproveOrder
 * Approbation des commandes depuis LinkMe
 *
 * Même source de vérité que le back-office (sales_orders.pending_admin_validation)
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
 * - Met à jour pending_admin_validation = false
 * - Met à jour status = 'validated'
 */
async function approveOrderFn(
  input: IApproveOrderInput
): Promise<IApproveOrderResult> {
  const supabase = createClient();

  // Vérifier que la commande existe et est en attente
  const { data: order, error: fetchError } = await supabase
    .from('sales_orders')
    .select('id, order_number, pending_admin_validation, status')
    .eq('id', input.orderId)
    .single();

  if (fetchError) {
    throw new Error(`Commande non trouvée: ${fetchError.message}`);
  }

  if (!order.pending_admin_validation) {
    throw new Error("Cette commande n'est pas en attente d'approbation");
  }

  // Mettre à jour la commande
  const { error: updateError } = await supabase
    .from('sales_orders')
    .update({
      pending_admin_validation: false,
      status: 'validated',
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
