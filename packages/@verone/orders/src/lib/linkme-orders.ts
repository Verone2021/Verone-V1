/**
 * Lib partagée pour les commandes LinkMe
 * Utilisée par le CMS ET le Front LinkMe (anti-dérive)
 * Source: RPC get_linkme_orders() et get_linkme_order_items()
 */

import { createClient } from '@verone/utils/supabase/client';

// ============================================
// TYPES
// ============================================

export interface LinkMeOrder {
  id: string;
  order_number: string;
  status: 'draft' | 'validated' | 'partially_shipped' | 'shipped' | 'cancelled';
  payment_status: string | null;
  total_ht: number;
  total_ttc: number;
  total_affiliate_margin: number;
  customer_name: string;
  customer_type: 'organization' | 'individual';
  customer_id: string;
  customer_address: string | null;
  customer_postal_code: string | null;
  customer_city: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  affiliate_id: string | null;
  affiliate_name: string | null;
  affiliate_type: 'enseigne' | 'organisation' | null;
  selection_id: string | null;
  selection_name: string | null;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface LinkMeOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image_url: string | null;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  base_price_ht: number;
  margin_rate: number;
  commission_rate: number;
  selling_price_ht: number;
  affiliate_margin: number;
}

export interface LinkMeOrderStats {
  total_orders: number;
  total_ht: number;
  total_affiliate_margins: number;
  orders_by_status: Record<string, number>;
}

export interface LinkMeCustomer {
  id: string;
  name: string;
  customer_type: 'organization' | 'individual';
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  is_franchisee: boolean;
  created_at: string;
}

// ============================================
// CONSTANTS
// ============================================

export const STATUS_LABELS: Record<
  string,
  {
    label: string;
    variant:
      | 'default'
      | 'secondary'
      | 'success'
      | 'warning'
      | 'destructive'
      | 'outline';
  }
> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  validated: { label: 'Validée', variant: 'default' },
  partially_shipped: { label: 'Expédition partielle', variant: 'warning' },
  shipped: { label: 'Expédiée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'destructive' },
};

export const PAYMENT_STATUS_LABELS: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
  }
> = {
  pending: { label: 'En attente', variant: 'secondary' },
  partial: { label: 'Partiel', variant: 'warning' },
  paid: { label: 'Payé', variant: 'success' },
  refunded: { label: 'Remboursé', variant: 'destructive' },
  overdue: { label: 'En retard', variant: 'destructive' },
};

// ============================================
// FUNCTIONS
// ============================================

/**
 * Récupère les commandes LinkMe
 * @param affiliateId - Si fourni, filtre par affilié (mode Front LinkMe)
 *                      Si null/undefined, retourne toutes les commandes (mode CMS)
 *
 * Note: Cette fonction utilise une RPC personnalisée `get_linkme_orders`
 * qui doit être créée via la migration 20251218_001_rpc_get_linkme_orders.sql
 */
export async function getLinkMeOrders(
  affiliateId?: string | null
): Promise<LinkMeOrder[]> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_linkme_orders', {
    p_affiliate_id: affiliateId ?? null,
  });

  if (error) {
    console.error('Erreur getLinkMeOrders:', error);
    throw error;
  }

  return (data ?? []) as LinkMeOrder[];
}

/**
 * Récupère les items d'une commande LinkMe
 *
 * Note: Cette fonction utilise une RPC personnalisée `get_linkme_order_items`
 * qui doit être créée via la migration 20251218_001_rpc_get_linkme_orders.sql
 */
export async function getLinkMeOrderItems(
  orderId: string
): Promise<LinkMeOrderItem[]> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc(
    'get_linkme_order_items',
    {
      p_order_id: orderId,
    }
  );

  if (error) {
    console.error('Erreur getLinkMeOrderItems:', error);
    throw error;
  }

  return (data ?? []) as LinkMeOrderItem[];
}

/**
 * Récupère les clients d'un affilié (pour création de commande)
 *
 * Note: Cette fonction utilise une RPC personnalisée `get_customers_for_affiliate`
 * qui doit être créée via la migration 20251218_002_rpc_get_customers_for_affiliate.sql
 */
export async function getCustomersForAffiliate(
  affiliateId: string
): Promise<LinkMeCustomer[]> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc(
    'get_customers_for_affiliate',
    {
      p_affiliate_id: affiliateId,
    }
  );

  if (error) {
    console.error('Erreur getCustomersForAffiliate:', error);
    throw error;
  }

  return (data ?? []) as LinkMeCustomer[];
}

/**
 * Calcule les stats à partir d'une liste de commandes
 */
export function calculateOrderStats(orders: LinkMeOrder[]): LinkMeOrderStats {
  return {
    total_orders: orders.length,
    total_ht: orders.reduce((sum, o) => sum + (o.total_ht || 0), 0),
    total_affiliate_margins: orders.reduce(
      (sum, o) => sum + (o.total_affiliate_margin || 0),
      0
    ),
    orders_by_status: orders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}
