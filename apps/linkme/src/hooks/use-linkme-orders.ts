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
 * Raw JSONB shapes returned by the RPC for nested objects
 */
interface RawCustomerJsonb {
  id: string;
  name: string | null;
  type: 'organization' | 'individual';
  email: string | null;
}

interface RawProductJsonb {
  id: string;
  name: string | null;
  sku: string | null;
  stock_real: number | null;
  primary_image_url: string | null;
}

interface RawItemJsonb {
  id: string;
  product: RawProductJsonb;
  quantity: number;
  tax_rate: number;
  total_ht: number;
  unit_price_ht: number;
  base_price_ht: number;
  selling_price_ht: number;
  margin_rate: number;
  affiliate_margin: number;
}

/**
 * Flat row returned by get_linkme_orders RPC.
 * Columns: sales_orders flat fields + JSONB (channel, customer, items)
 * + linkme_details prefixed with ld_*
 * + affiliate/selection info
 */
interface RpcOrderRow {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  status: string;
  payment_status: string | null;
  total_ht: string | null; // PostgreSQL numeric → string
  total_ttc: string | null;
  shipping_cost_ht: string | null;
  handling_cost_ht: string | null;
  insurance_cost_ht: string | null;
  affiliate_total_ht: string | null;
  // JSONB addresses
  billing_address: StructuredAddress | null;
  shipping_address: StructuredAddress | null;
  // Approval
  pending_admin_validation: boolean;
  // JSONB objects
  channel: { id: string; code: string; name: string } | null;
  customer: RawCustomerJsonb | null;
  items: RawItemJsonb[] | null;
  // Affiliate info
  affiliate_id: string | null;
  affiliate_display_name: string | null;
  affiliate_type: string | null;
  // Selection info
  selection_id: string | null;
  selection_name: string | null;
  // LinkMe details: billing contact
  ld_billing_name: string | null;
  ld_billing_email: string | null;
  ld_billing_phone: string | null;
  // LinkMe details: requester contact
  ld_requester_name: string | null;
  ld_requester_email: string | null;
  ld_requester_phone: string | null;
  ld_requester_position: string | null;
  // LinkMe details: delivery contact
  ld_delivery_contact_name: string | null;
  ld_delivery_contact_email: string | null;
  ld_delivery_contact_phone: string | null;
  // LinkMe details: delivery address (text)
  ld_delivery_address: string | null;
  ld_delivery_postal_code: string | null;
  ld_delivery_city: string | null;
  // LinkMe details: delivery dates
  ld_desired_delivery_date: string | null;
  ld_confirmed_delivery_date: string | null;
  // LinkMe details: delivery options
  ld_is_mall_delivery: boolean | null;
  ld_delivery_notes: string | null;
  ld_owner_type: string | null;
  // LinkMe details: reception contact
  ld_reception_contact_name: string | null;
  ld_reception_contact_email: string | null;
  ld_reception_contact_phone: string | null;
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
  // Requester contact (depuis sales_order_linkme_details)
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  requester_position: string | null;
  // Delivery contact (depuis sales_order_linkme_details)
  delivery_contact_name: string | null;
  delivery_contact_email: string | null;
  delivery_contact_phone: string | null;
  // Delivery address text (depuis sales_order_linkme_details)
  delivery_address_text: string | null;
  delivery_postal_code: string | null;
  delivery_city: string | null;
  // Delivery options
  is_mall_delivery: boolean;
  delivery_notes: string | null;
  owner_type: string | null;
  // Reception contact
  reception_contact_name: string | null;
  reception_contact_email: string | null;
  reception_contact_phone: string | null;
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
      // Si pas de fetchAll et pas d'affiliateId, retourner vide
      if (!fetchAll && !affiliateId) return [];

      const supabase = createClient();
      const { data: ordersData, error: ordersError } = await supabase.rpc(
        'get_linkme_orders',
        {}
      );

      if (ordersError) {
        console.error('[useLinkMeOrders] RPC error:', {
          message: ordersError.message,
          code: ordersError.code,
          details: ordersError.details,
          hint: ordersError.hint,
          affiliateId,
          fetchAll,
        });
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        return [];
      }

      // Map flat RPC rows to LinkMeOrder
      const typedRows = ordersData as unknown as RpcOrderRow[];
      return typedRows.map(
        (row): LinkMeOrder => ({
          id: row.id,
          order_number: row.order_number,
          status: row.status,
          payment_status: row.payment_status,
          total_ht: Number(row.total_ht) || 0,
          total_ttc: Number(row.total_ttc) || 0,
          shipping_cost_ht: Number(row.shipping_cost_ht) || 0,
          handling_cost_ht: Number(row.handling_cost_ht) || 0,
          insurance_cost_ht: Number(row.insurance_cost_ht) || 0,
          total_affiliate_margin: Number(row.affiliate_total_ht) || 0,
          // Customer from JSONB
          customer_name: row.customer?.name ?? 'Client inconnu',
          customer_type: row.customer?.type ?? 'organization',
          customer_id: row.customer?.id ?? '',
          customer_address: null,
          customer_postal_code: null,
          customer_city: null,
          customer_email: row.customer?.email ?? null,
          customer_phone: null,
          // Structured addresses from sales_orders JSONB
          billing_address: row.billing_address,
          shipping_address: row.shipping_address,
          // Dates from linkme_details
          desired_delivery_date: row.ld_desired_delivery_date,
          confirmed_delivery_date: row.ld_confirmed_delivery_date,
          // Billing contact from linkme_details
          billing_name: row.ld_billing_name,
          billing_email: row.ld_billing_email,
          billing_phone: row.ld_billing_phone,
          // Requester contact from linkme_details
          requester_name: row.ld_requester_name,
          requester_email: row.ld_requester_email,
          requester_phone: row.ld_requester_phone,
          requester_position: row.ld_requester_position,
          // Delivery contact from linkme_details
          delivery_contact_name: row.ld_delivery_contact_name,
          delivery_contact_email: row.ld_delivery_contact_email,
          delivery_contact_phone: row.ld_delivery_contact_phone,
          // Delivery address text from linkme_details
          delivery_address_text: row.ld_delivery_address,
          delivery_postal_code: row.ld_delivery_postal_code,
          delivery_city: row.ld_delivery_city,
          // Delivery options
          is_mall_delivery: row.ld_is_mall_delivery ?? false,
          delivery_notes: row.ld_delivery_notes,
          owner_type: row.ld_owner_type,
          // Reception contact
          reception_contact_name: row.ld_reception_contact_name,
          reception_contact_email: row.ld_reception_contact_email,
          reception_contact_phone: row.ld_reception_contact_phone,
          // Affiliate info
          affiliate_id: row.affiliate_id ?? '',
          affiliate_name: row.affiliate_display_name,
          affiliate_type:
            (row.affiliate_type as 'enseigne' | 'organisation') ?? null,
          selection_id: row.selection_id,
          selection_name: row.selection_name,
          items_count: (row.items ?? []).length,
          created_at: row.created_at,
          updated_at: row.updated_at ?? row.created_at,
          // Approval
          pending_admin_validation: row.pending_admin_validation ?? false,
          // Items from JSONB with commission data
          items: (row.items ?? []).map(
            (item): OrderItem => ({
              id: item.id,
              product_id: item.product?.id ?? '',
              product_name: item.product?.name ?? 'Produit inconnu',
              product_sku: item.product?.sku ?? '',
              product_image_url: item.product?.primary_image_url ?? null,
              quantity: item.quantity ?? 0,
              unit_price_ht: Number(item.unit_price_ht) || 0,
              total_ht: Number(item.total_ht) || 0,
              tax_rate: Number(item.tax_rate) || 0,
              base_price_ht: Number(item.base_price_ht) || 0,
              margin_rate: Number(item.margin_rate) || 0,
              commission_rate: 0, // Computed elsewhere if needed
              selling_price_ht: Number(item.selling_price_ht) || 0,
              affiliate_margin: Number(item.affiliate_margin) || 0,
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
