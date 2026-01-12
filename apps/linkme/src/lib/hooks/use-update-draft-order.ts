/**
 * Hook: useUpdateDraftOrder
 * Met à jour une commande LinkMe en brouillon
 *
 * BIDIRECTIONNEL: Les modifications sont automatiquement visibles
 * dans le back-office car on utilise les mêmes tables Supabase.
 *
 * @module use-update-draft-order
 * @since 2026-01-12
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ============================================
// TYPES
// ============================================

export interface UpdateDraftOrderItemInput {
  /** ID de l'item existant (null si nouvel item) */
  id?: string;
  /** ID du produit */
  product_id: string;
  /** Nouvelle quantité */
  quantity: number;
  /** Prix unitaire HT */
  unit_price_ht: number;
  /** À supprimer ? */
  _delete?: boolean;
}

export interface UpdateDraftOrderInput {
  /** ID de la commande */
  orderId: string;
  /** Lignes de commande modifiées */
  items?: UpdateDraftOrderItemInput[];
  /** Nouveau client (organisation) */
  customerId?: string;
  /** Date de livraison souhaitée */
  desiredDeliveryDate?: string;
  /** Infos demandeur */
  requesterInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface UpdateDraftOrderResult {
  success: boolean;
  orderId: string;
  newTotalHt: number;
  newTotalTtc: number;
  error?: string;
}

// ============================================
// UPDATE FUNCTION
// ============================================

async function updateDraftOrder(
  input: UpdateDraftOrderInput
): Promise<UpdateDraftOrderResult> {
  const supabase = createClient();

  // 1. Vérifier que la commande existe et est en brouillon
  const { data: currentOrder, error: fetchError } = await supabase
    .from('sales_orders')
    .select(
      `
      id,
      status,
      customer_id,
      total_ht,
      total_ttc,
      shipping_cost_ht,
      insurance_cost_ht,
      handling_cost_ht,
      tax_rate,
      sales_order_items (
        id,
        product_id,
        quantity,
        unit_price_ht,
        tax_rate,
        retrocession_rate,
        retrocession_amount,
        base_price_ht
      )
    `
    )
    .eq('id', input.orderId)
    .single();

  if (fetchError || !currentOrder) {
    return {
      success: false,
      orderId: input.orderId,
      newTotalHt: 0,
      newTotalTtc: 0,
      error: 'Commande non trouvée',
    };
  }

  // Vérifier le statut
  if (currentOrder.status !== 'draft') {
    return {
      success: false,
      orderId: input.orderId,
      newTotalHt: currentOrder.total_ht || 0,
      newTotalTtc: currentOrder.total_ttc || 0,
      error: 'Seules les commandes en brouillon peuvent être modifiées',
    };
  }

  // 2. Traiter les modifications d'items si fournies
  let newProductsHt = 0;

  if (input.items && input.items.length > 0) {
    // Supprimer les items marqués _delete
    const itemsToDelete = input.items.filter(i => i._delete && i.id);
    for (const item of itemsToDelete) {
      await supabase.from('sales_order_items').delete().eq('id', item.id!);
    }

    // Mettre à jour ou créer les autres items
    const itemsToUpdate = input.items.filter(i => !i._delete);

    for (const item of itemsToUpdate) {
      if (item.id) {
        // Mise à jour d'un item existant
        const { error: updateItemError } = await supabase
          .from('sales_order_items')
          .update({
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
          })
          .eq('id', item.id);

        if (updateItemError) {
          console.error('Erreur mise à jour item:', updateItemError);
        }
      } else {
        // Nouvel item - trouver les infos du produit depuis la sélection
        // Note: Pour simplifier, on suppose que les nouveaux items ont déjà
        // toutes les infos nécessaires
        const { error: insertItemError } = await supabase
          .from('sales_order_items')
          .insert({
            sales_order_id: input.orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            tax_rate: 0.2, // TVA standard
          });

        if (insertItemError) {
          console.error('Erreur création item:', insertItemError);
        }
      }

      // Calculer le total produits
      if (!item._delete) {
        newProductsHt += item.quantity * item.unit_price_ht;
      }
    }
  } else {
    // Pas de modification d'items, garder le total existant
    const existingItems = currentOrder.sales_order_items as any[];
    for (const item of existingItems || []) {
      newProductsHt += item.quantity * item.unit_price_ht;
    }
  }

  // 3. Calculer les nouveaux totaux
  const shippingCostHt = currentOrder.shipping_cost_ht || 0;
  const insuranceCostHt = currentOrder.insurance_cost_ht || 0;
  const handlingCostHt = currentOrder.handling_cost_ht || 0;
  const taxRate = currentOrder.tax_rate || 0.2;

  const newTotalHt =
    newProductsHt + shippingCostHt + insuranceCostHt + handlingCostHt;
  const newTotalTtc = newTotalHt * (1 + taxRate);

  // 4. Mettre à jour la commande principale
  const updateData: Record<string, any> = {
    total_ht: Math.round(newTotalHt * 100) / 100,
    total_ttc: Math.round(newTotalTtc * 100) / 100,
    updated_at: new Date().toISOString(),
  };

  // Changer de client si demandé
  if (input.customerId) {
    updateData.customer_id = input.customerId;
  }

  const { error: updateError } = await supabase
    .from('sales_orders')
    .update(updateData)
    .eq('id', input.orderId);

  if (updateError) {
    console.error('Erreur mise à jour commande:', updateError);
    return {
      success: false,
      orderId: input.orderId,
      newTotalHt,
      newTotalTtc,
      error: updateError.message,
    };
  }

  // 5. Mettre à jour les détails LinkMe si nécessaire
  if (input.desiredDeliveryDate || input.requesterInfo) {
    const linkmeDetailsUpdate: Record<string, any> = {};

    if (input.desiredDeliveryDate) {
      linkmeDetailsUpdate.desired_delivery_date = input.desiredDeliveryDate;
    }

    if (input.requesterInfo) {
      linkmeDetailsUpdate.requester_name = input.requesterInfo.name;
      linkmeDetailsUpdate.requester_email = input.requesterInfo.email;
      if (input.requesterInfo.phone) {
        linkmeDetailsUpdate.requester_phone = input.requesterInfo.phone;
      }
    }

    // Vérifier si un enregistrement existe
    const { data: existingDetails } = await supabase
      .from('sales_order_linkme_details')
      .select('id')
      .eq('sales_order_id', input.orderId)
      .single();

    if (existingDetails) {
      await supabase
        .from('sales_order_linkme_details')
        .update(linkmeDetailsUpdate)
        .eq('sales_order_id', input.orderId);
    }
  }

  return {
    success: true,
    orderId: input.orderId,
    newTotalHt: Math.round(newTotalHt * 100) / 100,
    newTotalTtc: Math.round(newTotalTtc * 100) / 100,
  };
}

// ============================================
// HOOK REACT-QUERY
// ============================================

/**
 * Hook pour mettre à jour une commande en brouillon
 *
 * Vérifie que la commande est bien en status 'draft' avant de permettre
 * les modifications. Invalide les caches pour une synchronisation
 * automatique avec le back-office.
 */
export function useUpdateDraftOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDraftOrder,
    onSuccess: result => {
      if (result.success) {
        // Invalider tous les caches concernés pour synchronisation bidirectionnelle
        queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
        queryClient.invalidateQueries({
          queryKey: ['linkme-order', result.orderId],
        });
        // Aussi invalider les caches du back-office pour synchronisation
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      }
    },
    onError: error => {
      console.error('Erreur mutation updateDraftOrder:', error);
    },
  });
}

export default useUpdateDraftOrder;
