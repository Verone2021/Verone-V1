'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import type { Database } from '@verone/types';
import type { ApproveOrderInput, OrderActionResult } from './types';
import { fetchLinkMeOrderDetails } from './fetch-linkme-details';

/**
 * Approuve une commande Enseigne
 * - Vérifie que owner_email est présent (Étape 2 complète)
 * - Met à jour status = 'validated'
 * - Génère step4_token + expires_at
 * - TODO: Envoyer email au contact Étape 2
 */
async function approveOrder(
  input: ApproveOrderInput
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

  // 1. Récupérer les détails LinkMe
  const details = await fetchLinkMeOrderDetails(input.orderId);

  if (!details) {
    throw new Error('Détails LinkMe non trouvés pour cette commande');
  }

  // 2. Déterminer l'email destinataire
  // - Ouverture (is_new_restaurant) : propriétaire (owner_email)
  // - Restaurant existant : demandeur (requester_email)
  const ownerEmail = details.is_new_restaurant
    ? details.owner_contact_same_as_requester
      ? details.requester_email
      : details.owner_email
    : details.requester_email;

  if (!ownerEmail) {
    throw new Error("Email destinataire manquant pour l'approbation");
  }

  // 2b. CASCADE: Si ouverture (is_new_restaurant = true), approuver l'organisation + vérifier contacts
  if (details.is_new_restaurant) {
    // Fetch current order to check if org + contacts already exist (created by RPC)
    const { data: orderCheck } = await supabase
      .from('sales_orders')
      .select('customer_id, responsable_contact_id, billing_contact_id')
      .eq('id', input.orderId)
      .single();

    if (orderCheck?.customer_id) {
      // Organisation already created by RPC — just approve it
      const { error: approveOrgError } = await supabase
        .from('organisations')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', orderCheck.customer_id);

      if (approveOrgError) {
        console.error('Erreur approbation organisation:', approveOrgError);
        throw new Error(
          `Erreur approbation organisation: ${approveOrgError.message}`
        );
      }
    }

    // Contacts: dedup by email — prefer existing contact in the org
    const orgId = orderCheck?.customer_id ?? '';

    if (!orderCheck?.responsable_contact_id && details.owner_email) {
      // Check if a contact with this email already exists in the org
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('organisation_id', orgId)
        .eq('email', details.owner_email)
        .limit(1)
        .maybeSingle();

      if (existingContact) {
        // Reuse existing contact
        await supabase
          .from('sales_orders')
          .update({ responsable_contact_id: existingContact.id })
          .eq('id', input.orderId);
      } else {
        // Create new contact (edge case: RPC didn't create it)
        const ownerName = details.owner_name ?? '';
        const ownerNameParts = ownerName.split(' ');
        const contactData: Database['public']['Tables']['contacts']['Insert'] =
          {
            organisation_id: orgId,
            first_name: ownerNameParts[0] ?? '',
            last_name: ownerNameParts.slice(1).join(' ') ?? '',
            email: details.owner_email,
            phone: details.owner_phone ?? null,
            is_primary_contact: true,
          };
        const { data: newContact, error: ownerContactError } = await supabase
          .from('contacts')
          .insert(contactData)
          .select('id')
          .single();

        if (ownerContactError) {
          console.error(
            'Erreur création contact propriétaire:',
            ownerContactError
          );
        } else if (newContact) {
          await supabase
            .from('sales_orders')
            .update({ responsable_contact_id: newContact.id })
            .eq('id', input.orderId);
        }
      }
    }

    if (
      !orderCheck?.billing_contact_id &&
      details.billing_contact_source === 'custom' &&
      details.billing_email &&
      details.billing_email !== details.owner_email
    ) {
      // Check if a contact with this email already exists in the org
      const { data: existingBilling } = await supabase
        .from('contacts')
        .select('id')
        .eq('organisation_id', orgId)
        .eq('email', details.billing_email)
        .limit(1)
        .maybeSingle();

      if (existingBilling) {
        // Reuse existing contact
        await supabase
          .from('sales_orders')
          .update({ billing_contact_id: existingBilling.id })
          .eq('id', input.orderId);
      } else {
        const billingName = details.billing_name ?? '';
        const billingNameParts = billingName.split(' ');
        const { data: newBilling, error: billingContactError } = await supabase
          .from('contacts')
          .insert({
            organisation_id: orgId,
            first_name: billingNameParts[0] ?? '',
            last_name: billingNameParts.slice(1).join(' ') ?? '',
            email: details.billing_email,
            phone: details.billing_phone,
            is_billing_contact: true,
          })
          .select('id')
          .single();

        if (billingContactError) {
          console.error(
            'Erreur création contact facturation:',
            billingContactError
          );
        } else if (newBilling) {
          await supabase
            .from('sales_orders')
            .update({ billing_contact_id: newBilling.id })
            .eq('id', input.orderId);
        }
      }
    }
  }

  // 3. Générer le token Étape 4 (UUID)
  const step4Token = crypto.randomUUID();
  const step4ExpiresAt = new Date();
  step4ExpiresAt.setDate(step4ExpiresAt.getDate() + 30); // Expire dans 30 jours

  // 4. Mettre à jour les détails LinkMe avec le token
  const { error: detailsError } = await supabase
    .from('sales_order_linkme_details')
    .update({
      step4_token: step4Token,
      step4_token_expires_at: step4ExpiresAt.toISOString(),
    })
    .eq('sales_order_id', input.orderId);

  if (detailsError) {
    console.error('Erreur update LinkMe details:', detailsError);
    throw new Error(`Erreur mise à jour détails: ${detailsError.message}`);
  }

  // 5. Mettre à jour le status de la commande → draft (PAS validated)
  // L'admin pourra modifier prix/marges en draft, puis valider manuellement
  // confirmed_at/confirmed_by appartiennent à la validation, pas à l'approbation
  const { error: orderError } = await supabase
    .from('sales_orders')
    .update({
      status: 'draft',
      pending_admin_validation: false,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', input.orderId);

  if (orderError) {
    console.error('Erreur update sales_order:', orderError);
    throw new Error(`Erreur mise à jour commande: ${orderError.message}`);
  }

  // 6. Récupérer les infos et envoyer email
  const { data: orderData } = await supabase
    .from('sales_orders')
    .select('order_number, total_ttc, customer_id, customer_type')
    .eq('id', input.orderId)
    .single();
  const ownerName = details.is_new_restaurant
    ? details.owner_contact_same_as_requester
      ? details.requester_name
      : (details.owner_name ?? details.requester_name)
    : details.requester_name;
  // Requête séparée pour l'organisation (pas de FK car customer_id est polymorphique)
  let organisationName: string | null = null;
  if (orderData?.customer_type === 'organization' && orderData?.customer_id) {
    const { data: org } = await supabase
      .from('organisations')
      .select('trade_name, legal_name')
      .eq('id', orderData.customer_id)
      .single();
    organisationName = org?.trade_name ?? org?.legal_name ?? null;
  }

  let emailSent = true;
  try {
    const emailResponse = await fetch('/api/emails/linkme-order-approved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salesOrderId: input.orderId,
        orderNumber: orderData?.order_number,
        ownerEmail,
        ownerName,
        step4Token,
        organisationName,
        totalTtc: orderData?.total_ttc ?? 0,
      }),
    });
    if (!emailResponse.ok) {
      console.error(
        'Erreur envoi email approbation: HTTP',
        emailResponse.status
      );
      emailSent = false;
    }
  } catch (emailError) {
    console.error('Erreur envoi email approbation:', emailError);
    emailSent = false;
  }

  return {
    success: true,
    message: emailSent
      ? 'Commande approuvée. Email Étape 4 envoyé.'
      : 'Commande approuvée. ATTENTION: email non envoyé (vérifier manuellement).',
    step4Token,
  };
}

/**
 * Hook: approuver une commande Enseigne
 */
export function useApproveOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveOrder,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkme-orders'] }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-orders-to-process'],
        }),
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
      ]);
    },
  });
}
