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

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ============================================
// TYPES
// ============================================

export interface ApproveOrderInput {
  orderId: string;
}

export interface RequestInfoInput {
  orderId: string;
  message: string;
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
  created_at: string | null;
  updated_at: string | null;
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
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - pas de détails LinkMe
      return null;
    }
    console.error('Erreur fetch LinkMe details:', error);
    throw error;
  }

  return data as LinkMeOrderDetails;
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

  // 1. Récupérer les détails LinkMe
  const details = await fetchLinkMeOrderDetails(input.orderId);

  if (!details) {
    throw new Error('Détails LinkMe non trouvés pour cette commande');
  }

  // 2. Vérifier que l'Étape 2 est complète (owner_email présent)
  const ownerEmail = details.owner_contact_same_as_requester
    ? details.requester_email
    : details.owner_email;

  if (!ownerEmail) {
    throw new Error(
      'Étape 2 incomplète: contact propriétaire requis pour approbation'
    );
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

  // 5. Mettre à jour le status de la commande
  const { error: orderError } = await supabase
    .from('sales_orders')
    .update({
      status: 'validated',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.orderId);

  if (orderError) {
    console.error('Erreur update sales_order:', orderError);
    throw new Error(`Erreur mise à jour commande: ${orderError.message}`);
  }

  // TODO Phase 3: Envoyer email au contact Étape 2 avec lien tokenisé

  return {
    success: true,
    message: 'Commande approuvée. Email Étape 4 envoyé.',
    step4Token,
  };
}

/**
 * Demande des compléments d'information
 * - TODO: Envoyer email au demandeur avec le message
 * - Log l'action
 */
async function requestInfo(
  input: RequestInfoInput
): Promise<OrderActionResult> {
  const supabase = createClient();

  // 1. Récupérer les détails LinkMe pour avoir l'email du demandeur
  const details = await fetchLinkMeOrderDetails(input.orderId);

  if (!details) {
    throw new Error('Détails LinkMe non trouvés pour cette commande');
  }

  // 2. Ajouter une note à la commande
  const { data: order, error: fetchError } = await supabase
    .from('sales_orders')
    .select('notes')
    .eq('id', input.orderId)
    .single();

  if (fetchError) {
    throw new Error(`Erreur récupération commande: ${fetchError.message}`);
  }

  const timestamp = new Date().toLocaleString('fr-FR');
  const newNote = `[${timestamp}] DEMANDE COMPLEMENTS: ${input.message}`;
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

  // TODO Phase 3: Envoyer email au demandeur (details.requester_email)

  return {
    success: true,
    message: `Demande de compléments envoyée à ${details.requester_email}`,
  };
}

/**
 * Refuse une commande
 * - Met à jour status = 'cancelled'
 * - TODO: Envoyer email au demandeur avec la raison
 */
async function rejectOrder(
  input: RejectOrderInput
): Promise<OrderActionResult> {
  const supabase = createClient();

  // 1. Récupérer les détails LinkMe
  const details = await fetchLinkMeOrderDetails(input.orderId);

  if (!details) {
    throw new Error('Détails LinkMe non trouvés pour cette commande');
  }

  // 2. Ajouter une note avec la raison du refus
  const { data: order, error: fetchError } = await supabase
    .from('sales_orders')
    .select('notes')
    .eq('id', input.orderId)
    .single();

  if (fetchError) {
    throw new Error(`Erreur récupération commande: ${fetchError.message}`);
  }

  const timestamp = new Date().toLocaleString('fr-FR');
  const newNote = `[${timestamp}] COMMANDE REFUSEE: ${input.reason}`;
  const updatedNotes = order.notes ? `${order.notes}\n\n${newNote}` : newNote;

  // 3. Mettre à jour la commande
  const { error: updateError } = await supabase
    .from('sales_orders')
    .update({
      status: 'cancelled',
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.orderId);

  if (updateError) {
    throw new Error(`Erreur mise à jour commande: ${updateError.message}`);
  }

  // TODO Phase 3: Envoyer email au demandeur avec la raison

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      queryClient.invalidateQueries({ queryKey: ['linkme-orders-to-process'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      queryClient.invalidateQueries({ queryKey: ['linkme-orders-to-process'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      queryClient.invalidateQueries({ queryKey: ['linkme-orders-to-process'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
  });
}
