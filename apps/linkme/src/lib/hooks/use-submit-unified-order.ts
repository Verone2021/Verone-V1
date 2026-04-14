'use client';

/**
 * Hook: useSubmitUnifiedOrder
 *
 * Hook unifié pour soumettre les commandes LinkMe.
 * Gère les deux workflows:
 * - Restaurant existant → validation (status = 'pending_approval')
 * - Ouverture → validation (status = 'pending_approval')
 *
 * @module useSubmitUnifiedOrder
 * @since 2026-01-11
 * @updated 2026-04-14 - Refactoring: extraction helpers payload
 */

import { useState, useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import type { Database } from '@verone/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

import type {
  OrderFormUnifiedData,
  CartItem,
} from '@/components/OrderFormUnified';
import {
  clientRequesterSchema,
  clientNewRestaurantSchema,
  clientDeliverySchema,
  clientExistingResponsableSchema,
} from '@/components/orders/schemas/client-order-form.schema';
import { buildNewRestaurantRpcParams } from './use-submit-unified-order-helpers';

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
      const supabase: SupabaseClient<Database> = createClient();

      setIsSubmitting(true);
      setError(null);

      try {
        // =============================================================
        // CAS 1: Restaurant existant → draft + linkme_details
        // =============================================================
        if (!data.isNewRestaurant && data.existingOrganisationId) {
          const requesterResult = clientRequesterSchema.safeParse(
            data.requester
          );
          if (!requesterResult.success) {
            throw new Error(
              `Données demandeur invalides: ${requesterResult.error.issues.map(i => i.message).join(', ')}`
            );
          }

          const responsableResult = clientExistingResponsableSchema.safeParse(
            data.responsable
          );
          if (!responsableResult.success) {
            throw new Error(
              `Données responsable invalides: ${responsableResult.error.issues.map(i => i.message).join(', ')}`
            );
          }

          const deliveryResult = clientDeliverySchema.safeParse(data.delivery);
          if (!deliveryResult.success) {
            throw new Error(
              `Données livraison invalides: ${deliveryResult.error.issues.map(i => i.message).join(', ')}`
            );
          }

          const items = cart.map(item => ({
            selection_item_id: item.id,
            quantity: item.quantity,
          }));

          const linkmeDetails = {
            requester_type: 'responsable_enseigne',
            requester_name: data.requester.name,
            requester_email: data.requester.email,
            requester_phone: data.requester.phone || null,
            requester_position: data.requester.position || null,
            is_new_restaurant: false,
            owner_type: null,
            billing_contact_source: data.billing.useParentOrganisation
              ? 'parent_organisation'
              : data.billing.contactSource || 'responsable',
            billing_name:
              data.billing.contactSource === 'custom'
                ? data.billing.name
                : data.responsable.name,
            billing_email:
              data.billing.contactSource === 'custom'
                ? data.billing.email
                : data.responsable.email,
            billing_phone:
              data.billing.contactSource === 'custom'
                ? data.billing.phone || null
                : data.responsable.phone || null,
            delivery_contact_name: data.delivery.useResponsableContact
              ? null
              : data.delivery.contactName || null,
            delivery_contact_email: data.delivery.useResponsableContact
              ? null
              : data.delivery.contactEmail || null,
            delivery_contact_phone: data.delivery.useResponsableContact
              ? null
              : data.delivery.contactPhone || null,
            delivery_address: data.delivery.address || null,
            delivery_postal_code: data.delivery.postalCode || null,
            delivery_city: data.delivery.city || null,
            delivery_latitude: data.delivery.latitude ?? null,
            delivery_longitude: data.delivery.longitude ?? null,
            desired_delivery_date: data.delivery.deliveryAsap
              ? null
              : data.delivery.deliveryDate || null,
            delivery_asap: data.delivery.deliveryAsap || false,
            is_mall_delivery: data.delivery.isMallDelivery || false,
            mall_email: data.delivery.isMallDelivery
              ? data.delivery.mallEmail || null
              : null,
            semi_trailer_accessible:
              data.delivery.semiTrailerAccessible !== false,
            access_form_url: data.delivery.accessFormUrl ?? null,
            delivery_notes: data.delivery.notes || null,
            delivery_terms_accepted: data.deliveryTermsAccepted || false,
          };

          const { data: rpcResult, error: rpcError } = await supabase.rpc(
            'create_affiliate_order',
            {
              p_affiliate_id: affiliateId,
              p_customer_id: data.existingOrganisationId,
              p_customer_type: 'organization' as const,
              p_selection_id: selectionId,
              p_items: items,
              p_notes: data.finalNotes ?? null,
              p_linkme_details: linkmeDetails,
            }
          );

          if (rpcError) {
            console.error(
              '[useSubmitUnifiedOrder] RPC Error (existing org):',
              rpcError
            );
            throw new Error(`Erreur création commande: ${rpcError.message}`);
          }

          const rpcData = rpcResult as unknown as {
            order_id: string;
            order_number: string;
          };
          const orderId = rpcData?.order_id;
          const orderNumber = rpcData?.order_number;

          console.warn(
            '[useSubmitUnifiedOrder] Order created (existing org):',
            orderId,
            orderNumber
          );

          // Send confirmation email (non-blocking)
          try {
            const { data: selectionData } = await supabase
              .from('linkme_selections')
              .select('name')
              .eq('id', selectionId)
              .single();

            const { data: orgData } = await supabase
              .from('organisations')
              .select('trade_name')
              .eq('id', data.existingOrganisationId)
              .single();

            const emailResponse = await fetch(
              '/api/emails/order-confirmation',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  salesOrderId: orderId,
                  orderNumber: orderNumber ?? '',
                  requesterName: data.requester.name,
                  requesterEmail: data.requester.email,
                  restaurantName: orgData?.trade_name ?? 'Restaurant',
                  selectionName: selectionData?.name ?? '',
                  itemsCount: cart.length,
                  totalHT: cart.reduce(
                    (sum, item) => sum + item.selling_price_ht * item.quantity,
                    0
                  ),
                  totalTTC: cart.reduce(
                    (sum, item) => sum + item.selling_price_ttc * item.quantity,
                    0
                  ),
                }),
              }
            );
            if (!emailResponse.ok) {
              const errorBody = (await emailResponse
                .json()
                .catch(() => null)) as { error?: string } | null;
              console.error(
                '[useSubmitUnifiedOrder] Email HTTP error:',
                emailResponse.status,
                errorBody?.error ?? 'no details'
              );
            }
          } catch (emailError) {
            console.error('[useSubmitUnifiedOrder] Email error:', emailError);
            toast.warning(
              "Commande enregistrée, mais l'email de confirmation n'a pas pu être envoyé.",
              {
                description: "Vous recevrez un email lors de l'approbation.",
              }
            );
          }

          await queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
          await queryClient.invalidateQueries({
            queryKey: ['affiliate-orders', affiliateId],
          });

          toast.success('Commande soumise !', {
            description: 'Votre commande est en attente de validation.',
          });

          return {
            success: true,
            orderId,
            orderNumber,
            customerId: data.existingOrganisationId,
          };
        }

        // =============================================================
        // CAS 2: Ouverture de restaurant → Validation requise
        // =============================================================
        if (data.isNewRestaurant) {
          const requesterResult = clientRequesterSchema.safeParse(
            data.requester
          );
          if (!requesterResult.success) {
            throw new Error(
              `Données demandeur invalides: ${requesterResult.error.issues.map(i => i.message).join(', ')}`
            );
          }

          const restaurantResult = clientNewRestaurantSchema.safeParse(
            data.newRestaurant
          );
          if (!restaurantResult.success) {
            throw new Error(
              `Données restaurant invalides: ${restaurantResult.error.issues.map(i => i.message).join(', ')}`
            );
          }

          const deliveryResult = clientDeliverySchema.safeParse(data.delivery);
          if (!deliveryResult.success) {
            throw new Error(
              `Données livraison invalides: ${deliveryResult.error.issues.map(i => i.message).join(', ')}`
            );
          }

          // Upload Kbis file if present
          let kbisUrl: string | null = data.responsable.kbisUrl ?? null;
          if (data.responsable.kbisFile) {
            const file = data.responsable.kbisFile;
            const fileExt = file.name.split('.').pop() ?? 'pdf';
            const fileName = `kbis/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from('linkme-delivery-forms')
              .upload(fileName, file, { cacheControl: '3600', upsert: false });
            if (!uploadError) {
              const {
                data: { publicUrl },
              } = supabase.storage
                .from('linkme-delivery-forms')
                .getPublicUrl(fileName);
              kbisUrl = publicUrl;
            } else {
              console.error(
                '[useSubmitUnifiedOrder] Kbis upload error:',
                uploadError
              );
            }
          }

          const rpcParams = buildNewRestaurantRpcParams(
            data,
            affiliateId,
            selectionId,
            cart,
            kbisUrl
          );

          const { data: result, error: rpcError } = await supabase.rpc(
            'create_public_linkme_order',
            rpcParams
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

          const rpcResult = result as unknown as RpcResponse;

          console.warn(
            '[useSubmitUnifiedOrder] Order created (new org):',
            rpcResult
          );

          if (!rpcResult?.success) {
            throw new Error(
              rpcResult?.error ?? 'Erreur inconnue lors de la création'
            );
          }

          const orderId = rpcResult.order_id;
          const orderNumber = rpcResult.order_number;
          const customerId = rpcResult.customer_id;
          const totalTtc = rpcResult.total_ttc;

          // Envoyer notification email
          try {
            interface SelectionWithAffiliate {
              name: string;
              linkme_affiliates: { name: string } | null;
            }
            const { data: selectionData } = await supabase
              .from('linkme_selections')
              .select('name, linkme_affiliates(name)')
              .eq('id', selectionId)
              .single<SelectionWithAffiliate>();

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
                totalTtc,
                source: 'unified_form',
                affiliateName: selectionData?.linkme_affiliates?.name,
                selectionName: selectionData?.name,
              }),
            });
          } catch (emailError) {
            console.error(
              '[useSubmitUnifiedOrder] Notify enseigne email error:',
              emailError
            );
            toast.warning(
              "Commande enregistrée, mais la notification n'a pas pu être envoyée.",
              {
                description:
                  "L'équipe Verone sera notifiée par un autre canal.",
              }
            );
          }

          await queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
          await queryClient.invalidateQueries({
            queryKey: ['affiliate-orders', affiliateId],
          });

          toast.success('Demande envoyée !', {
            description: 'Votre commande est en attente de validation.',
          });

          return {
            success: true,
            orderNumber: orderNumber ?? undefined,
            orderId: orderId ?? undefined,
            customerId: customerId ?? undefined,
          };
        }

        throw new Error('Configuration invalide');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        toast.error('Erreur', { description: errorMessage });
        return { success: false, error: errorMessage };
      } finally {
        setIsSubmitting(false);
      }
    },
    [queryClient]
  );

  return { submitOrder, isSubmitting, error };
}

export default useSubmitUnifiedOrder;
