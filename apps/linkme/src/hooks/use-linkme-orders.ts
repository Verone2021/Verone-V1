/**
 * Hook: useLinkMeOrders
 * Récupère les commandes LinkMe pour un affilié
 *
 * @module use-linkme-orders
 * @since 2025-12-18
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

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
  affiliate_id: string;
  affiliate_name: string | null;
  affiliate_type: 'enseigne' | 'organisation' | null;
  selection_id: string | null;
  selection_name: string | null;
  items_count: number;
  created_at: string;
  updated_at: string;
  // Items chargés séparément
  items: OrderItem[];
}

/**
 * Hook: récupère les commandes LinkMe pour un affilié
 */
export function useLinkMeOrders(affiliateId: string | null) {
  return useQuery({
    queryKey: ['linkme-orders', affiliateId],
    queryFn: async (): Promise<LinkMeOrder[]> => {
      if (!affiliateId) return [];

      // 1. Fetch commandes via RPC
      const supabase = createClient();
      const { data: ordersData, error: ordersError } = await (
        supabase as any
      ).rpc('get_linkme_orders', { p_affiliate_id: affiliateId });

      if (ordersError) {
        console.error('Erreur fetch commandes:', ordersError);
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        return [];
      }

      // 2. Fetch items pour chaque commande en parallèle
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order: any) => {
          const { data: itemsData, error: itemsError } = await (
            supabase as any
          ).rpc('get_linkme_order_items', { p_order_id: order.id });

          if (itemsError) {
            console.error('Erreur fetch items:', itemsError);
            return {
              ...order,
              items: [],
            };
          }

          return {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            payment_status: order.payment_status,
            total_ht: order.total_ht || 0,
            total_ttc: order.total_ttc || 0,
            shipping_cost_ht: order.shipping_cost_ht || 0,
            handling_cost_ht: order.handling_cost_ht || 0,
            insurance_cost_ht: order.insurance_cost_ht || 0,
            total_affiliate_margin: order.total_affiliate_margin || 0,
            customer_name: order.customer_name || 'Client inconnu',
            customer_type: order.customer_type as 'organization' | 'individual',
            customer_id: order.customer_id,
            customer_address: order.customer_address,
            customer_postal_code: order.customer_postal_code,
            customer_city: order.customer_city,
            customer_email: order.customer_email,
            customer_phone: order.customer_phone,
            affiliate_id: order.affiliate_id,
            affiliate_name: order.affiliate_name,
            affiliate_type: order.affiliate_type as
              | 'enseigne'
              | 'organisation'
              | null,
            selection_id: order.selection_id,
            selection_name: order.selection_name,
            items_count: order.items_count || 0,
            created_at: order.created_at,
            updated_at: order.updated_at,
            items: (itemsData || []).map((item: any) => ({
              id: item.id,
              product_id: item.product_id,
              product_name: item.product_name || 'Produit inconnu',
              product_sku: item.product_sku || '',
              product_image_url: item.product_image_url,
              quantity: item.quantity || 0,
              unit_price_ht: item.unit_price_ht || 0,
              total_ht: item.total_ht || 0,
              tax_rate: item.tax_rate || 0,
              base_price_ht: item.base_price_ht || 0,
              margin_rate: item.margin_rate || 0,
              commission_rate: item.commission_rate || 0,
              selling_price_ht: item.selling_price_ht || 0,
              affiliate_margin: item.affiliate_margin || 0,
            })),
          };
        })
      );

      return ordersWithItems;
    },
    enabled: !!affiliateId,
    staleTime: 30000, // 30 secondes
    refetchOnWindowFocus: true,
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
