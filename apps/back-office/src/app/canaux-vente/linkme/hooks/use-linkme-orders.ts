/**
 * Hook: useLinkMeOrders
 * Gestion des commandes LinkMe
 * =====================================================
 * CORRECTIF 2025-12-07 : Mapping DB corrigé
 * - customer_id au lieu de customer_organisation_id/individual_customer_id
 * - order_number généré via generate_so_number
 * - created_by récupéré depuis la session
 * =====================================================
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ID du canal LinkMe (récupéré depuis les sales_channels)
export const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

// ============================================
// TYPES
// ============================================

export interface LinkMeOrderItemInput {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price_ht: number;
  /** Taux de rétrocession (commission affilié) en décimal */
  retrocession_rate: number;
  /** ID de l'item de sélection (pour traçabilité) */
  linkme_selection_item_id?: string;
  /** Prix de base HT pour calcul commission (avant majoration affilié) */
  base_price_ht: number;
}

export interface CreateLinkMeOrderInput {
  /** Type de client: 'organization' ou 'individual' */
  customer_type: 'organization' | 'individual';
  /** ID de l'organisation (si customer_type = 'organization') */
  customer_organisation_id?: string | null;
  /** ID du particulier (si customer_type = 'individual') */
  individual_customer_id?: string | null;
  /** ID de l'affilié (pour les commissions) */
  affiliate_id: string;
  /** Lignes de commande */
  items: LinkMeOrderItemInput[];
  /** Taux de TVA (décimal, ex: 0.2 pour 20%) - défaut 20% */
  tax_rate?: number;
  /** Notes internes */
  internal_notes?: string;
  /** Adresse de livraison */
  shipping_address?: {
    address_line1: string;
    address_line2?: string;
    city: string;
    postal_code: string;
    country: string;
  };
}

export interface LinkMeOrder {
  id: string;
  order_number: string;
  channel_id: string;
  customer_type: 'organization' | 'individual';
  customer_organisation_id: string | null;
  individual_customer_id: string | null;
  status: string;
  payment_status: string;
  total_ht: number;
  total_ttc: number;
  created_at: string;
  updated_at: string;
  // Relations
  organisation?: {
    id: string;
    trade_name: string | null;
    legal_name: string;
  } | null;
  individual_customer?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  items?: LinkMeOrderItem[];
}

export interface LinkMeOrderItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  retrocession_rate: number | null;
  retrocession_amount: number | null;
  linkme_selection_item_id: string | null;
}

// ============================================
// FETCH FUNCTIONS
// ============================================

/**
 * Récupère les commandes LinkMe (canal = LinkMe)
 * Note: customer_id est polymorphique (organisation OU individual)
 */
async function fetchLinkMeOrders(): Promise<LinkMeOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sales_orders')
    .select(
      `
      id,
      order_number,
      channel_id,
      customer_id,
      customer_type,
      status,
      payment_status,
      total_ht,
      total_ttc,
      created_at,
      updated_at
    `
    )
    .eq('channel_id', LINKME_CHANNEL_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch commandes LinkMe:', error);
    throw error;
  }

  // Mapper les données pour compatibilité avec l'interface LinkMeOrder
  return (data || []).map((order: any) => ({
    ...order,
    // Pour compatibilité avec l'ancienne interface
    customer_organisation_id:
      order.customer_type === 'organization' ? order.customer_id : null,
    individual_customer_id:
      order.customer_type === 'individual' ? order.customer_id : null,
  }));
}

/**
 * Crée une commande LinkMe
 * =====================================================
 * MAPPING DB CORRIGÉ :
 * - customer_id : ID unique du client (org OU individual)
 * - customer_type : 'organization' ou 'individual'
 * - order_number : généré via generate_so_number
 * - created_by : ID de l'utilisateur connecté
 * =====================================================
 */
async function createLinkMeOrder(
  input: CreateLinkMeOrderInput
): Promise<LinkMeOrder> {
  const supabase = createClient();

  // 0. Récupérer l'utilisateur connecté (OBLIGATOIRE pour created_by)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Utilisateur non connecté. Veuillez vous reconnecter.');
  }

  // 1. Générer le numéro de commande via RPC
  const { data: orderNumber, error: numberError } =
    await supabase.rpc('generate_so_number');

  if (numberError) {
    console.error('Erreur génération numéro commande:', numberError);
    throw new Error('Impossible de générer le numéro de commande');
  }

  // 2. Calculer les totaux
  let totalHt = 0;
  let totalRetrocession = 0;

  for (const item of input.items) {
    const lineTotal = item.quantity * item.unit_price_ht;
    totalHt += lineTotal;
    // Commission calculée sur base_price_ht (135€), pas sur unit_price_ht (168.75€)
    totalRetrocession +=
      item.quantity * item.base_price_ht * item.retrocession_rate;
  }

  // TVA (défaut 20% si non spécifié)
  const taxRate = input.tax_rate ?? 0.2;
  const totalTtc = totalHt * (1 + taxRate);

  // 3. Déterminer le customer_id (organisation OU individual)
  const customerId =
    input.customer_type === 'organization'
      ? input.customer_organisation_id
      : input.individual_customer_id;

  if (!customerId) {
    throw new Error('ID client requis');
  }

  // 4. Créer la commande avec les VRAIS champs de la table sales_orders
  const orderData = {
    order_number: orderNumber,
    channel_id: LINKME_CHANNEL_ID,
    customer_id: customerId,
    customer_type: input.customer_type,
    created_by: user.id,
    status: 'draft' as const,
    payment_status: 'pending',
    total_ht: totalHt,
    total_ttc: totalTtc,
    tax_rate: taxRate,
    notes: input.internal_notes || null,
    // Adresse de livraison (JSON)
    shipping_address: input.shipping_address
      ? JSON.stringify({
          address_line1: input.shipping_address.address_line1,
          address_line2: input.shipping_address.address_line2 || '',
          city: input.shipping_address.city,
          postal_code: input.shipping_address.postal_code,
          country: input.shipping_address.country || 'FR',
        })
      : null,
  };

  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError) {
    console.error('Erreur création commande:', orderError);
    throw new Error(
      `Erreur création commande: ${orderError.message || 'Erreur inconnue'}`
    );
  }

  // 5. Créer les lignes de commande
  // Note: product_name, sku et total_ht ne sont PAS des colonnes inserables
  // - product_name/sku : récupérés via jointure products
  // - total_ht : colonne GENERATED (calculée automatiquement)
  const orderItems = input.items.map(item => ({
    sales_order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price_ht: item.unit_price_ht,
    // total_ht est GENERATED - ne pas l'insérer
    tax_rate: taxRate,
    retrocession_rate: item.retrocession_rate,
    retrocession_amount:
      item.quantity * item.unit_price_ht * item.retrocession_rate,
    linkme_selection_item_id: item.linkme_selection_item_id || null,
  }));

  const { error: itemsError } = await supabase
    .from('sales_order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Erreur création lignes commande:', itemsError);
    // Rollback: supprimer la commande
    await supabase.from('sales_orders').delete().eq('id', order.id);
    throw itemsError;
  }

  // Note: cast to unknown first because DB response may have different column names
  return order as unknown as LinkMeOrder;
}

// ============================================
// HOOKS REACT-QUERY
// ============================================

/**
 * Hook: récupère les commandes LinkMe
 */
export function useLinkMeOrders() {
  return useQuery({
    queryKey: ['linkme-orders'],
    queryFn: fetchLinkMeOrders,
    staleTime: 30000,
  });
}

/**
 * Hook: créer une commande LinkMe
 */
export function useCreateLinkMeOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLinkMeOrder,
    onSuccess: () => {
      // Invalider le cache pour rafraîchir les listes
      queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
  });
}
