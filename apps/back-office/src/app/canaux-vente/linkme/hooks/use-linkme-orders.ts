/**
 * Hook: useLinkMeOrders
 * Gestion des commandes LinkMe
 * Utilise la même table sales_orders avec channel_id = LinkMe
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

// ID du canal LinkMe
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
 */
async function fetchLinkMeOrders(): Promise<LinkMeOrder[]> {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(
      `
      id,
      order_number,
      channel_id,
      customer_type,
      customer_organisation_id,
      individual_customer_id,
      status,
      payment_status,
      total_ht,
      total_ttc,
      created_at,
      updated_at,
      organisation:organisations(id, trade_name, legal_name),
      individual_customer:individual_customers(id, first_name, last_name)
    `
    )
    .eq('channel_id', LINKME_CHANNEL_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch commandes LinkMe:', error);
    throw error;
  }

  return (data as any[]) || [];
}

/**
 * Crée une commande LinkMe
 */
async function createLinkMeOrder(
  input: CreateLinkMeOrderInput
): Promise<LinkMeOrder> {
  // 1. Calculer les totaux
  let totalHt = 0;
  let totalRetrocession = 0;

  for (const item of input.items) {
    const lineTotal = item.quantity * item.unit_price_ht;
    totalHt += lineTotal;
    totalRetrocession += lineTotal * item.retrocession_rate;
  }

  // TVA 20%
  const totalTtc = totalHt * 1.2;

  // 2. Créer la commande
  // Note: customer_organisation_id et individual_customer_id existent en DB mais pas dans les types Git
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderData: any = {
    channel_id: LINKME_CHANNEL_ID,
    customer_type: input.customer_type,
    customer_organisation_id:
      input.customer_type === 'organization'
        ? input.customer_organisation_id
        : null,
    individual_customer_id:
      input.customer_type === 'individual'
        ? input.individual_customer_id
        : null,
    status: 'draft', // Commence en brouillon
    payment_status: 'pending',
    total_ht: totalHt,
    total_ttc: totalTtc,
    internal_notes: input.internal_notes || null,
    shipping_address_line1: input.shipping_address?.address_line1 || null,
    shipping_address_line2: input.shipping_address?.address_line2 || null,
    shipping_city: input.shipping_address?.city || null,
    shipping_postal_code: input.shipping_address?.postal_code || null,
    shipping_country: input.shipping_address?.country || 'FR',
  };

  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError) {
    console.error('Erreur création commande:', orderError);
    throw orderError;
  }

  // 3. Créer les lignes de commande
  const orderItems = input.items.map(item => ({
    sales_order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    sku: item.sku,
    quantity: item.quantity,
    unit_price_ht: item.unit_price_ht,
    total_ht: item.quantity * item.unit_price_ht,
    tax_rate: 0.2, // 20% TVA
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
      // Invalider le cache pour rafraîchir la liste
      queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
    },
  });
}
