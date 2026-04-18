'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { createClient } from '@verone/utils/supabase/client';

import type {
  OrderWithDetails,
  EnrichedOrderItem,
  ContactRef,
  SalesOrderItemRaw,
  LinkmeOrderItemEnrichedRaw,
  CreatedByProfile,
  InfoRequest,
} from './components/types';
import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';

export function useFetchOrder(orderId: string) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('sales_orders')
        .select(
          `
          id, order_number, linkme_display_number, created_at, order_date, status, total_ht, total_ttc, notes,
          customer_id, customer_type, expected_delivery_date, pending_admin_validation,
          created_by_affiliate_id, linkme_selection_id, created_by,
          payment_status_v2, payment_terms, currency, tax_rate,
          shipping_cost_ht, handling_cost_ht, insurance_cost_ht, fees_vat_rate,
          responsable_contact_id, billing_contact_id, delivery_contact_id,
          organisations!sales_orders_customer_id_fkey (
            id, trade_name, legal_name, approval_status, enseigne_id, ownership_type,
            address_line1, address_line2, postal_code, city,
            billing_address_line1, billing_address_line2, billing_city, billing_postal_code,
            shipping_address_line1, shipping_address_line2, shipping_city, shipping_postal_code,
            has_different_shipping_address, phone, email, siret, country, vat_number
          ),
          sales_order_linkme_details (
            id, sales_order_id, requester_type, requester_name, requester_email,
            requester_phone, requester_position, is_new_restaurant, owner_type,
            owner_contact_same_as_requester, owner_name, owner_email, owner_phone,
            owner_company_legal_name, owner_company_trade_name, owner_kbis_url,
            billing_contact_source, billing_name, billing_email, billing_phone,
            delivery_terms_accepted, delivery_date, desired_delivery_date,
            mall_form_required, mall_form_email,
            delivery_contact_name, delivery_contact_email, delivery_contact_phone,
            delivery_address, delivery_postal_code, delivery_city, delivery_notes,
            is_mall_delivery, mall_email, semi_trailer_accessible,
            access_form_required, access_form_url,
            step4_token, step4_token_expires_at, step4_completed_at,
            reception_contact_name, reception_contact_email, reception_contact_phone,
            confirmed_delivery_date, created_at, updated_at
          ),
          linkme_info_requests (
            id, token, recipient_email, recipient_type, sent_at,
            completed_at, cancelled_at, cancelled_reason
          ),
          sales_order_items (
            id, product_id, quantity, unit_price_ht, total_ht, tax_rate,
            products ( name, sku )
          )
        `
        )
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const rawOrder = orderData as Record<string, unknown>;
      if (
        !rawOrder['created_by_affiliate_id'] &&
        !rawOrder['linkme_selection_id']
      ) {
        router.replace(`/commandes/clients?id=${orderId}`);
        return;
      }

      const respContactId = rawOrder.responsable_contact_id as string | null;
      const billContactId = rawOrder.billing_contact_id as string | null;
      const delContactId = rawOrder.delivery_contact_id as string | null;
      const uniqueContactIds = [
        ...new Set(
          [respContactId, billContactId, delContactId].filter(Boolean)
        ),
      ] as string[];

      const linkmeDetailsRaw: unknown = orderData.sales_order_linkme_details;
      const linkmeData = (
        Array.isArray(linkmeDetailsRaw)
          ? (linkmeDetailsRaw[0] ?? null)
          : (linkmeDetailsRaw ?? null)
      ) as LinkMeOrderDetails | null;

      const infoRequestsRaw: unknown = rawOrder.linkme_info_requests;
      const infoRequests = (
        Array.isArray(infoRequestsRaw) ? infoRequestsRaw : []
      ) as InfoRequest[];

      const createdByUserId = rawOrder.created_by as string | null;
      const [contactResults, profileResult, linkResult] = await Promise.all([
        Promise.all(
          uniqueContactIds.map(id =>
            supabase
              .from('contacts')
              .select('id, first_name, last_name, email, phone, title')
              .eq('id', id)
              .single()
              .then(r => ({ id, data: r.data as ContactRef | null }))
          )
        ),
        createdByUserId
          ? supabase
              .from('user_profiles')
              .select('first_name, last_name, email')
              .eq('user_id', createdByUserId)
              .single()
          : Promise.resolve({ data: null }),
        supabase
          .from('transaction_document_links')
          .select(
            `sales_order_id, transaction_id,
            bank_transactions!inner ( id, label, amount, emitted_at, attachment_ids )`
          )
          .eq('sales_order_id', orderId)
          .eq('link_type', 'sales_order')
          .limit(1),
      ]);

      const contactMap = new Map<string, ContactRef>();
      for (const cr of contactResults) {
        if (cr.data) contactMap.set(cr.id, cr.data);
      }

      const createdByProfile = (profileResult.data as CreatedByProfile) ?? null;
      let matchInfo: {
        transaction_id: string;
        label: string;
        amount: number;
        emitted_at: string | null;
        attachment_ids: string[] | null;
      } | null = null;
      const linkData = linkResult.data;
      if (linkData && linkData.length > 0 && linkData[0].bank_transactions) {
        const bt = linkData[0].bank_transactions as Record<string, unknown>;
        matchInfo = {
          transaction_id: (bt.id as string) || '',
          label: (bt.label as string) || '',
          amount: (bt.amount as number) || 0,
          emitted_at: (bt.emitted_at as string) || null,
          attachment_ids: (bt.attachment_ids as string[]) || null,
        };
      }

      setOrder({
        id: orderData.id,
        order_number: orderData.order_number,
        linkme_display_number:
          (orderData as unknown as { linkme_display_number?: string | null })
            .linkme_display_number ?? null,
        created_at: orderData.created_at,
        order_date:
          (orderData as unknown as { order_date?: string | null }).order_date ??
          null,
        status: orderData.status,
        total_ht: orderData.total_ht,
        total_ttc: orderData.total_ttc,
        notes: orderData.notes,
        customer_id: orderData.customer_id,
        expected_delivery_date: orderData.expected_delivery_date,
        pending_admin_validation: orderData.pending_admin_validation ?? null,
        created_by_affiliate_id: orderData.created_by_affiliate_id ?? null,
        linkme_selection_id: orderData.linkme_selection_id ?? null,
        created_by: createdByUserId,
        payment_status: null,
        payment_status_v2: orderData.payment_status_v2 ?? null,
        payment_terms: orderData.payment_terms ?? null,
        currency: orderData.currency ?? null,
        tax_rate: orderData.tax_rate ?? null,
        shipping_cost_ht: orderData.shipping_cost_ht ?? null,
        handling_cost_ht: orderData.handling_cost_ht ?? null,
        insurance_cost_ht: orderData.insurance_cost_ht ?? null,
        fees_vat_rate: orderData.fees_vat_rate ?? null,
        createdByProfile,
        organisation: (rawOrder.organisations ??
          null) as OrderWithDetails['organisation'],
        responsable_contact_id: respContactId,
        billing_contact_id: billContactId,
        delivery_contact_id: delContactId,
        responsable_contact: respContactId
          ? (contactMap.get(respContactId) ?? null)
          : null,
        billing_contact: billContactId
          ? (contactMap.get(billContactId) ?? null)
          : null,
        delivery_contact: delContactId
          ? (contactMap.get(delContactId) ?? null)
          : null,
        items: ((orderData.sales_order_items ?? []) as SalesOrderItemRaw[]).map(
          (item: SalesOrderItemRaw) => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            total_ht: item.total_ht,
            tax_rate: item.tax_rate ?? null,
            product: item.products,
          })
        ),
        linkmeDetails: linkmeData,
        infoRequests,
        is_matched: !!matchInfo,
        matched_transaction_id: matchInfo?.transaction_id ?? null,
        matched_transaction_label: matchInfo?.label ?? null,
        matched_transaction_amount: matchInfo?.amount ?? null,
        matched_transaction_emitted_at: matchInfo?.emitted_at ?? null,
        matched_transaction_attachment_ids: matchInfo?.attachment_ids ?? null,
      });

      const { data: enrichedData } = await supabase
        .from('linkme_order_items_enriched')
        .select(
          'id, product_id, product_name, product_sku, product_image_url, quantity, unit_price_ht, total_ht, base_price_ht, margin_rate, commission_rate, selling_price_ht, affiliate_margin, retrocession_rate, created_by_affiliate, affiliate_commission_rate'
        )
        .eq('sales_order_id', orderId);

      if (enrichedData && enrichedData.length > 0) {
        const typed = enrichedData as LinkmeOrderItemEnrichedRaw[];

        // Fetch stock for all products
        const productIds = typed.map(i => i.product_id).filter(Boolean);
        const { data: stockData } =
          productIds.length > 0
            ? await supabase
                .from('products')
                .select(
                  'id, stock_real, stock_forecasted_in, stock_forecasted_out'
                )
                .in('id', productIds)
            : { data: null };
        const stockMap = new Map(
          (stockData ?? []).map(
            (p: {
              id: string;
              stock_real: number | null;
              stock_forecasted_in: number | null;
              stock_forecasted_out: number | null;
            }) => [
              p.id,
              {
                stock_real: p.stock_real,
                stock_forecasted:
                  (p.stock_real ?? 0) +
                  (p.stock_forecasted_in ?? 0) -
                  (p.stock_forecasted_out ?? 0),
              },
            ]
          )
        );

        setEnrichedItems(
          typed.map((item: LinkmeOrderItemEnrichedRaw) => {
            const stock = stockMap.get(item.product_id);
            return {
              id: item.id,
              product_id: item.product_id,
              product_name: item.product_name ?? 'Produit inconnu',
              product_sku: item.product_sku ?? '-',
              product_image_url: item.product_image_url,
              quantity: item.quantity ?? 0,
              unit_price_ht: item.unit_price_ht ?? 0,
              total_ht: item.total_ht ?? 0,
              base_price_ht: item.base_price_ht ?? 0,
              margin_rate: item.margin_rate ?? 0,
              commission_rate: item.commission_rate ?? 0,
              selling_price_ht: item.selling_price_ht ?? 0,
              affiliate_margin: item.affiliate_margin ?? 0,
              retrocession_rate: item.retrocession_rate ?? 0,
              created_by_affiliate: item.created_by_affiliate ?? null,
              stock_real: stock?.stock_real ?? null,
              stock_forecasted: stock?.stock_forecasted ?? null,
            };
          })
        );
      }
    } catch (err) {
      console.error('Erreur fetch commande:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors du chargement'
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderId, router]);

  return { order, setOrder, enrichedItems, isLoading, error, fetchOrder };
}
