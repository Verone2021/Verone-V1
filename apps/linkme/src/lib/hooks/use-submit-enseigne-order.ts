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
  error?: string;
}

interface UseSubmitEnseigneOrderReturn {
  submitOrder: (params: SubmitOrderParams) => Promise<SubmitOrderResult>;
  isSubmitting: boolean;
  error: string | null;
}

// LinkMe channel ID (from existing code)
const LINKME_CHANNEL_ID = '550e8400-e29b-41d4-a716-446655440005';

// =====================================================================
// HOOK
// =====================================================================

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
        // 1. Determiner l'organisation cliente
        // ---------------------------------------------------------------
        let customerId: string;

        if (data.isNewRestaurant) {
          // Creer une nouvelle organisation avec status pending_validation
          // Utiliser la RPC existante avec le nouveau parametre
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: orgResult, error: orgError } = await (
            supabase.rpc as any
          )('create_customer_organisation_for_affiliate', {
            p_affiliate_id: affiliateId,
            p_legal_name:
              data.newOrganisation.legalName || data.newOrganisation.tradeName,
            p_trade_name: data.newOrganisation.tradeName,
            p_address: data.newOrganisation.address || undefined,
            p_postal_code: data.newOrganisation.postalCode || undefined,
            p_city: data.newOrganisation.city,
            p_country: 'France',
            p_contact_email: data.requesterEmail,
            p_is_new_restaurant: true, // Declenchera approval_status = 'pending_validation'
          });

          if (orgError) {
            throw new Error(
              `Erreur création organisation: ${orgError.message}`
            );
          }

          // Le résultat peut être un objet avec organisation_id ou directement l'ID
          customerId =
            typeof orgResult === 'string'
              ? orgResult
              : orgResult?.organisation_id || orgResult?.id;
        } else {
          // Organisation existante
          if (!data.existingOrganisationId) {
            throw new Error('Aucune organisation selectionnee');
          }
          customerId = data.existingOrganisationId;
        }

        // ---------------------------------------------------------------
        // 2. Generer un numero de commande unique
        // ---------------------------------------------------------------
        const orderNumber = `LNK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // ---------------------------------------------------------------
        // 3. Creer la commande (sales_order)
        // ---------------------------------------------------------------
        const totalHt = cart.reduce(
          (sum, item) => sum + (item.selling_price_ttc / 1.2) * item.quantity,
          0
        );
        const totalTtc = cart.reduce(
          (sum, item) => sum + item.selling_price_ttc * item.quantity,
          0
        );

        // Obtenir l'utilisateur anonyme ID pour created_by (ou utiliser un UUID système)
        const { data: userData } = await supabase.auth.getUser();
        const createdBy =
          userData?.user?.id || '00000000-0000-0000-0000-000000000000';

        const { data: orderData, error: orderError } = await supabase
          .from('sales_orders')
          .insert({
            order_number: orderNumber,
            customer_id: customerId,
            customer_type: 'organisation', // Type client B2B
            channel_id: LINKME_CHANNEL_ID,
            status: 'draft', // Statut initial pour validation back-office
            created_by: createdBy,
            total_ht: totalHt,
            total_ttc: totalTtc,
            currency: 'EUR',
            notes: `Commande enseigne via selection ${selectionId}`,
            expected_delivery_date: data.desiredDeliveryDate || null,
            linkme_selection_id: selectionId,
          })
          .select('id')
          .single();

        if (orderError) {
          throw new Error(`Erreur création commande: ${orderError.message}`);
        }

        const orderId = orderData.id;

        // ---------------------------------------------------------------
        // 4. Creer les lignes de commande (sales_order_items)
        // ---------------------------------------------------------------
        const orderItems = cart.map(item => ({
          sales_order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_ht: item.selling_price_ttc / 1.2,
          tax_rate: 20.0,
          total_ht: (item.selling_price_ttc / 1.2) * item.quantity,
          linkme_selection_item_id: item.id, // Lien vers l'item de selection
        }));

        const { error: itemsError } = await supabase
          .from('sales_order_items')
          .insert(orderItems);

        if (itemsError) {
          throw new Error(`Erreur création articles: ${itemsError.message}`);
        }

        // ---------------------------------------------------------------
        // 5. Creer les details LinkMe (sales_order_linkme_details)
        // ---------------------------------------------------------------
        // Determiner le contact de facturation
        let billingName = data.billingName;
        let billingEmail = data.billingEmail;
        let billingPhone = data.billingPhone;

        if (data.billingContactSource === 'step1') {
          billingName = data.requesterName;
          billingEmail = data.requesterEmail;
          billingPhone = data.requesterPhone;
        } else if (data.billingContactSource === 'step2') {
          if (data.ownerContactSameAsRequester) {
            billingName = data.requesterName;
            billingEmail = data.requesterEmail;
            billingPhone = data.requesterPhone;
          } else {
            billingName = data.ownerName;
            billingEmail = data.ownerEmail;
            billingPhone = data.ownerPhone;
          }
        }

        const linkmeDetails = {
          sales_order_id: orderId,
          // Etape 1
          requester_type: data.requesterType,
          requester_name: data.requesterName,
          requester_email: data.requesterEmail,
          requester_phone: data.requesterPhone || null,
          requester_position: data.requesterPosition || null,
          is_new_restaurant: data.isNewRestaurant,
          // Etape 2
          owner_type: data.ownerType,
          owner_contact_same_as_requester: data.ownerContactSameAsRequester,
          owner_name: data.ownerContactSameAsRequester
            ? null
            : data.ownerName || null,
          owner_email: data.ownerContactSameAsRequester
            ? null
            : data.ownerEmail || null,
          owner_phone: data.ownerContactSameAsRequester
            ? null
            : data.ownerPhone || null,
          owner_company_legal_name: data.ownerCompanyLegalName || null,
          owner_company_trade_name: data.ownerCompanyTradeName || null,
          owner_kbis_url: data.ownerKbisUrl,
          // Etape 3
          billing_contact_source: data.billingContactSource,
          billing_name: billingName || null,
          billing_email: billingEmail || null,
          billing_phone: billingPhone || null,
          delivery_terms_accepted: data.deliveryTermsAccepted,
          desired_delivery_date: data.desiredDeliveryDate || null,
          mall_form_required: data.mallFormRequired,
          mall_form_email: data.mallFormEmail || null,
        };

        const { error: detailsError } = await supabase
          .from('sales_order_linkme_details')
          .insert(linkmeDetails);

        if (detailsError) {
          throw new Error(
            `Erreur création détails LinkMe: ${detailsError.message}`
          );
        }

        // ---------------------------------------------------------------
        // 6. Succes
        // ---------------------------------------------------------------
        return {
          success: true,
          orderNumber,
          orderId,
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
