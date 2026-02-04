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
 * Interface pour les données brutes retournées par la RPC get_linkme_orders
 * (utilisée pour le typage interne avant mapping vers LinkMeOrder)
 */
interface RawOrderFromRPC {
  id: string;
  order_number: string;
  status: string;
  payment_status: string | null;
  total_ht: number | null;
  total_ttc: number | null;
  shipping_cost_ht: number | null;
  handling_cost_ht: number | null;
  insurance_cost_ht: number | null;
  total_affiliate_margin: number | null;
  customer_name: string | null;
  customer_type: 'organization' | 'individual';
  customer_id: string;
  customer_address: string | null;
  customer_postal_code: string | null;
  customer_city: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  billing_address: StructuredAddress | null;
  shipping_address: StructuredAddress | null;
  desired_delivery_date: string | null;
  confirmed_delivery_date: string | null;
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  affiliate_id: string;
  affiliate_name: string | null;
  affiliate_type: 'enseigne' | 'organisation' | null;
  selection_id: string | null;
  selection_name: string | null;
  items_count: number | null;
  created_at: string;
  updated_at: string;
  pending_admin_validation: boolean | null;
  items: Array<{
    id: string;
    product_id: string;
    product_name: string | null;
    product_sku: string | null;
    product_image_url: string | null;
    quantity: number | null;
    unit_price_ht: number | null;
    total_ht: number | null;
    tax_rate: number | null;
    base_price_ht: number | null;
    margin_rate: number | null;
    commission_rate: number | null;
    selling_price_ht: number | null;
    affiliate_margin: number | null;
  }> | null;
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
      const supabase = createClient();
      const { data: ordersData, error: ordersError } = await supabase.rpc(
        'get_linkme_orders',
        { p_affiliate_id: effectiveAffiliateId ?? undefined }
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

      if (!ordersData || ordersData.length === 0) {
        console.info('[useLinkMeOrders] No orders found', {
          affiliateId: effectiveAffiliateId,
          fetchAll,
        });
        return [];
      }

      console.info('[useLinkMeOrders] Orders fetched successfully', {
        count: ordersData.length,
        affiliateId: effectiveAffiliateId,
        fetchAll,
      });

      // Map les commandes (items deja inclus dans la RPC)
      return (ordersData as RawOrderFromRPC[]).map(
        (order): LinkMeOrder => ({
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_status: order.payment_status,
          total_ht: order.total_ht ?? 0,
          total_ttc: order.total_ttc ?? 0,
          shipping_cost_ht: order.shipping_cost_ht ?? 0,
          handling_cost_ht: order.handling_cost_ht ?? 0,
          insurance_cost_ht: order.insurance_cost_ht ?? 0,
          total_affiliate_margin: order.total_affiliate_margin ?? 0,
          customer_name: order.customer_name ?? 'Client inconnu',
          customer_type: order.customer_type,
          customer_id: order.customer_id,
          customer_address: order.customer_address,
          customer_postal_code: order.customer_postal_code,
          customer_city: order.customer_city,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          // Adresses structurees
          billing_address: order.billing_address ?? null,
          shipping_address: order.shipping_address ?? null,
          // Dates de livraison
          desired_delivery_date: order.desired_delivery_date ?? null,
          confirmed_delivery_date: order.confirmed_delivery_date ?? null,
          // Contact facturation
          billing_name: order.billing_name ?? null,
          billing_email: order.billing_email ?? null,
          billing_phone: order.billing_phone ?? null,
          // Affiliate info
          affiliate_id: order.affiliate_id,
          affiliate_name: order.affiliate_name,
          affiliate_type: order.affiliate_type,
          selection_id: order.selection_id,
          selection_name: order.selection_name,
          items_count: order.items_count ?? 0,
          created_at: order.created_at,
          updated_at: order.updated_at,
          // Approbation
          pending_admin_validation: order.pending_admin_validation ?? false,
          // Items inclus directement depuis la RPC (plus de N+1)
          items: (order.items ?? []).map(
            (item): OrderItem => ({
              id: item.id,
              product_id: item.product_id,
              product_name: item.product_name ?? 'Produit inconnu',
              product_sku: item.product_sku ?? '',
              product_image_url: item.product_image_url,
              quantity: item.quantity ?? 0,
              unit_price_ht: item.unit_price_ht ?? 0,
              total_ht: item.total_ht ?? 0,
              tax_rate: item.tax_rate ?? 0,
              base_price_ht: item.base_price_ht ?? 0,
              margin_rate: item.margin_rate ?? 0,
              commission_rate: item.commission_rate ?? 0,
              selling_price_ht: item.selling_price_ht ?? 0,
              affiliate_margin: item.affiliate_margin ?? 0,
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
