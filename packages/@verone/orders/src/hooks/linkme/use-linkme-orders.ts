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

import { useMutation, useQueryClient } from '@tanstack/react-query';
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

export interface LinkMeDetailsInput {
  requester_phone?: string | null;
  billing_name?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  delivery_contact_name?: string | null;
  delivery_contact_email?: string | null;
  delivery_contact_phone?: string | null;
  delivery_address?: string | null;
  delivery_postal_code?: string | null;
  delivery_city?: string | null;
  is_mall_delivery?: boolean;
  semi_trailer_accessible?: boolean;
  desired_delivery_date?: string | null;
  delivery_notes?: string | null;
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
  /** Date de la commande (format YYYY-MM-DD) — OBLIGATOIRE */
  order_date: string;
  /** Frais de livraison HT */
  shipping_cost_ht?: number;
  /** Frais de manutention HT */
  handling_cost_ht?: number;
  /** Frais d'assurance HT */
  insurance_cost_ht?: number;
  /** Taux TVA pour frais */
  frais_tax_rate?: number;
  /** Date de livraison prévue */
  expected_delivery_date?: string | null;
  /** Livraison en centre commercial */
  is_shopping_center_delivery?: boolean;
  /** Accepte semi-remorque */
  accepts_semi_truck?: boolean;
  /** ID de la sélection LinkMe */
  linkme_selection_id?: string | null;
  /** Contact responsable (FK vers contacts) */
  responsable_contact_id?: string | null;
  /** Contact de facturation (FK vers contacts) */
  billing_contact_id?: string | null;
  /** Contact de livraison (FK vers contacts) */
  delivery_contact_id?: string | null;
  /** Adresse de facturation custom */
  billing_address?: {
    address_line1: string;
    city: string;
    postal_code: string;
    country: string;
  };
  /** Détails LinkMe (contacts/adresses pour sales_order_linkme_details) */
  linkme_details?: LinkMeDetailsInput | null;
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
  payment_status_v2: string;
  total_ht: number;
  total_ttc: number;
  created_at: string;
  updated_at: string;
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

  // 2. Calculer les totaux avec précision à 2 décimales
  // Helper pour arrondir les montants monétaires
  const roundMoney = (value: number): number => Math.round(value * 100) / 100;

  let totalHt = 0;
  let totalRetrocession = 0;

  for (const item of input.items) {
    const lineTotal = roundMoney(item.quantity * item.unit_price_ht);
    totalHt = roundMoney(totalHt + lineTotal);
    // Commission = marge par unité × quantité (SSOT: selling - base)
    totalRetrocession = roundMoney(
      totalRetrocession +
        (item.unit_price_ht - item.base_price_ht) * item.quantity
    );
  }

  // TVA 20% avec arrondi
  const totalTtc = roundMoney(totalHt * 1.2);

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
    payment_status_v2: 'pending',
    total_ht: totalHt,
    total_ttc: totalTtc,
    tax_rate: 0.2,
    notes: input.internal_notes ?? null,
    // Contacts (FK vers table contacts — source de vérité)
    responsable_contact_id: input.responsable_contact_id ?? null,
    billing_contact_id: input.billing_contact_id ?? null,
    delivery_contact_id: input.delivery_contact_id ?? null,
    // Adresse de livraison (JSON)
    shipping_address: input.shipping_address
      ? JSON.stringify({
          address_line1: input.shipping_address.address_line1,
          address_line2: input.shipping_address.address_line2 ?? '',
          city: input.shipping_address.city,
          postal_code: input.shipping_address.postal_code,
          country: input.shipping_address.country ?? 'FR',
        })
      : null,
  };

  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert(orderData)
    .select(
      'id, order_number, channel_id, customer_type, status, payment_status_v2, total_ht, total_ttc, created_at, updated_at'
    )
    .single();

  if (orderError) {
    console.error('Erreur création commande:', orderError);
    throw new Error(
      `Erreur création commande: ${orderError.message ?? 'Erreur inconnue'}`
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
    unit_price_ht: roundMoney(item.unit_price_ht),
    // total_ht est GENERATED - ne pas l'insérer
    tax_rate: 0.2,
    retrocession_rate: item.retrocession_rate,
    // Commission = (selling_price - base_price) × qty
    retrocession_amount: roundMoney(
      (item.unit_price_ht - item.base_price_ht) * item.quantity
    ),
    linkme_selection_item_id: item.linkme_selection_item_id ?? null,
  }));

  const { error: itemsError } = await supabase
    .from('sales_order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Erreur création lignes commande:', itemsError);
    // Rollback: supprimer la commande
    await supabase.from('sales_orders').delete().eq('id', order.id);
    throw new Error(
      `Erreur création lignes: ${itemsError.message ?? 'Erreur inconnue'}`
    );
  }

  // 6. Créer les détails LinkMe (contacts/adresses/options livraison)
  if (input.linkme_details) {
    const ld = input.linkme_details;
    // requester_type/name/email sont NOT NULL — en contexte BO, c'est l'utilisateur connecté
    const { error: detailsError } = await supabase
      .from('sales_order_linkme_details')
      .insert({
        sales_order_id: order.id,
        // Requester = a remplir via dialog contact (pas l'utilisateur BO)
        requester_type: 'back_office',
        requester_name: '',
        requester_email: '',
        requester_phone: ld.requester_phone ?? null,
        // Contacts facturation
        billing_name: ld.billing_name ?? null,
        billing_email: ld.billing_email ?? null,
        billing_phone: ld.billing_phone ?? null,
        // Contacts livraison
        delivery_contact_name: ld.delivery_contact_name ?? null,
        delivery_contact_email: ld.delivery_contact_email ?? null,
        delivery_contact_phone: ld.delivery_contact_phone ?? null,
        // Adresse livraison
        delivery_address: ld.delivery_address ?? null,
        delivery_postal_code: ld.delivery_postal_code ?? null,
        delivery_city: ld.delivery_city ?? null,
        // Options livraison
        is_mall_delivery: ld.is_mall_delivery ?? false,
        semi_trailer_accessible: ld.semi_trailer_accessible ?? true,
        desired_delivery_date: ld.desired_delivery_date ?? null,
        delivery_notes: ld.delivery_notes ?? null,
      });

    if (detailsError) {
      console.error('Erreur création détails LinkMe:', detailsError);
      // Non-bloquant: la commande est créée, on log l'erreur
    }
  }

  return order as unknown as LinkMeOrder;
}

// ============================================
// HOOKS REACT-QUERY
// ============================================

/**
 * Hook: créer une commande LinkMe
 */
export function useCreateLinkMeOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLinkMeOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
  });
}
