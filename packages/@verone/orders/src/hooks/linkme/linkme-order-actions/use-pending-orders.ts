'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import type {
  PendingOrder,
  PendingOrderItem,
  PendingOrderLinkMeDetails,
  LinkMeOrderDetails,
} from './types';

/**
 * Hook: compte le nombre de commandes en attente de validation
 */
export function usePendingOrdersCount() {
  return useQuery({
    queryKey: ['pending-orders-count'],
    queryFn: async (): Promise<number> => {
      const supabase = createClient();

      const { count, error } = await supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .eq('pending_admin_validation', true);

      if (error) {
        console.error('Error fetching pending orders count:', error);
        throw error;
      }

      return count ?? 0;
    },
    staleTime: 120000, // 2 minutes
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook: récupère les commandes en attente de validation
 * Enrichi avec les détails LinkMe et les items pour la vue détail
 */
export function usePendingOrders() {
  return useQuery({
    queryKey: ['pending-orders'],
    queryFn: async (): Promise<PendingOrder[]> => {
      const supabase = createClient();

      // Fetch orders with pending_admin_validation = true
      const { data: orders, error } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          linkme_display_number,
          status,
          total_ht,
          total_ttc,
          created_at,
          customer_id,
          customer_type,
          shipping_cost_ht,
          handling_cost_ht,
          insurance_cost_ht,
          fees_vat_rate,
          sales_order_linkme_details (
            is_new_restaurant,
            requester_type,
            requester_name,
            requester_email,
            requester_phone,
            requester_position,
            owner_type,
            owner_contact_same_as_requester,
            owner_name,
            owner_email,
            owner_phone,
            owner_company_legal_name,
            owner_company_trade_name,
            billing_contact_source,
            billing_name,
            billing_email,
            billing_phone,
            desired_delivery_date,
            mall_form_required
          ),
          sales_order_items (
            id,
            quantity,
            unit_price_ht,
            total_ht,
            products (
              id,
              name,
              sku,
              product_images!left(public_url, is_primary)
            )
          )
        `
        )
        .eq('pending_admin_validation', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending orders:', error);
        throw error;
      }

      // BATCH: Récupérer toutes les organisations en UNE SEULE requête (fix N+1)
      const organisationIds = (orders ?? [])
        .filter(o => o.customer_type === 'organization' && o.customer_id)
        .map(o => o.customer_id)
        .filter((id): id is string => id !== null);

      const organisationsMap = new Map<
        string,
        {
          trade_name: string | null;
          legal_name: string | null;
          enseigne_name: string | null;
        }
      >();

      if (organisationIds.length > 0) {
        const { data: orgsData } = await supabase
          .from('organisations')
          .select('id, trade_name, legal_name, enseigne:enseigne_id(name)')
          .in('id', organisationIds)
          .returns<
            {
              id: string;
              trade_name: string | null;
              legal_name: string;
              enseigne: { name: string | null } | null;
            }[]
          >();

        if (orgsData) {
          for (const org of orgsData) {
            organisationsMap.set(org.id, {
              trade_name: org.trade_name,
              legal_name: org.legal_name,
              enseigne_name: org.enseigne?.name ?? null,
            });
          }
        }
      }

      // Map orders with organisation data from the batch
      const enrichedOrders: PendingOrder[] = [];

      for (const order of orders ?? []) {
        // Get organisation name from cached map (no additional query)
        let organisationName: string | null = null;
        let enseigneName: string | null = null;

        if (order.customer_type === 'organization' && order.customer_id) {
          const orgData = organisationsMap.get(order.customer_id);
          if (orgData) {
            organisationName = orgData.trade_name ?? orgData.legal_name;
            enseigneName = orgData.enseigne_name;
          }
        }

        // Extract linkme details (can be single object or array depending on Supabase query)
        const linkmeDetailsRaw = order.sales_order_linkme_details as
          | LinkMeOrderDetails
          | LinkMeOrderDetails[]
          | undefined;
        const linkmeDetails = Array.isArray(linkmeDetailsRaw)
          ? (linkmeDetailsRaw[0] ?? null)
          : (linkmeDetailsRaw ?? null);

        // Map items with proper typing and extract primary image
        const items: PendingOrderItem[] = (
          (order.sales_order_items as Array<{
            id: string;
            quantity: number;
            unit_price_ht: number | null;
            total_ht: number | null;
            products?: {
              id: string;
              name: string;
              sku: string;
              product_images?: Array<{
                public_url: string;
                is_primary: boolean;
              }>;
            };
          }>) ?? []
        ).map(item => {
          // Extract primary image from product_images array
          const productImages = item.products?.product_images as
            | Array<{ public_url: string; is_primary: boolean }>
            | undefined;
          const primaryImage =
            productImages?.find(img => img.is_primary)?.public_url ??
            productImages?.[0]?.public_url ??
            null;

          return {
            id: item.id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht as number,
            total_ht: item.total_ht as number,
            products: item.products
              ? {
                  id: item.products.id,
                  name: item.products.name,
                  sku: item.products.sku,
                  primary_image_url: primaryImage,
                }
              : null,
          };
        });

        enrichedOrders.push({
          id: order.id,
          order_number: order.order_number,
          linkme_display_number:
            (order as unknown as { linkme_display_number?: string | null })
              .linkme_display_number ?? null,
          status: order.status,
          total_ht: order.total_ht,
          total_ttc: order.total_ttc,
          created_at: order.created_at,
          organisation_siret: null,
          organisation_country: null,
          organisation_vat_number: null,
          requester_name: linkmeDetails?.requester_name ?? null,
          requester_email: linkmeDetails?.requester_email ?? null,
          requester_type: linkmeDetails?.requester_type ?? null,
          organisation_name: organisationName,
          enseigne_name: enseigneName,
          linkme_details: linkmeDetails
            ? ({
                is_new_restaurant: linkmeDetails.is_new_restaurant ?? false,
                requester_type: linkmeDetails.requester_type,
                requester_name: linkmeDetails.requester_name,
                requester_email: linkmeDetails.requester_email,
                requester_phone: linkmeDetails.requester_phone,
                requester_position: linkmeDetails.requester_position,
                owner_type: linkmeDetails.owner_type,
                owner_contact_same_as_requester:
                  linkmeDetails.owner_contact_same_as_requester,
                owner_name: linkmeDetails.owner_name,
                owner_email: linkmeDetails.owner_email,
                owner_phone: linkmeDetails.owner_phone,
                owner_company_legal_name:
                  linkmeDetails.owner_company_legal_name,
                owner_company_trade_name:
                  linkmeDetails.owner_company_trade_name,
                billing_contact_source: linkmeDetails.billing_contact_source,
                billing_name: linkmeDetails.billing_name,
                billing_email: linkmeDetails.billing_email,
                billing_phone: linkmeDetails.billing_phone,
                desired_delivery_date: linkmeDetails.desired_delivery_date,
                mall_form_required: linkmeDetails.mall_form_required,
              } as PendingOrderLinkMeDetails)
            : null,
          items,
        } as PendingOrder);
      }

      return enrichedOrders;
    },
    staleTime: 300_000,
  });
}
