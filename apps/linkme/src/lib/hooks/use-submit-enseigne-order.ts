'use client';

import { useState, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { EnseigneStepperData, CartItem } from '@/components/checkout';

// =====================================================================
// TYPES
// =====================================================================

interface SubmitOrderParams {
  affiliateId: string;
  selectionId: string;
  cart: CartItem[];
  data: EnseigneStepperData;
}

interface SubmitOrderResult {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  customerId?: string;
  error?: string;
}

interface UseSubmitEnseigneOrderReturn {
  submitOrder: (params: SubmitOrderParams) => Promise<SubmitOrderResult>;
  isSubmitting: boolean;
  error: string | null;
}

// RPC Response type
interface RpcResponse {
  success: boolean;
  order_id?: string;
  order_number?: string;
  customer_id?: string;
  total_ttc?: number;
  error?: string;
  sqlstate?: string;
}

// =====================================================================
// HOOK
// =====================================================================

/**
 * Hook pour soumettre une commande enseigne via page publique LinkMe.
 *
 * IMPORTANT: Ce hook utilise une RPC SECURITY DEFINER qui bypass le RLS
 * pour permettre aux clients anonymes (non connectes) de passer des commandes.
 *
 * La fonction `create_public_linkme_order` est definie dans:
 * supabase/migrations/20260110_005_public_linkme_order_rpc.sql
 */
export function useSubmitEnseigneOrder(): UseSubmitEnseigneOrderReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitOrder = useCallback(
    async (params: SubmitOrderParams): Promise<SubmitOrderResult> => {
      const { affiliateId, selectionId, cart, data } = params;
      const supabase = createClient();

      setIsSubmitting(true);
      setError(null);

      try {
        // ---------------------------------------------------------------
        // 1. Preparer les parametres pour l'appel RPC
        // ---------------------------------------------------------------

        // Panier: format attendu par la RPC
        const p_cart = cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          selling_price_ttc: item.selling_price_ttc,
          id: item.id, // linkme_selection_item_id
        }));

        // Demandeur (etape 1)
        const p_requester = {
          type: data.requesterType,
          name: data.requesterName,
          email: data.requesterEmail,
          phone: data.requesterPhone || null,
          position: data.requesterPosition || null,
        };

        // Organisation (etape 1)
        const p_organisation = data.isNewRestaurant
          ? {
              is_new: true,
              trade_name: data.newOrganisation.tradeName,
              legal_name:
                data.newOrganisation.legalName ||
                data.newOrganisation.tradeName,
              city: data.newOrganisation.city,
              postal_code: data.newOrganisation.postalCode || null,
              address: data.newOrganisation.address || null,
            }
          : {
              existing_id: data.existingOrganisationId,
            };

        // Proprietaire (etape 2)
        const p_owner = {
          type: data.ownerType,
          same_as_requester: data.ownerContactSameAsRequester,
          name: data.ownerContactSameAsRequester
            ? null
            : data.ownerName || null,
          email: data.ownerContactSameAsRequester
            ? null
            : data.ownerEmail || null,
          phone: data.ownerContactSameAsRequester
            ? null
            : data.ownerPhone || null,
        };

        // Facturation (etape 3)
        const p_billing = {
          contact_source: data.billingContactSource || 'step1',
          delivery_date: data.desiredDeliveryDate || null,
          mall_form_required: data.mallFormRequired || false,
        };

        // ---------------------------------------------------------------
        // 2. Appeler la RPC SECURITY DEFINER
        // ---------------------------------------------------------------
        // Cette RPC bypass le RLS et permet aux clients anonymes de creer
        // des commandes en toute securite (validation cote serveur PostgreSQL)
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

        // Gerer les erreurs de l'appel RPC
        if (rpcError) {
          throw new Error(`Erreur création commande: ${rpcError.message}`);
        }

        // La RPC retourne un objet JSONB
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

        // ---------------------------------------------------------------
        // 3. Envoyer notification email au back-office
        // ---------------------------------------------------------------
        try {
          let organisationName: string | null = null;

          if (!data.isNewRestaurant && data.existingOrganisationId) {
            const { data: orgData } = await supabase
              .from('organisations')
              .select('trade_name, legal_name')
              .eq('id', data.existingOrganisationId)
              .single();
            organisationName =
              orgData?.trade_name || orgData?.legal_name || null;
          } else if (data.isNewRestaurant) {
            organisationName =
              data.newOrganisation.tradeName ||
              data.newOrganisation.legalName ||
              null;
          }

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
              requesterName: data.requesterName,
              requesterEmail: data.requesterEmail,
              requesterType: data.requesterType,
              organisationName,
              isNewRestaurant: data.isNewRestaurant,
              totalTtc: totalTtc,
              source: 'client',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              affiliateName: (selectionData?.linkme_affiliates as any)?.name,
              selectionName: selectionData?.name,
            }),
          });
        } catch (emailError) {
          // Ne pas bloquer la commande si l'email echoue
          console.error('Erreur envoi notification email:', emailError);
        }

        // ---------------------------------------------------------------
        // 4. Succes
        // ---------------------------------------------------------------
        return {
          success: true,
          orderNumber: orderNumber || undefined,
          orderId: orderId || undefined,
          customerId: customerId || undefined,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    submitOrder,
    isSubmitting,
    error,
  };
}

export default useSubmitEnseigneOrder;
