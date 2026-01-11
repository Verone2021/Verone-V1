'use client';

/**
 * Hook: useSubmitUnifiedOrder
 *
 * Hook unifié pour soumettre les commandes LinkMe.
 * Gère les deux workflows:
 * - Restaurant existant → brouillon (pending_admin_validation = false)
 * - Ouverture → validation (pending_admin_validation = true)
 *
 * @module useSubmitUnifiedOrder
 * @since 2026-01-11
 */

import { useState, useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

import type {
  OrderFormUnifiedData,
  CartItem,
} from '@/components/OrderFormUnified';

// =====================================================================
// TYPES
// =====================================================================

interface SubmitUnifiedOrderParams {
  affiliateId: string;
  selectionId: string;
  cart: CartItem[];
  data: OrderFormUnifiedData;
}

interface SubmitUnifiedOrderResult {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  customerId?: string;
  error?: string;
}

interface RpcResponse {
  success: boolean;
  order_id?: string;
  order_number?: string;
  customer_id?: string;
  total_ttc?: number;
  error?: string;
}

// =====================================================================
// HOOK
// =====================================================================

export function useSubmitUnifiedOrder() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const submitOrder = useCallback(
    async (
      params: SubmitUnifiedOrderParams
    ): Promise<SubmitUnifiedOrderResult> => {
      const { affiliateId, selectionId, cart, data } = params;
      const supabase = createClient();

      setIsSubmitting(true);
      setError(null);

      try {
        // =============================================================
        // CAS 1: Restaurant existant → Brouillon simple
        // =============================================================
        if (!data.isNewRestaurant && data.existingOrganisationId) {
          const items = cart.map(item => ({
            selection_item_id: item.id,
            quantity: item.quantity,
          }));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: orderId, error: rpcError } = await (
            supabase.rpc as any
          )('create_affiliate_order', {
            p_affiliate_id: affiliateId,
            p_customer_id: data.existingOrganisationId,
            p_customer_type: 'organization',
            p_selection_id: selectionId,
            p_items: items,
            p_notes: data.notes || null,
          });

          if (rpcError) {
            throw new Error(`Erreur création commande: ${rpcError.message}`);
          }

          // Invalider les caches
          queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
          queryClient.invalidateQueries({
            queryKey: ['affiliate-orders', affiliateId],
          });

          toast.success('Brouillon créé !', {
            description: 'La commande a été créée en brouillon.',
          });

          return {
            success: true,
            orderId: orderId as string,
          };
        }

        // =============================================================
        // CAS 2: Ouverture de restaurant → Validation requise
        // =============================================================
        if (data.isNewRestaurant) {
          // Panier format RPC
          const p_cart = cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            selling_price_ttc: item.selling_price_ttc,
            id: item.id,
          }));

          // Demandeur = Propriétaire pour le nouveau formulaire
          const p_requester = {
            type: 'responsable_enseigne', // Valeur par défaut (plus demandé dans le formulaire)
            name: data.owner.name,
            email: data.owner.email,
            phone: data.owner.phone || null,
            position: null,
          };

          // Organisation nouvelle
          const p_organisation = {
            is_new: true,
            trade_name: data.newRestaurant.tradeName,
            legal_name:
              data.owner.type === 'franchise'
                ? data.owner.companyLegalName
                : data.newRestaurant.tradeName,
            city: data.newRestaurant.city,
            postal_code: data.newRestaurant.postalCode || null,
            address: data.newRestaurant.address || null,
          };

          // Propriétaire
          const p_owner = {
            type: data.owner.type,
            same_as_requester: false,
            name: data.owner.name,
            email: data.owner.email,
            phone: data.owner.phone || null,
          };

          // Facturation
          const billingName =
            data.billing.contactSource === 'custom'
              ? data.billing.name
              : data.owner.name;
          const billingEmail =
            data.billing.contactSource === 'custom'
              ? data.billing.email
              : data.owner.email;

          const p_billing = {
            contact_source:
              data.billing.contactSource === 'custom' ? 'custom' : 'step2',
            name: billingName,
            email: billingEmail,
            phone:
              data.billing.contactSource === 'custom'
                ? data.billing.phone
                : data.owner.phone,
            delivery_date: null, // Sera rempli au Step 4 post-approbation
            mall_form_required: false, // Sera rempli au Step 4 post-approbation
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: result, error: rpcError } = await (supabase.rpc as any)(
            'create_public_linkme_order',
            {
              p_affiliate_id: affiliateId,
              p_selection_id: selectionId,
              p_cart: p_cart,
              p_requester: p_requester,
              p_organisation: p_organisation,
              p_owner: p_owner,
              p_billing: p_billing,
            }
          );

          if (rpcError) {
            throw new Error(`Erreur création commande: ${rpcError.message}`);
          }

          const rpcResult = result as RpcResponse;

          if (!rpcResult?.success) {
            throw new Error(
              rpcResult?.error || 'Erreur inconnue lors de la création'
            );
          }

          const orderId = rpcResult.order_id;
          const orderNumber = rpcResult.order_number;
          const customerId = rpcResult.customer_id;
          const totalTtc = rpcResult.total_ttc;

          // Envoyer notification email
          try {
            const { data: selectionData } = await supabase
              .from('linkme_selections')
              .select('name, linkme_affiliates(name)')
              .eq('id', selectionId)
              .single();

            await fetch('/api/emails/notify-enseigne-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderNumber,
                orderId,
                requesterName: data.owner.name,
                requesterEmail: data.owner.email,
                requesterType: 'responsable_enseigne',
                organisationName: data.newRestaurant.tradeName,
                isNewRestaurant: true,
                totalTtc: totalTtc,
                source: 'unified_form',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                affiliateName: (selectionData?.linkme_affiliates as any)?.name,
                selectionName: selectionData?.name,
              }),
            });
          } catch (emailError) {
            console.error('Erreur envoi notification email:', emailError);
          }

          // Invalider les caches
          queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
          queryClient.invalidateQueries({
            queryKey: ['affiliate-orders', affiliateId],
          });

          toast.success('Demande envoyée !', {
            description: 'Votre commande est en attente de validation.',
          });

          return {
            success: true,
            orderNumber: orderNumber || undefined,
            orderId: orderId || undefined,
            customerId: customerId || undefined,
          };
        }

        // Cas fallback (ne devrait pas arriver)
        throw new Error('Configuration invalide');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        toast.error('Erreur', {
          description: errorMessage,
        });
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    [queryClient]
  );

  return {
    submitOrder,
    isSubmitting,
    error,
  };
}

export default useSubmitUnifiedOrder;
