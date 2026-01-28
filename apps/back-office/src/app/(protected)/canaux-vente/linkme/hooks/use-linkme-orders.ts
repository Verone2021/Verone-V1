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
  /** Taux de TVA par ligne (0.20 = 20%) */
  tax_rate: number;
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
  /** Lignes de commande (avec tax_rate par ligne) */
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
  /** Frais de livraison HT (optionnel) */
  shipping_cost_ht?: number;
  /** Frais d'assurance HT (optionnel) */
  insurance_cost_ht?: number;
  /** Frais de manutention HT (optionnel) */
  handling_cost_ht?: number;
  /** Taux de TVA sur les frais (decimal, ex: 0.2 pour 20%) - defaut 20% */
  frais_tax_rate?: number;
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
  tax_rate: number;
  shipping_cost_ht: number;
  insurance_cost_ht: number;
  handling_cost_ht: number;
  notes: string | null;
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

export interface UpdateLinkMeOrderInput {
  /** ID de la commande */
  id: string;
  /** Taux de TVA (décimal) */
  tax_rate?: number;
  /** Notes internes */
  internal_notes?: string;
  /** Frais de livraison HT */
  shipping_cost_ht?: number;
  /** Frais d'assurance HT */
  insurance_cost_ht?: number;
  /** Frais de manutention HT */
  handling_cost_ht?: number;
  /** Lignes de commande (mise à jour des quantités) */
  items?: Array<{
    id?: string;
    product_id: string;
    quantity: number;
    unit_price_ht: number;
  }>;
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
 * Récupère une commande LinkMe par ID avec tous ses détails
 */
async function fetchLinkMeOrderById(orderId: string): Promise<LinkMeOrder> {
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
      tax_rate,
      shipping_cost_ht,
      insurance_cost_ht,
      handling_cost_ht,
      notes,
      created_at,
      updated_at,
      sales_order_items (
        id,
        product_id,
        quantity,
        unit_price_ht,
        total_ht,
        retrocession_rate,
        retrocession_amount,
        linkme_selection_item_id,
        products (
          id,
          name,
          sku
        )
      )
    `
    )
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Erreur fetch commande LinkMe:', error);
    throw error;
  }

  // Mapper les données
  const order = data as any;
  return {
    ...order,
    customer_organisation_id:
      order.customer_type === 'organization' ? order.customer_id : null,
    individual_customer_id:
      order.customer_type === 'individual' ? order.customer_id : null,
    items: (order.sales_order_items || []).map((item: any) => ({
      id: item.id,
      sales_order_id: orderId,
      product_id: item.product_id,
      product_name: item.products?.name || 'Produit inconnu',
      quantity: item.quantity,
      unit_price_ht: item.unit_price_ht,
      total_ht: item.total_ht,
      retrocession_rate: item.retrocession_rate,
      retrocession_amount: item.retrocession_amount,
      linkme_selection_item_id: item.linkme_selection_item_id,
    })),
  };
}

/**
 * Met à jour une commande LinkMe
 */
async function updateLinkMeOrder(
  input: UpdateLinkMeOrderInput
): Promise<LinkMeOrder> {
  const supabase = createClient();

  // 1. Récupérer la commande actuelle pour calcul
  const { data: currentOrder, error: fetchError } = await supabase
    .from('sales_orders')
    .select('*, sales_order_items(*)')
    .eq('id', input.id)
    .single();

  if (fetchError || !currentOrder) {
    throw new Error('Commande non trouvée');
  }

  // 2. Calculer les nouveaux totaux
  const taxRate = input.tax_rate ?? currentOrder.tax_rate ?? 0.2;
  const shippingCostHt =
    input.shipping_cost_ht ?? currentOrder.shipping_cost_ht ?? 0;
  const insuranceCostHt =
    input.insurance_cost_ht ?? currentOrder.insurance_cost_ht ?? 0;
  const handlingCostHt =
    input.handling_cost_ht ?? currentOrder.handling_cost_ht ?? 0;

  // Calculer total produits (si items fournis, sinon garder l'existant)
  let productsHt = 0;
  if (input.items && input.items.length > 0) {
    for (const item of input.items) {
      productsHt += item.quantity * item.unit_price_ht;
    }
  } else {
    // Garder le total existant des produits
    for (const item of currentOrder.sales_order_items || []) {
      productsHt += (item as any).quantity * (item as any).unit_price_ht;
    }
  }

  const totalHt =
    productsHt + shippingCostHt + insuranceCostHt + handlingCostHt;
  const totalTtc = totalHt * (1 + taxRate);

  // 3. Mettre à jour la commande
  const { error: updateError } = await supabase
    .from('sales_orders')
    .update({
      tax_rate: taxRate,
      shipping_cost_ht: shippingCostHt,
      insurance_cost_ht: insuranceCostHt,
      handling_cost_ht: handlingCostHt,
      notes: input.internal_notes ?? currentOrder.notes,
      total_ht: totalHt,
      total_ttc: totalTtc,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id);

  if (updateError) {
    console.error('Erreur mise à jour commande:', updateError);
    throw updateError;
  }

  // 4. Mettre à jour les lignes si fournies
  if (input.items && input.items.length > 0) {
    for (const item of input.items) {
      if (item.id) {
        // Mise à jour ligne existante
        await supabase
          .from('sales_order_items')
          .update({
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
          })
          .eq('id', item.id);
      }
    }
  }

  // 5. Retourner la commande mise à jour
  return fetchLinkMeOrderById(input.id);
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

  // 2. Calculer les totaux avec TVA par ligne
  let productsHt = 0;
  let totalTva = 0;
  let _totalRetrocession = 0;

  for (const item of input.items) {
    const lineTotal = item.quantity * item.unit_price_ht;
    const lineTva = lineTotal * (item.tax_rate || 0.2);
    productsHt += lineTotal;
    totalTva += lineTva;
    // Commission calculee sur base_price_ht (135EUR), pas sur unit_price_ht (168.75EUR)
    _totalRetrocession +=
      item.quantity * item.base_price_ht * item.retrocession_rate;
  }

  // Frais additionnels avec TVA configurable
  const shippingCostHt = input.shipping_cost_ht || 0;
  const insuranceCostHt = input.insurance_cost_ht || 0;
  const handlingCostHt = input.handling_cost_ht || 0;
  const fraisTaxRate = input.frais_tax_rate ?? 0.2; // Defaut 20%
  const totalFrais = shippingCostHt + insuranceCostHt + handlingCostHt;
  const totalHt = productsHt + totalFrais;

  // TVA totale = TVA produits (par ligne) + TVA frais (configurable)
  const totalTvaFrais = totalFrais * fraisTaxRate;
  const totalTtc = totalHt + totalTva + totalTvaFrais;

  // 3. Déterminer le customer_id (organisation OU individual)
  const customerId =
    input.customer_type === 'organization'
      ? input.customer_organisation_id
      : input.individual_customer_id;

  if (!customerId) {
    throw new Error('ID client requis');
  }

  // 4. Creer la commande avec les VRAIS champs de la table sales_orders
  // Note: tax_rate au niveau commande = 0 car TVA calculee par ligne
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
    tax_rate: 0, // TVA calculee par ligne, pas globale
    notes: input.internal_notes ?? null,
    // Frais additionnels
    shipping_cost_ht: shippingCostHt,
    insurance_cost_ht: insuranceCostHt,
    handling_cost_ht: handlingCostHt,
    // Adresse de livraison (JSON)
    shipping_address: input.shipping_address
      ? JSON.stringify({
          address_line1: input.shipping_address.address_line1,
          address_line2: input.shipping_address.address_line2 ?? '',
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

  // 5. Creer les lignes de commande
  // Note: product_name, sku et total_ht ne sont PAS des colonnes inserables
  // - product_name/sku : recuperes via jointure products
  // - total_ht : colonne GENERATED (calculee automatiquement)
  const orderItems = input.items.map(item => ({
    sales_order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price_ht: item.unit_price_ht,
    // total_ht est GENERATED - ne pas l'inserer
    tax_rate: item.tax_rate || 0.2, // TVA par ligne (defaut 20%)
    retrocession_rate: item.retrocession_rate,
    // CORRECTION: utiliser base_price_ht (prix catalogue) et non unit_price_ht (prix vente)
    retrocession_amount:
      item.quantity * item.base_price_ht * item.retrocession_rate,
    linkme_selection_item_id: item.linkme_selection_item_id ?? null,
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
    onSuccess: async () => {
      // Invalider le cache pour rafraîchir les listes
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkme-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
      ]);
    },
  });
}

/**
 * Hook: récupère une commande LinkMe par ID
 */
export function useLinkMeOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['linkme-order', orderId],
    queryFn: () => fetchLinkMeOrderById(orderId!),
    enabled: !!orderId,
    staleTime: 30000,
  });
}

/**
 * Hook: mettre à jour une commande LinkMe
 */
export function useUpdateLinkMeOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLinkMeOrder,
    onSuccess: async (_, variables) => {
      // Invalider le cache pour rafraîchir les listes
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkme-orders'] }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-order', variables.id],
        }),
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
      ]);
    },
  });
}
