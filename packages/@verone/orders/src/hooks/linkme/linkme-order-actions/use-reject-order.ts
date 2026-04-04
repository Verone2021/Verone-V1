'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import type { RejectOrderInput, OrderActionResult } from './types';
import { fetchLinkMeOrderDetails } from './fetch-linkme-details';

/**
 * Refuse une commande
 * - Met à jour status = 'cancelled'
 * - Envoie email au demandeur avec la raison
 */
async function rejectOrder(
  input: RejectOrderInput
): Promise<OrderActionResult> {
  const supabase = createClient();

  // 0. Guard double-action: vérifier que la commande est bien en attente
  const { data: currentOrder, error: guardError } = await supabase
    .from('sales_orders')
    .select('status, pending_admin_validation')
    .eq('id', input.orderId)
    .single();

  if (guardError) {
    throw new Error(`Erreur vérification commande: ${guardError.message}`);
  }

  if (!currentOrder?.pending_admin_validation) {
    throw new Error('Cette commande a déjà été traitée (approuvée ou refusée)');
  }

  // Paralléliser les requêtes pour éviter séquentiel (fix perf)
  const [details, orderResult] = await Promise.all([
    // 1. Récupérer les détails LinkMe
    fetchLinkMeOrderDetails(input.orderId),
    // 2. Récupérer la commande
    supabase
      .from('sales_orders')
      .select('order_number, notes, customer_id, customer_type')
      .eq('id', input.orderId)
      .single(),
  ]);

  if (!details) {
    throw new Error('Détails LinkMe non trouvés pour cette commande');
  }

  if (orderResult.error) {
    throw new Error(
      `Erreur récupération commande: ${orderResult.error.message}`
    );
  }

  const order = orderResult.data;

  // Requête séparée pour l'organisation (pas de FK car customer_id est polymorphique)
  let organisationName: string | null = null;
  if (order.customer_type === 'organization' && order.customer_id) {
    const { data: org } = await supabase
      .from('organisations')
      .select('trade_name, legal_name')
      .eq('id', order.customer_id)
      .single();
    organisationName = org?.trade_name ?? org?.legal_name ?? null;
  }

  const timestamp = new Date().toLocaleString('fr-FR');
  const newNote = `[${timestamp}] COMMANDE REFUSEE: ${input.reason}`;
  const updatedNotes = order.notes ? `${order.notes}\n\n${newNote}` : newNote;

  // 4. Mettre à jour la commande + audit trail
  const rejectUserId = (await supabase.auth.getUser()).data.user?.id;
  const { error: updateError } = await supabase
    .from('sales_orders')
    .update({
      status: 'cancelled',
      pending_admin_validation: false,
      cancelled_at: new Date().toISOString(),
      cancelled_by: rejectUserId,
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', input.orderId);

  if (updateError) {
    throw new Error(`Erreur mise à jour commande: ${updateError.message}`);
  }

  // 4b. Si ouverture de restaurant, rejeter l'organisation + supprimer les contacts
  if (details.is_new_restaurant && order.customer_id) {
    // Reject the organisation
    const { error: rejectOrgError } = await supabase
      .from('organisations')
      .update({
        approval_status: 'rejected',
        archived_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', order.customer_id);

    if (rejectOrgError) {
      console.error('Erreur rejet organisation:', rejectOrgError);
    }

    // Fetch order to get contact IDs
    const { data: orderForContacts } = await supabase
      .from('sales_orders')
      .select('responsable_contact_id, billing_contact_id, delivery_contact_id')
      .eq('id', input.orderId)
      .single();

    if (orderForContacts) {
      const contactIds = [
        orderForContacts.responsable_contact_id,
        orderForContacts.billing_contact_id,
        orderForContacts.delivery_contact_id,
      ].filter((id): id is string => id != null);

      // Deduplicate (delivery may = responsable)
      const uniqueContactIds = [...new Set(contactIds)];

      if (uniqueContactIds.length > 0) {
        // Check which contacts are referenced by OTHER orders (not this one)
        const { data: referencedContacts } = await supabase
          .from('sales_orders')
          .select(
            'responsable_contact_id, billing_contact_id, delivery_contact_id'
          )
          .neq('id', input.orderId)
          .or(
            uniqueContactIds
              .flatMap(id => [
                `responsable_contact_id.eq.${id}`,
                `billing_contact_id.eq.${id}`,
                `delivery_contact_id.eq.${id}`,
              ])
              .join(',')
          );

        // Collect contact IDs used by other orders
        const usedByOtherOrders = new Set<string>();
        if (referencedContacts) {
          for (const row of referencedContacts) {
            if (row.responsable_contact_id)
              usedByOtherOrders.add(row.responsable_contact_id);
            if (row.billing_contact_id)
              usedByOtherOrders.add(row.billing_contact_id);
            if (row.delivery_contact_id)
              usedByOtherOrders.add(row.delivery_contact_id);
          }
        }

        // Only delete contacts NOT used by other orders
        const safeToDelete = uniqueContactIds.filter(
          id => !usedByOtherOrders.has(id)
        );

        if (safeToDelete.length > 0) {
          // 1. Nullify FKs on the order first (avoid constraint violation)
          const { error: nullifyError } = await supabase
            .from('sales_orders')
            .update({
              responsable_contact_id: null,
              billing_contact_id: null,
              delivery_contact_id: null,
            } as Record<string, unknown>)
            .eq('id', input.orderId);

          if (nullifyError) {
            console.error('Erreur nullify contact FKs:', nullifyError);
          } else {
            // 2. Hard DELETE the contacts
            const { error: deleteError } = await supabase
              .from('contacts')
              .delete()
              .in('id', safeToDelete);

            if (deleteError) {
              console.error('Erreur suppression contacts:', deleteError);
            }
          }
        }
      }
    }
  }

  // 5. Envoyer email au demandeur
  try {
    await fetch('/api/emails/linkme-order-rejected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salesOrderId: input.orderId,
        orderNumber: order.order_number,
        requesterEmail: details.requester_email,
        requesterName: details.requester_name,
        reason: input.reason,
        organisationName,
      }),
    });
  } catch (emailError) {
    console.error('Erreur envoi email rejection:', emailError);
    // On ne bloque pas si l'email échoue
  }

  return {
    success: true,
    message: `Commande refusée. Notification envoyée à ${details.requester_email}`,
  };
}

/**
 * Hook: refuser une commande
 */
export function useRejectOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectOrder,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkme-orders'] }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-orders-to-process'],
        }),
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['pending-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['pending-orders-count'] }),
      ]);
    },
  });
}
