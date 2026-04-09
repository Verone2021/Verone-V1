'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import type {
  PendingOrder,
  PendingOrderItem,
  OrderValidationStatus,
} from './types';

/**
 * Hook: récupère toutes les commandes LinkMe avec filtre par status de validation
 * - pending: pending_admin_validation = true
 * - approved: pending_admin_validation = false AND status != 'cancelled'
 * - rejected: status = 'cancelled'
 */
export function useAllLinkMeOrders(status?: OrderValidationStatus) {
  return useQuery({
    queryKey: ['linkme-orders', status],
    queryFn: async (): Promise<PendingOrder[]> => {
      const supabase = createClient();

      // Base query for LinkMe orders
      let query = supabase
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
          pending_admin_validation,
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
            delivery_contact_name,
            delivery_contact_email,
            delivery_contact_phone,
            delivery_address,
            delivery_postal_code,
            delivery_city,
            is_mall_delivery,
            mall_email,
            desired_delivery_date,
            mall_form_required,
            ignored_missing_fields,
            missing_fields_count
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
        .not('linkme_selection_id', 'is', null)
        .not('status', 'in', '(shipped,delivered)');

      // Apply status filter
      if (status === 'pending') {
        query = query.eq('pending_admin_validation', true);
      } else if (status === 'approved') {
        query = query.not('confirmed_at', 'is', null);
      } else if (status === 'rejected') {
        query = query.eq('status', 'cancelled');
      }

      const { data: orders, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        console.error('Error fetching LinkMe orders:', error);
        throw error;
      }

      // BATCH: Récupérer toutes les organisations en UNE SEULE requête
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
          siret: string | null;
          country: string | null;
          vat_number: string | null;
          billing_address_line1: string | null;
          billing_postal_code: string | null;
          billing_city: string | null;
        }
      >();

      if (organisationIds.length > 0) {
        const { data: orgsData } = await supabase
          .from('organisations')
          .select(
            `
            id,
            trade_name,
            legal_name,
            siret,
            country,
            vat_number,
            billing_address_line1,
            billing_postal_code,
            billing_city,
            enseignes!left(name)
          `
          )
          .in('id', organisationIds);

        if (orgsData) {
          orgsData.forEach((org: Record<string, unknown>) => {
            const enseignes = org.enseignes as
              | { name: string }
              | { name: string }[]
              | null;
            const enseigneName = enseignes
              ? Array.isArray(enseignes)
                ? (enseignes[0]?.name ?? null)
                : (enseignes.name ?? null)
              : null;
            organisationsMap.set(org.id as string, {
              trade_name: org.trade_name as string | null,
              legal_name: org.legal_name as string | null,
              enseigne_name: enseigneName,
              siret: (org.siret as string | null) ?? null,
              country: (org.country as string | null) ?? null,
              vat_number: (org.vat_number as string | null) ?? null,
              billing_address_line1:
                (org.billing_address_line1 as string | null) ?? null,
              billing_postal_code:
                (org.billing_postal_code as string | null) ?? null,
              billing_city: (org.billing_city as string | null) ?? null,
            });
          });
        }
      }

      // Enrichir les commandes
      const enrichedOrders: PendingOrder[] = [];

      for (const order of orders ?? []) {
        const linkmeDetails = order.sales_order_linkme_details as Record<
          string,
          unknown
        > | null;
        const rawItems = order.sales_order_items as Record<string, unknown>[];

        const orgData = order.customer_id
          ? organisationsMap.get(order.customer_id)
          : null;

        const items: PendingOrderItem[] = (rawItems ?? []).map(item => {
          const products = item.products as Record<string, unknown> | null;
          const productImages = products?.product_images as
            | { public_url: string; is_primary: boolean }[]
            | null;
          const primaryImage = productImages?.find(img => img.is_primary);

          return {
            id: item.id as string,
            quantity: item.quantity as number,
            unit_price_ht: item.unit_price_ht as number,
            total_ht: item.total_ht as number,
            products: products
              ? {
                  id: products.id as string,
                  name: products.name as string,
                  sku: (products.sku as string) ?? '',
                  primary_image_url: primaryImage?.public_url ?? null,
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
          organisation_name: orgData?.trade_name ?? orgData?.legal_name ?? null,
          enseigne_name: orgData?.enseigne_name ?? null,
          requester_type: linkmeDetails?.requester_type as string | null,
          requester_name: linkmeDetails?.requester_name as string | null,
          requester_email: linkmeDetails?.requester_email as string | null,
          linkme_details: linkmeDetails
            ? {
                is_new_restaurant:
                  (linkmeDetails.is_new_restaurant as boolean) ?? false,
                requester_type: linkmeDetails.requester_type as string | null,
                requester_name: linkmeDetails.requester_name as string | null,
                requester_email: linkmeDetails.requester_email as string | null,
                requester_phone: linkmeDetails.requester_phone as string | null,
                requester_position: linkmeDetails.requester_position as
                  | string
                  | null,
                owner_type: linkmeDetails.owner_type as string | null,
                owner_contact_same_as_requester:
                  linkmeDetails.owner_contact_same_as_requester as
                    | boolean
                    | null,
                owner_name: linkmeDetails.owner_name as string | null,
                owner_email: linkmeDetails.owner_email as string | null,
                owner_phone: linkmeDetails.owner_phone as string | null,
                owner_company_legal_name:
                  linkmeDetails.owner_company_legal_name as string | null,
                owner_company_trade_name:
                  linkmeDetails.owner_company_trade_name as string | null,
                billing_contact_source: linkmeDetails.billing_contact_source as
                  | string
                  | null,
                billing_name: linkmeDetails.billing_name as string | null,
                billing_email: linkmeDetails.billing_email as string | null,
                billing_phone: linkmeDetails.billing_phone as string | null,
                delivery_contact_name: linkmeDetails.delivery_contact_name as
                  | string
                  | null,
                delivery_contact_email: linkmeDetails.delivery_contact_email as
                  | string
                  | null,
                delivery_contact_phone: linkmeDetails.delivery_contact_phone as
                  | string
                  | null,
                delivery_address: linkmeDetails.delivery_address as
                  | string
                  | null,
                delivery_postal_code: linkmeDetails.delivery_postal_code as
                  | string
                  | null,
                delivery_city: linkmeDetails.delivery_city as string | null,
                is_mall_delivery: linkmeDetails.is_mall_delivery as
                  | boolean
                  | null,
                mall_email: linkmeDetails.mall_email as string | null,
                desired_delivery_date: linkmeDetails.desired_delivery_date as
                  | string
                  | null,
                mall_form_required: linkmeDetails.mall_form_required as
                  | boolean
                  | null,
                ignored_missing_fields: linkmeDetails.ignored_missing_fields as
                  | string[]
                  | null,
                missing_fields_count: linkmeDetails.missing_fields_count as
                  | number
                  | null,
              }
            : null,
          organisation_siret: orgData?.siret ?? null,
          organisation_country: orgData?.country ?? null,
          organisation_vat_number: orgData?.vat_number ?? null,
          organisation_legal_name: orgData?.legal_name ?? null,
          organisation_billing_address: orgData?.billing_address_line1 ?? null,
          organisation_billing_postal_code:
            orgData?.billing_postal_code ?? null,
          organisation_billing_city: orgData?.billing_city ?? null,
          items,
        });
      }

      return enrichedOrders;
    },
    staleTime: 300_000,
  });
}
