/**
 * Hook: useLinkMeOrders
 * Récupère les commandes LinkMe pour un affilié
 *
 * @module use-linkme-orders
 * @since 2025-12-18
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

/**
 * Interface item de commande
 */
export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image_url: string | null;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tax_rate: number; // Taux de TVA (0.2 = 20%, 0 = 0%)
  base_price_ht: number;
  margin_rate: number;
  commission_rate: number;
  selling_price_ht: number;
  affiliate_margin: number;
}

/**
 * Interface adresse structuree (JSONB)
 */
export interface StructuredAddress {
  line1?: string;
  line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

/**
 * Interfaces pour les données brutes retournées par la RPC get_linkme_orders.
 * Structure réelle : customer/channel = objets JSONB, items = tableau JSONB avec product imbriqué.
 */
interface RawCustomerFromRPC {
  id: string;
  name: string | null;
  type: 'organization' | 'individual';
  email: string | null;
}

interface RawProductFromRPC {
  id: string;
  name: string | null;
  sku: string | null;
  stock_real: number | null;
  primary_image_url: string | null;
}

interface RawItemFromRPC {
  id: string;
  product: RawProductFromRPC;
  quantity: number;
  tax_rate: number;
  total_ht: number;
  unit_price_ht: number;
}

interface RawOrderFromRPC {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_ht: string | null; // PostgreSQL numeric → string
  total_ttc: string | null; // PostgreSQL numeric → string
  channel: { id: string; code: string; name: string } | null;
  customer: RawCustomerFromRPC | null;
  items: RawItemFromRPC[] | null;
}

/**
 * Interface commande LinkMe
 */
export interface LinkMeOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string | null;
  total_ht: number;
  total_ttc: number;
  shipping_cost_ht: number;
  handling_cost_ht: number;
  insurance_cost_ht: number;
  total_affiliate_margin: number;
  customer_name: string;
  customer_type: 'organization' | 'individual';
  customer_id: string;
  customer_address: string | null;
  customer_postal_code: string | null;
  customer_city: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  // Adresses structurees (depuis sales_orders)
  billing_address: StructuredAddress | null;
  shipping_address: StructuredAddress | null;
  // Dates de livraison (depuis sales_order_linkme_details)
  desired_delivery_date: string | null;
  confirmed_delivery_date: string | null;
  // Contact facturation (depuis sales_order_linkme_details)
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  // Affiliate info
  affiliate_id: string;
  affiliate_name: string | null;
  affiliate_type: 'enseigne' | 'organisation' | null;
  selection_id: string | null;
  selection_name: string | null;
  items_count: number;
  created_at: string;
  updated_at: string;
  // Approbation
  pending_admin_validation: boolean;
  // Items charges separement
  items: OrderItem[];
}

/**
 * Hook: récupère les commandes LinkMe
 *
 * @param affiliateId - ID de l'affilié pour filtrer, ou null pour toutes les commandes
 * @param fetchAll - Si true, récupère toutes les commandes (mode CMS/admin)
 *
 * Note: Pour aligner les KPIs avec le back-office, utiliser fetchAll=true
 */
export function useLinkMeOrders(
  affiliateId: string | null,
  fetchAll: boolean = false
) {
  return useQuery({
    queryKey: ['linkme-orders', fetchAll ? 'all' : affiliateId],
    queryFn: async (): Promise<LinkMeOrder[]> => {
      // Mode fetchAll : récupère toutes les commandes (comme le back-office)
      // Mode normal : filtre par affilié
      const effectiveAffiliateId = fetchAll ? null : affiliateId;

      // Si pas de fetchAll et pas d'affiliateId, retourner vide
      if (!fetchAll && !affiliateId) return [];

      // Fetch commandes via RPC (items inclus directement - elimine N+1)
      // TODO: Fix after RPC signature change - get_linkme_orders no longer accepts p_affiliate_id
      const supabase = createClient();
      const { data: ordersData, error: ordersError } = await supabase.rpc(
        'get_linkme_orders',
        {} // Removed p_affiliate_id parameter - RPC signature changed
      );

      if (ordersError) {
        console.error('[useLinkMeOrders] RPC error:', {
          message: ordersError.message,
          code: ordersError.code,
          details: ordersError.details,
          hint: ordersError.hint,
          affiliateId: effectiveAffiliateId,
          fetchAll,
        });
        throw ordersError;
      }

      // Succès = silencieux (flux normal, pas de log INFO)
      if (!ordersData || ordersData.length === 0) {
        return [];
      }

      // Map les commandes (items/customer/channel = objets JSONB imbriqués)
      const typedOrders = ordersData as unknown as RawOrderFromRPC[];
      return typedOrders.map(
        (order): LinkMeOrder => ({
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_status: null, // Not in current RPC
          total_ht: Number(order.total_ht) || 0,
          total_ttc: Number(order.total_ttc) || 0,
          shipping_cost_ht: 0, // Not in current RPC
          handling_cost_ht: 0, // Not in current RPC
          insurance_cost_ht: 0, // Not in current RPC
          total_affiliate_margin: 0, // Not in current RPC
          // Customer from nested JSONB object
          customer_name: order.customer?.name ?? 'Client inconnu',
          customer_type: order.customer?.type ?? 'organization',
          customer_id: order.customer?.id ?? '',
          customer_address: null, // Not in current RPC
          customer_postal_code: null, // Not in current RPC
          customer_city: null, // Not in current RPC
          customer_email: order.customer?.email ?? null,
          customer_phone: null, // Not in current RPC
          // Adresses structurees
          billing_address: null, // Not in current RPC
          shipping_address: null, // Not in current RPC
          // Dates de livraison
          desired_delivery_date: null, // Not in current RPC
          confirmed_delivery_date: null, // Not in current RPC
          // Contact facturation
          billing_name: null, // Not in current RPC
          billing_email: null, // Not in current RPC
          billing_phone: null, // Not in current RPC
          // Affiliate info
          affiliate_id: '', // Not in current RPC
          affiliate_name: null, // Not in current RPC
          affiliate_type: null, // Not in current RPC
          selection_id: null, // Not in current RPC
          selection_name: null, // Not in current RPC
          items_count: (order.items ?? []).length,
          created_at: order.created_at,
          updated_at: order.created_at, // RPC only returns created_at
          // Approbation
          pending_admin_validation: false, // Not in current RPC
          // Items from nested JSONB with product sub-object
          items: (order.items ?? []).map(
            (item): OrderItem => ({
              id: item.id,
              product_id: item.product?.id ?? '',
              product_name: item.product?.name ?? 'Produit inconnu',
              product_sku: item.product?.sku ?? '',
              product_image_url: item.product?.primary_image_url ?? null,
              quantity: item.quantity ?? 0,
              unit_price_ht: item.unit_price_ht ?? 0,
              total_ht: item.total_ht ?? 0,
              tax_rate: item.tax_rate ?? 0,
              base_price_ht: 0, // Not in current RPC
              margin_rate: 0, // Not in current RPC
              commission_rate: 0, // Not in current RPC
              selling_price_ht: 0, // Not in current RPC
              affiliate_margin: 0, // Not in current RPC
            })
          ),
        })
      );
    },
    enabled: fetchAll || !!affiliateId,
    // Optimisation: cache plus long, pas de refetch on focus
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook: récupère les statistiques des commandes
 */
export interface OrderStats {
  total_orders: number;
  total_ht: number;
  total_affiliate_margins: number;
  orders_by_status: Record<string, number>;
}

export function useOrderStats(orders: LinkMeOrder[]): OrderStats {
  if (!orders || orders.length === 0) {
    return {
      total_orders: 0,
      total_ht: 0,
      total_affiliate_margins: 0,
      orders_by_status: {},
    };
  }

  return {
    total_orders: orders.length,
    total_ht: orders.reduce((sum, o) => sum + (o.total_ht ?? 0), 0),
    total_affiliate_margins: orders.reduce(
      (sum, o) => sum + (o.total_affiliate_margin ?? 0),
      0
    ),
    orders_by_status: orders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}
