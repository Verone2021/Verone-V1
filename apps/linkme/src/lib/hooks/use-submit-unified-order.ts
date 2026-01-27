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

          const { data: orderId, error: rpcError } = await (
            supabase.rpc as any
          )('create_affiliate_order', {
            p_affiliate_id: affiliateId,
            p_customer_id: data.existingOrganisationId,
            p_customer_type: 'organization',
            p_selection_id: selectionId,
            p_items: items,
            p_notes: data.finalNotes || null,
          });

          if (rpcError) {
            console.error(
              '[useSubmitUnifiedOrder] RPC Error (existing org):',
              rpcError
            );
            throw new Error(`Erreur création commande: ${rpcError.message}`);
          }

          console.log(
            '[useSubmitUnifiedOrder] Order created (existing org):',
            orderId
          );

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
            orderNumber: undefined, // Explicitly undefined for consistency
            customerId: data.existingOrganisationId,
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

          // Demandeur (Step 1)
          const p_requester = {
            name: data.requester.name,
            email: data.requester.email,
            phone: data.requester.phone || null,
            position: data.requester.position || null,
            notes: data.requester.notes || null,
          };

          // Organisation (Step 2)
          const p_organisation = {
            is_new: true,
            trade_name: data.newRestaurant.tradeName,
            legal_name:
              data.newRestaurant.ownershipType === 'franchise'
                ? data.responsable.companyLegalName
                : data.newRestaurant.tradeName,
            city: data.newRestaurant.city,
            postal_code: data.newRestaurant.postalCode || null,
            address: data.newRestaurant.address || null,
            latitude: data.newRestaurant.latitude || null,
            longitude: data.newRestaurant.longitude || null,
            ownership_type: data.newRestaurant.ownershipType, // 'succursale' | 'franchise'
          };

          // Responsable (Step 3)
          const p_responsable = data.isNewRestaurant
            ? {
                // Nouveau restaurant : créer nouveau contact
                is_new: true,
                name: data.responsable.name,
                email: data.responsable.email,
                phone: data.responsable.phone || null,
                company_legal_name:
                  data.newRestaurant.ownershipType === 'franchise'
                    ? data.responsable.companyLegalName || null
                    : null,
                siret:
                  data.newRestaurant.ownershipType === 'franchise'
                    ? data.responsable.siret || null
                    : null,
              }
            : data.existingContact.isNewContact
              ? {
                  // Restaurant existant + nouveau contact
                  is_new: true,
                  name: data.responsable.name,
                  email: data.responsable.email,
                  phone: data.responsable.phone || null,
                  company_legal_name: null,
                  siret: null,
                }
              : {
                  // Restaurant existant + contact existant
                  is_new: false,
                  contact_id: data.existingContact.selectedContactId,
                };

          // Facturation (Step 4)
          const p_billing = data.billing.useParentOrganisation
            ? {
                use_parent: true,
                contact_source: null,
                name: null,
                email: null,
                phone: null,
                address: null,
                postal_code: null,
                city: null,
                latitude: null,
                longitude: null,
                company_legal_name: null,
                siret: null,
              }
            : {
                use_parent: false,
                contact_source:
                  data.billing.contactSource === 'custom'
                    ? 'custom'
                    : 'responsable',
                name:
                  data.billing.contactSource === 'custom'
                    ? data.billing.name
                    : data.responsable.name,
                email:
                  data.billing.contactSource === 'custom'
                    ? data.billing.email
                    : data.responsable.email,
                phone:
                  data.billing.contactSource === 'custom'
                    ? data.billing.phone || null
                    : data.responsable.phone || null,
                address: data.billing.address || null,
                postal_code: data.billing.postalCode || null,
                city: data.billing.city || null,
                latitude: data.billing.latitude || null,
                longitude: data.billing.longitude || null,
                company_legal_name: data.billing.companyLegalName || null,
                siret: data.billing.siret || null,
              };

          // Livraison (Step 5)
          const p_delivery = {
            use_responsable_contact: data.delivery.useResponsableContact,
            contact_name: data.delivery.useResponsableContact
              ? null
              : data.delivery.contactName || null,
            contact_email: data.delivery.useResponsableContact
              ? null
              : data.delivery.contactEmail || null,
            contact_phone: data.delivery.useResponsableContact
              ? null
              : data.delivery.contactPhone || null,
            address: data.delivery.address || null,
            postal_code: data.delivery.postalCode || null,
            city: data.delivery.city || null,
            latitude: data.delivery.latitude || null,
            longitude: data.delivery.longitude || null,
            delivery_date: data.delivery.deliveryDate || null,
            is_mall_delivery: data.delivery.isMallDelivery || false,
            mall_email: data.delivery.isMallDelivery
              ? data.delivery.mallEmail || null
              : null,
            access_form_required: data.delivery.accessFormRequired || false,
            access_form_url: data.delivery.accessFormUrl || null,
            semi_trailer_accessible:
              data.delivery.semiTrailerAccessible !== false, // true par défaut
            notes: data.delivery.notes || null,
          };

          const { data: result, error: rpcError } = await (supabase.rpc as any)(
            'create_public_linkme_order',
            {
              p_affiliate_id: affiliateId,
              p_selection_id: selectionId,
              p_cart: p_cart,
              p_requester: p_requester,
              p_organisation: p_organisation,
              p_responsable: p_responsable,
              p_billing: p_billing,
              p_delivery: p_delivery,
            }
          );

          if (rpcError) {
            console.error('[useSubmitUnifiedOrder] RPC Error (new org):', {
              code: rpcError.code,
              message: rpcError.message,
              details: rpcError.details,
              hint: rpcError.hint,
            });
            throw new Error(`Erreur création commande: ${rpcError.message}`);
          }

          const rpcResult = result as RpcResponse;

          console.log(
            '[useSubmitUnifiedOrder] Order created (new org):',
            rpcResult
          );

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
                requesterName: data.responsable.name,
                requesterEmail: data.responsable.email,
                requesterType: 'responsable_enseigne',
                organisationName: data.newRestaurant.tradeName,
                isNewRestaurant: true,
                totalTtc: totalTtc,
                source: 'unified_form',

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
