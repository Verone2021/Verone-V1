/**
 * Hook: useLinkMeOrderActions
 * Actions back-office pour commandes Enseigne LinkMe
 * =====================================================
 * Actions:
 * - approveOrder: approuve et génère token Étape 4
 * - requestInfo: demande compléments au demandeur
 * - rejectOrder: refuse la commande
 * =====================================================
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import type { Database } from '@verone/types';

// ============================================
// TYPES
// ============================================

export interface ApproveOrderInput {
  orderId: string;
}

export interface RequestInfoMissingField {
  key: string;
  label: string;
  category: string;
  inputType: string;
}

export interface RequestInfoInput {
  orderId: string;
  customMessage?: string;
  /** Champs manquants détectés — envoyés au formulaire interactif */
  missingFields: RequestInfoMissingField[];
  /** Destinataire : demandeur ou propriétaire */
  recipientType?: 'requester' | 'owner';
}

export interface RejectOrderInput {
  orderId: string;
  reason: string;
}

export interface OrderActionResult {
  success: boolean;
  message: string;
  step4Token?: string;
}

// ============================================
// FETCH LINKME DETAILS
// ============================================

export interface LinkMeOrderDetails {
  id: string;
  sales_order_id: string;
  requester_type: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  requester_position: string | null;
  is_new_restaurant: boolean;
  owner_type: string | null;
  owner_contact_same_as_requester: boolean | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  owner_company_legal_name: string | null;
  owner_company_trade_name: string | null;
  owner_kbis_url: string | null;
  billing_contact_source: string | null;
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  delivery_terms_accepted: boolean | null;
  delivery_date: string | null;
  desired_delivery_date: string | null;
  mall_form_required: boolean | null;
  mall_form_email: string | null;
  step4_token: string | null;
  step4_token_expires_at: string | null;
  step4_completed_at: string | null;
  reception_contact_name: string | null;
  reception_contact_email: string | null;
  reception_contact_phone: string | null;
  confirmed_delivery_date: string | null;
  // Delivery fields (from form Step 7)
  delivery_contact_name: string | null;
  delivery_contact_email: string | null;
  delivery_contact_phone: string | null;
  delivery_address: string | null;
  delivery_postal_code: string | null;
  delivery_city: string | null;
  delivery_notes: string | null;
  is_mall_delivery: boolean | null;
  mall_email: string | null;
  semi_trailer_accessible: boolean | null;
  access_form_required: boolean | null;
  access_form_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  /** Field keys explicitly ignored by back-office staff for this order */
  ignored_missing_fields: string[];
}

/**
 * Récupère les détails LinkMe d'une commande
 */
export async function fetchLinkMeOrderDetails(
  orderId: string
): Promise<LinkMeOrderDetails | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sales_order_linkme_details')
    .select('*')
    .eq('sales_order_id', orderId)
    .maybeSingle();

  if (error) {
    console.error('Erreur fetch LinkMe details:', error);
    throw error;
  }

  return data as LinkMeOrderDetails | null;
}

// ============================================
// ACTION FUNCTIONS
// ============================================

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
 * Demande des compléments d'information
 * - Envoie email au demandeur avec le message
 * - Log l'action
 */
async function requestInfo(
  input: RequestInfoInput
): Promise<OrderActionResult> {
  const supabase = createClient();

  // Paralléliser les requêtes pour éviter séquentiel (fix perf)
  const [details, orderResult, userResult] = await Promise.all([
    // 1. Récupérer les détails LinkMe
    fetchLinkMeOrderDetails(input.orderId),
    // 2. Récupérer la commande
    supabase
      .from('sales_orders')
      .select('order_number, notes, total_ttc, customer_id, customer_type')
      .eq('id', input.orderId)
      .single(),
    // 3. Récupérer l'utilisateur courant (sentBy)
    supabase.auth.getUser(),
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
  const currentUserId = userResult.data.user?.id;

  if (!currentUserId) {
    throw new Error('Utilisateur non authentifié');
  }

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

  // Déterminer le destinataire (requester par défaut, owner si spécifié)
  const recipientType = input.recipientType ?? 'requester';
  const recipientEmail =
    recipientType === 'owner' && details.owner_email
      ? details.owner_email
      : details.requester_email;
  const recipientName =
    recipientType === 'owner' && details.owner_name
      ? details.owner_name
      : details.requester_name;

  // Logger la demande dans les notes de la commande
  const timestamp = new Date().toLocaleString('fr-FR');
  const noteMessage = input.customMessage ?? 'Formulaire interactif envoyé';
  const fieldsSummary = input.missingFields.map(f => f.label).join(', ');
  const newNote = `[${timestamp}] DEMANDE COMPLEMENTS (formulaire): ${noteMessage} [Champs: ${fieldsSummary}]`;
  const updatedNotes = order.notes ? `${order.notes}\n\n${newNote}` : newNote;

  const { error: updateError } = await supabase
    .from('sales_orders')
    .update({
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.orderId);

  if (updateError) {
    throw new Error(`Erreur mise à jour notes: ${updateError.message}`);
  }

  // Appeler le nouvel endpoint formulaire interactif
  const emailResponse = await fetch('/api/emails/linkme-info-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      salesOrderId: input.orderId,
      orderNumber: order.order_number,
      recipientEmail,
      recipientName,
      recipientType,
      organisationName,
      totalTtc: order.total_ttc ?? 0,
      requestedFields: input.missingFields,
      customMessage: input.customMessage,
      sentBy: currentUserId,
    }),
  });

  if (!emailResponse.ok) {
    const errorData = (await emailResponse.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(
      `Erreur envoi formulaire: ${errorData?.error ?? `HTTP ${emailResponse.status}`}`
    );
  }

  return {
    success: true,
    message: `Formulaire de compléments envoyé à ${recipientEmail}`,
  };
}

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

// ============================================
// HOOKS REACT-QUERY
// ============================================

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

/**
 * Hook: demander des compléments
 */
export function useRequestInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestInfo,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkme-orders'] }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-orders-to-process'],
        }),
      ]);
    },
  });
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

// ============================================
// UPDATE LINKME DETAILS (ÉDITION BACK-OFFICE)
// ============================================

export interface UpdateLinkMeDetailsInput {
  orderId: string;
  updates: Partial<{
    // Étape 1: Demandeur
    requester_type: string;
    requester_name: string;
    requester_email: string;
    requester_phone: string | null;
    requester_position: string | null;
    is_new_restaurant: boolean;
    // Étape 2: Propriétaire
    owner_type: string | null;
    owner_contact_same_as_requester: boolean | null;
    owner_name: string | null;
    owner_email: string | null;
    owner_phone: string | null;
    owner_company_legal_name: string | null;
    owner_company_trade_name: string | null;
    owner_kbis_url: string | null;
    // Étape 3: Facturation
    billing_contact_source: string | null;
    billing_name: string | null;
    billing_email: string | null;
    billing_phone: string | null;
    // Livraison
    delivery_terms_accepted: boolean | null;
    desired_delivery_date: string | null;
    mall_form_required: boolean | null;
    mall_form_email: string | null;
    delivery_contact_name: string | null;
    delivery_contact_email: string | null;
    delivery_contact_phone: string | null;
    delivery_address: string | null;
    delivery_postal_code: string | null;
    delivery_city: string | null;
    delivery_notes: string | null;
    is_mall_delivery: boolean | null;
    mall_email: string | null;
    semi_trailer_accessible: boolean | null;
    access_form_required: boolean | null;
    access_form_url: string | null;
    // Post-approbation
    reception_contact_name: string | null;
    reception_contact_email: string | null;
    reception_contact_phone: string | null;
    confirmed_delivery_date: string | null;
  }>;
}

/**
 * Mise à jour des détails LinkMe d'une commande
 * Utilisé par l'admin pour compléter/modifier les infos des Étapes 1-3
 */
async function updateLinkMeDetails(
  input: UpdateLinkMeDetailsInput
): Promise<{ success: boolean }> {
  const supabase = createClient();

  // Convertir les valeurs undefined en conservant null uniquement où autorisé
  const cleanedUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input.updates)) {
    if (value !== undefined) {
      cleanedUpdates[key] = value;
    }
  }

  type LinkMeDetailsInsert =
    Database['public']['Tables']['sales_order_linkme_details']['Insert'];

  // Required NOT NULL fields for INSERT (defaults for new records)
  const upsertData: LinkMeDetailsInsert = {
    sales_order_id: input.orderId,
    requester_type: 'manual_entry',
    requester_name: '',
    requester_email: '',
    ...cleanedUpdates,
    updated_at: new Date().toISOString(),
  } as LinkMeDetailsInsert;

  const { error } = await supabase
    .from('sales_order_linkme_details')
    .upsert(upsertData, { onConflict: 'sales_order_id' });

  if (error) {
    console.error('Erreur update LinkMe details:', error);
    throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
  }

  return { success: true };
}

/**
 * Hook: useUpdateLinkMeDetails
 * Permet à l'admin de modifier les détails LinkMe d'une commande
 */
export function useUpdateLinkMeDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLinkMeDetails,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkme-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['pending-orders'] }),
      ]);
    },
  });
}

// ============================================
// PENDING ORDERS FOR APPROBATIONS
// ============================================

export interface PendingOrderItem {
  id: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  products: {
    id: string;
    name: string;
    sku: string;
    primary_image_url: string | null;
  } | null;
}

export interface PendingOrderLinkMeDetails {
  is_new_restaurant: boolean;
  requester_type: string | null;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  requester_position: string | null;
  owner_type: string | null;
  owner_contact_same_as_requester: boolean | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  owner_company_legal_name: string | null;
  owner_company_trade_name: string | null;
  billing_contact_source: string | null;
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  delivery_contact_name: string | null;
  delivery_contact_email: string | null;
  delivery_contact_phone: string | null;
  delivery_address: string | null;
  delivery_postal_code: string | null;
  delivery_city: string | null;
  is_mall_delivery: boolean | null;
  mall_email: string | null;
  desired_delivery_date: string | null;
  mall_form_required: boolean | null;
  ignored_missing_fields: string[] | null;
  missing_fields_count: number | null;
}

export interface PendingOrder {
  id: string;
  order_number: string;
  linkme_display_number: string | null;
  status: string;
  total_ht: number;
  total_ttc: number;
  created_at: string;
  // LinkMe details (simple)
  requester_name: string | null;
  requester_email: string | null;
  requester_type: string | null;
  // Organisation
  organisation_name: string | null;
  enseigne_name: string | null;
  organisation_siret: string | null;
  organisation_country: string | null;
  organisation_vat_number: string | null;
  // Enriched data for detail view
  linkme_details: PendingOrderLinkMeDetails | null;
  items: PendingOrderItem[];
}

/**
 * Hook: compte le nombre de commandes en attente de validation
 */
export function usePendingOrdersCount() {
  return useQuery({
    queryKey: ['pending-orders-count'],
    queryFn: async (): Promise<number> => {
      const supabase = createClient();

      const { count, error } = await supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .eq('pending_admin_validation', true);

      if (error) {
        console.error('Error fetching pending orders count:', error);
        throw error;
      }

      return count ?? 0;
    },
    staleTime: 120000, // 2 minutes
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook: récupère les commandes en attente de validation
 * Enrichi avec les détails LinkMe et les items pour la vue détail
 */
export function usePendingOrders() {
  return useQuery({
    queryKey: ['pending-orders'],
    queryFn: async (): Promise<PendingOrder[]> => {
      const supabase = createClient();

      // Fetch orders with pending_admin_validation = true
      const { data: orders, error } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          linkme_display_number,
          status,
          total_ht,
          total_ttc,
          created_at,
          customer_id,
          customer_type,
          sales_order_linkme_details (
            is_new_restaurant,
            requester_type,
            requester_name,
            requester_email,
            requester_phone,
            requester_position,
            owner_type,
            owner_contact_same_as_requester,
            owner_name,
            owner_email,
            owner_phone,
            owner_company_legal_name,
            owner_company_trade_name,
            billing_contact_source,
            billing_name,
            billing_email,
            billing_phone,
            desired_delivery_date,
            mall_form_required
          ),
          sales_order_items (
            id,
            quantity,
            unit_price_ht,
            total_ht,
            products (
              id,
              name,
              sku,
              product_images!left(public_url, is_primary)
            )
          )
        `
        )
        .eq('pending_admin_validation', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending orders:', error);
        throw error;
      }

      // BATCH: Récupérer toutes les organisations en UNE SEULE requête (fix N+1)
      const organisationIds = (orders ?? [])
        .filter(o => o.customer_type === 'organization' && o.customer_id)
        .map(o => o.customer_id)
        .filter((id): id is string => id !== null);

      const organisationsMap = new Map<
        string,
        {
          trade_name: string | null;
          legal_name: string | null;
          enseigne_name: string | null;
        }
      >();

      if (organisationIds.length > 0) {
        const { data: orgsData } = await supabase
          .from('organisations')
          .select('id, trade_name, legal_name, enseigne:enseigne_id(name)')
          .in('id', organisationIds)
          .returns<
            {
              id: string;
              trade_name: string | null;
              legal_name: string;
              enseigne: { name: string | null } | null;
            }[]
          >();

        if (orgsData) {
          for (const org of orgsData) {
            organisationsMap.set(org.id, {
              trade_name: org.trade_name,
              legal_name: org.legal_name,
              enseigne_name: org.enseigne?.name ?? null,
            });
          }
        }
      }

      // Map orders with organisation data from the batch
      const enrichedOrders: PendingOrder[] = [];

      for (const order of orders ?? []) {
        // Get organisation name from cached map (no additional query)
        let organisationName: string | null = null;
        let enseigneName: string | null = null;

        if (order.customer_type === 'organization' && order.customer_id) {
          const orgData = organisationsMap.get(order.customer_id);
          if (orgData) {
            organisationName = orgData.trade_name ?? orgData.legal_name;
            enseigneName = orgData.enseigne_name;
          }
        }

        // Extract linkme details (can be single object or array depending on Supabase query)
        const linkmeDetailsRaw = order.sales_order_linkme_details as
          | LinkMeOrderDetails
          | LinkMeOrderDetails[]
          | undefined;
        const linkmeDetails = Array.isArray(linkmeDetailsRaw)
          ? (linkmeDetailsRaw[0] ?? null)
          : (linkmeDetailsRaw ?? null);

        // Map items with proper typing and extract primary image
        const items: PendingOrderItem[] = (
          (order.sales_order_items as Array<{
            id: string;
            quantity: number;
            unit_price_ht: number | null;
            total_ht: number | null;
            products?: {
              id: string;
              name: string;
              sku: string;
              product_images?: Array<{
                public_url: string;
                is_primary: boolean;
              }>;
            };
          }>) ?? []
        ).map(item => {
          // Extract primary image from product_images array
          const productImages = item.products?.product_images as
            | Array<{ public_url: string; is_primary: boolean }>
            | undefined;
          const primaryImage =
            productImages?.find(img => img.is_primary)?.public_url ??
            productImages?.[0]?.public_url ??
            null;

          return {
            id: item.id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht as number,
            total_ht: item.total_ht as number,
            products: item.products
              ? {
                  id: item.products.id,
                  name: item.products.name,
                  sku: item.products.sku,
                  primary_image_url: primaryImage,
                }
              : null,
          };
        });

        enrichedOrders.push({
          id: order.id,
          order_number: order.order_number,
          linkme_display_number:
            (order as unknown as { linkme_display_number?: string | null })
              .linkme_display_number ?? null,
          status: order.status,
          total_ht: order.total_ht,
          total_ttc: order.total_ttc,
          created_at: order.created_at,
          requester_name: linkmeDetails?.requester_name ?? null,
          requester_email: linkmeDetails?.requester_email ?? null,
          requester_type: linkmeDetails?.requester_type ?? null,
          organisation_name: organisationName,
          enseigne_name: enseigneName,
          linkme_details: linkmeDetails
            ? {
                is_new_restaurant: linkmeDetails.is_new_restaurant ?? false,
                requester_type: linkmeDetails.requester_type,
                requester_name: linkmeDetails.requester_name,
                requester_email: linkmeDetails.requester_email,
                requester_phone: linkmeDetails.requester_phone,
                requester_position: linkmeDetails.requester_position,
                owner_type: linkmeDetails.owner_type,
                owner_contact_same_as_requester:
                  linkmeDetails.owner_contact_same_as_requester,
                owner_name: linkmeDetails.owner_name,
                owner_email: linkmeDetails.owner_email,
                owner_phone: linkmeDetails.owner_phone,
                owner_company_legal_name:
                  linkmeDetails.owner_company_legal_name,
                owner_company_trade_name:
                  linkmeDetails.owner_company_trade_name,
                billing_contact_source: linkmeDetails.billing_contact_source,
                billing_name: linkmeDetails.billing_name,
                billing_email: linkmeDetails.billing_email,
                billing_phone: linkmeDetails.billing_phone,
                desired_delivery_date: linkmeDetails.desired_delivery_date,
                mall_form_required: linkmeDetails.mall_form_required,
              }
            : null,
          items,
        });
      }

      return enrichedOrders;
    },
    staleTime: 300_000,
  });
}

// ============================================
// TYPE: Order Validation Status Filter
// ============================================

export type OrderValidationStatus = 'pending' | 'approved' | 'rejected';

/**
 * Hook: récupère toutes les commandes LinkMe avec filtre par status de validation
 * - pending: pending_admin_validation = true
 * - approved: pending_admin_validation = false AND status != 'cancelled'
 * - rejected: status = 'cancelled'
 */
export function useAllLinkMeOrders(status?: OrderValidationStatus) {
  return useQuery({
    queryKey: ['linkme-orders', status],
    queryFn: async (): Promise<PendingOrder[]> => {
      const supabase = createClient();

      // Base query for LinkMe orders
      let query = supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          linkme_display_number,
          status,
          total_ht,
          total_ttc,
          created_at,
          customer_id,
          customer_type,
          pending_admin_validation,
          sales_order_linkme_details (
            is_new_restaurant,
            requester_type,
            requester_name,
            requester_email,
            requester_phone,
            requester_position,
            owner_type,
            owner_contact_same_as_requester,
            owner_name,
            owner_email,
            owner_phone,
            owner_company_legal_name,
            owner_company_trade_name,
            billing_contact_source,
            billing_name,
            billing_email,
            billing_phone,
            delivery_contact_name,
            delivery_contact_email,
            delivery_contact_phone,
            delivery_address,
            delivery_postal_code,
            delivery_city,
            is_mall_delivery,
            mall_email,
            desired_delivery_date,
            mall_form_required,
            ignored_missing_fields,
            missing_fields_count
          ),
          sales_order_items (
            id,
            quantity,
            unit_price_ht,
            total_ht,
            products (
              id,
              name,
              sku,
              product_images!left(public_url, is_primary)
            )
          )
        `
        )
        .not('linkme_selection_id', 'is', null)
        .not('status', 'in', '(shipped,delivered)');

      // Apply status filter
      if (status === 'pending') {
        query = query.eq('pending_admin_validation', true);
      } else if (status === 'approved') {
        query = query.not('confirmed_at', 'is', null);
      } else if (status === 'rejected') {
        query = query.eq('status', 'cancelled');
      }

      const { data: orders, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        console.error('Error fetching LinkMe orders:', error);
        throw error;
      }

      // BATCH: Récupérer toutes les organisations en UNE SEULE requête
      const organisationIds = (orders ?? [])
        .filter(o => o.customer_type === 'organization' && o.customer_id)
        .map(o => o.customer_id)
        .filter((id): id is string => id !== null);

      const organisationsMap = new Map<
        string,
        {
          trade_name: string | null;
          legal_name: string | null;
          enseigne_name: string | null;
          siret: string | null;
          country: string | null;
          vat_number: string | null;
        }
      >();

      if (organisationIds.length > 0) {
        const { data: orgsData } = await supabase
          .from('organisations')
          .select(
            `
            id,
            trade_name,
            legal_name,
            siret,
            country,
            vat_number,
            enseignes!left(name)
          `
          )
          .in('id', organisationIds);

        if (orgsData) {
          orgsData.forEach((org: Record<string, unknown>) => {
            const enseignes = org.enseignes as
              | { name: string }
              | { name: string }[]
              | null;
            const enseigneName = enseignes
              ? Array.isArray(enseignes)
                ? (enseignes[0]?.name ?? null)
                : (enseignes.name ?? null)
              : null;
            organisationsMap.set(org.id as string, {
              trade_name: org.trade_name as string | null,
              legal_name: org.legal_name as string | null,
              enseigne_name: enseigneName,
              siret: (org.siret as string | null) ?? null,
              country: (org.country as string | null) ?? null,
              vat_number: (org.vat_number as string | null) ?? null,
            });
          });
        }
      }

      // Enrichir les commandes
      const enrichedOrders: PendingOrder[] = [];

      for (const order of orders ?? []) {
        const linkmeDetails = order.sales_order_linkme_details as Record<
          string,
          unknown
        > | null;
        const rawItems = order.sales_order_items as Record<string, unknown>[];

        const orgData = order.customer_id
          ? organisationsMap.get(order.customer_id)
          : null;

        const items: PendingOrderItem[] = (rawItems ?? []).map(item => {
          const products = item.products as Record<string, unknown> | null;
          const productImages = products?.product_images as
            | { public_url: string; is_primary: boolean }[]
            | null;
          const primaryImage = productImages?.find(img => img.is_primary);

          return {
            id: item.id as string,
            quantity: item.quantity as number,
            unit_price_ht: item.unit_price_ht as number,
            total_ht: item.total_ht as number,
            products: products
              ? {
                  id: products.id as string,
                  name: products.name as string,
                  sku: (products.sku as string) ?? '',
                  primary_image_url: primaryImage?.public_url ?? null,
                }
              : null,
          };
        });

        enrichedOrders.push({
          id: order.id,
          order_number: order.order_number,
          linkme_display_number:
            (order as unknown as { linkme_display_number?: string | null })
              .linkme_display_number ?? null,
          status: order.status,
          total_ht: order.total_ht,
          total_ttc: order.total_ttc,
          created_at: order.created_at,
          organisation_name: orgData?.trade_name ?? orgData?.legal_name ?? null,
          enseigne_name: orgData?.enseigne_name ?? null,
          requester_type: linkmeDetails?.requester_type as string | null,
          requester_name: linkmeDetails?.requester_name as string | null,
          requester_email: linkmeDetails?.requester_email as string | null,
          linkme_details: linkmeDetails
            ? {
                is_new_restaurant:
                  (linkmeDetails.is_new_restaurant as boolean) ?? false,
                requester_type: linkmeDetails.requester_type as string | null,
                requester_name: linkmeDetails.requester_name as string | null,
                requester_email: linkmeDetails.requester_email as string | null,
                requester_phone: linkmeDetails.requester_phone as string | null,
                requester_position: linkmeDetails.requester_position as
                  | string
                  | null,
                owner_type: linkmeDetails.owner_type as string | null,
                owner_contact_same_as_requester:
                  linkmeDetails.owner_contact_same_as_requester as
                    | boolean
                    | null,
                owner_name: linkmeDetails.owner_name as string | null,
                owner_email: linkmeDetails.owner_email as string | null,
                owner_phone: linkmeDetails.owner_phone as string | null,
                owner_company_legal_name:
                  linkmeDetails.owner_company_legal_name as string | null,
                owner_company_trade_name:
                  linkmeDetails.owner_company_trade_name as string | null,
                billing_contact_source: linkmeDetails.billing_contact_source as
                  | string
                  | null,
                billing_name: linkmeDetails.billing_name as string | null,
                billing_email: linkmeDetails.billing_email as string | null,
                billing_phone: linkmeDetails.billing_phone as string | null,
                delivery_contact_name: linkmeDetails.delivery_contact_name as
                  | string
                  | null,
                delivery_contact_email: linkmeDetails.delivery_contact_email as
                  | string
                  | null,
                delivery_contact_phone: linkmeDetails.delivery_contact_phone as
                  | string
                  | null,
                delivery_address: linkmeDetails.delivery_address as
                  | string
                  | null,
                delivery_postal_code: linkmeDetails.delivery_postal_code as
                  | string
                  | null,
                delivery_city: linkmeDetails.delivery_city as string | null,
                is_mall_delivery: linkmeDetails.is_mall_delivery as
                  | boolean
                  | null,
                mall_email: linkmeDetails.mall_email as string | null,
                desired_delivery_date: linkmeDetails.desired_delivery_date as
                  | string
                  | null,
                mall_form_required: linkmeDetails.mall_form_required as
                  | boolean
                  | null,
                ignored_missing_fields: linkmeDetails.ignored_missing_fields as
                  | string[]
                  | null,
                missing_fields_count: linkmeDetails.missing_fields_count as
                  | number
                  | null,
              }
            : null,
          organisation_siret: orgData?.siret ?? null,
          organisation_country: orgData?.country ?? null,
          organisation_vat_number: orgData?.vat_number ?? null,
          items,
        });
      }

      return enrichedOrders;
    },
    staleTime: 300_000,
  });
}
