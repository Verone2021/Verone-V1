'use client';

/**
 * Sales Orders — fetchOrders (list all orders with enrichment)
 * Extracted from use-sales-orders-fetch.ts for max-lines compliance
 */

import { useCallback } from 'react';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { SalesOrder, SalesOrderFilters } from './types/sales-order.types';

interface WindowWithFetchFlag extends Window {
  __VERONE_FETCH_ACTIVE__?: boolean;
}

type ToastFn = ReturnType<
  typeof import('@verone/common/hooks').useToast
>['toast'];

export interface FetchListDeps {
  supabase: SupabaseClient;
  toastRef: { current: ToastFn };
  setLoading: (loading: boolean) => void;
  setOrders: (orders: SalesOrder[]) => void;
}

export function useFetchOrdersList({
  supabase,
  toastRef,
  setLoading,
  setOrders,
}: FetchListDeps) {
  const fetchOrders = useCallback(
    async (filters?: SalesOrderFilters) => {
      setLoading(true);
      if (typeof window !== 'undefined') {
        (window as unknown as WindowWithFetchFlag).__VERONE_FETCH_ACTIVE__ =
          true;
      }
      try {
        let query = supabase
          .from('sales_orders')
          .select(
            `
          id, order_number, linkme_display_number, created_at, status,
          total_ht, total_ttc, customer_id, customer_type,
          expected_delivery_date, created_by_affiliate_id,
          linkme_selection_id, pending_admin_validation,
          payment_status_v2, channel_id,
          individual_customer_id, eco_tax_total, order_date, created_by,
          responsable_contact_id, billing_contact_id, delivery_contact_id,
          sales_channel:sales_channels!left(id, name, code),
          billing_contact:contacts!sales_orders_billing_contact_id_fkey(id, first_name, last_name, email, phone),
          delivery_contact:contacts!sales_orders_delivery_contact_id_fkey(id, first_name, last_name, email, phone),
          responsable_contact:contacts!sales_orders_responsable_contact_id_fkey(id, first_name, last_name, email, phone),
          sales_order_items (
            id, product_id, quantity, unit_price_ht, total_ht, tax_rate,
            products (
              id, name, sku, stock_quantity, stock_real,
              stock_forecasted_in, stock_forecasted_out,
              product_images!left (public_url, is_primary)
            )
          )
        `
          )
          .order('created_at', { ascending: false })
          .limit(500);

        if (filters?.customer_id)
          query = query.eq('customer_id', filters.customer_id);
        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.date_from)
          query = query.gte('created_at', filters.date_from);
        if (filters?.date_to) query = query.lte('created_at', filters.date_to);
        if (filters?.order_number)
          query = query.ilike('order_number', `%${filters.order_number}%`);
        if (filters?.channel_id)
          query = query.eq('channel_id', filters.channel_id);

        const { data: ordersData, error } = await query;
        if (error) throw error;

        type OrderRow = {
          id: string;
          order_number: string | null;
          linkme_display_number: string | null;
          created_at: string | null;
          status: string | null;
          total_ht: number | null;
          total_ttc: number | null;
          customer_id: string | null;
          customer_type: string | null;
          expected_delivery_date: string | null;
          created_by_affiliate_id: string | null;
          linkme_selection_id: string | null;
          pending_admin_validation: boolean | null;
          payment_status_v2: string | null;
          channel_id: string | null;
          individual_customer_id: string | null;
          eco_tax_total: number | null;
          order_date: string | null;
          created_by: string | null;
          responsable_contact_id: string | null;
          billing_contact_id: string | null;
          delivery_contact_id: string | null;
          sales_channel: { id: string; name: string; code: string } | null;
          billing_contact: {
            id: string;
            first_name: string | null;
            last_name: string | null;
            email: string | null;
            phone: string | null;
          } | null;
          delivery_contact: {
            id: string;
            first_name: string | null;
            last_name: string | null;
            email: string | null;
            phone: string | null;
          } | null;
          responsable_contact: {
            id: string;
            first_name: string | null;
            last_name: string | null;
            email: string | null;
            phone: string | null;
          } | null;
          sales_order_items: Array<{
            id: string;
            product_id: string | null;
            quantity: number | null;
            unit_price_ht: number | null;
            total_ht: number | null;
            tax_rate: number | null;
            products: {
              id: string;
              name: string | null;
              sku: string | null;
              stock_quantity: number | null;
              stock_real: number | null;
              stock_forecasted_in: number | null;
              stock_forecasted_out: number | null;
              product_images: Array<{
                public_url: string | null;
                is_primary: boolean | null;
              }> | null;
            } | null;
          }> | null;
        };

        const typedOrdersData = (ordersData ?? []) as unknown as OrderRow[];

        const orderIds = typedOrdersData.map(o => o.id);
        const uniqueCreatorIds = [
          ...new Set(
            typedOrdersData
              .map(o => o.created_by)
              .filter((id): id is string => !!id)
          ),
        ];
        const orgIds = typedOrdersData
          .filter(o => o.customer_type === 'organization' && o.customer_id)
          .map(o => o.customer_id)
          .filter((id): id is string => id !== null);
        const individualIds = typedOrdersData
          .filter(
            o => o.customer_type === 'individual' && o.individual_customer_id
          )
          .map(o => o.individual_customer_id)
          .filter((id): id is string => id !== null);

        const matchedOrdersMap = new Map<
          string,
          {
            transaction_id: string;
            label: string;
            amount: number;
            emitted_at: string | null;
            attachment_ids: string[] | null;
          }
        >();
        const invoiceMap = new Map<
          string,
          { id: string; qontoId: string | null; number: string; status: string }
        >();
        const quoteMap = new Map<string, { qontoId: string; number: string }>();
        const creatorsMap = new Map<
          string,
          { first_name: string; last_name: string; email: string | null }
        >();
        const orgsMap = new Map<string, Record<string, unknown>>();
        const individualsMap = new Map<string, Record<string, unknown>>();

        if (orderIds.length > 0) {
          const [
            linksData,
            invoicesData,
            quotesData,
            profilesData,
            orgsData,
            individualsData,
          ] = await Promise.all([
            Promise.resolve(
              supabase
                .from('transaction_document_links')
                .select(
                  'sales_order_id, transaction_id, bank_transactions!inner (id, label, amount, emitted_at, attachment_ids)'
                )
                .in('sales_order_id', orderIds)
            )
              .then(
                r =>
                  r.data as Array<{
                    sales_order_id: string;
                    transaction_id: string;
                    bank_transactions: {
                      id: string;
                      label: string | null;
                      amount: number | null;
                      emitted_at: string | null;
                      attachment_ids: string[] | null;
                    };
                  }> | null
              )
              .catch(() => null),
            Promise.resolve(
              supabase
                .from('financial_documents')
                .select(
                  'id, sales_order_id, document_number, qonto_invoice_id, status'
                )
                .in('sales_order_id', orderIds)
                .eq('document_type', 'customer_invoice')
                .is('deleted_at', null)
            )
              .then(
                r =>
                  r.data as Array<{
                    id: string;
                    sales_order_id: string | null;
                    document_number: string;
                    qonto_invoice_id: string | null;
                    status: string;
                  }> | null
              )
              .catch(() => null),
            Promise.resolve(
              supabase
                .from('sales_orders')
                .select('id, quote_qonto_id, quote_number')
                .in('id', orderIds)
                .not('quote_qonto_id', 'is', null)
            )
              .then(
                r =>
                  r.data as Array<{
                    id: string;
                    quote_qonto_id: string | null;
                    quote_number: string | null;
                  }> | null
              )
              .catch(() => null),
            uniqueCreatorIds.length > 0
              ? Promise.resolve(
                  supabase
                    .from('user_profiles')
                    .select('user_id, first_name, last_name')
                    .in('user_id', uniqueCreatorIds)
                )
                  .then(
                    r =>
                      r.data as Array<{
                        user_id: string;
                        first_name: string | null;
                        last_name: string | null;
                      }> | null
                  )
                  .catch(() => null)
              : Promise.resolve(null),
            orgIds.length > 0
              ? Promise.resolve(
                  supabase
                    .from('organisations')
                    .select(
                      'id, legal_name, trade_name, email, phone, website, address_line1, address_line2, postal_code, city, region, enseigne_id, siret, vat_number, billing_address_line1, billing_address_line2, billing_city, billing_postal_code, billing_country'
                    )
                    .in('id', orgIds)
                )
                  .then(
                    r =>
                      r.data as Array<{
                        id: string;
                        [key: string]: unknown;
                      }> | null
                  )
                  .catch(() => null)
              : Promise.resolve(null),
            individualIds.length > 0
              ? Promise.resolve(
                  supabase
                    .from('individual_customers')
                    .select(
                      'id, first_name, last_name, email, phone, address_line1, address_line2, postal_code, city'
                    )
                    .in('id', individualIds)
                )
                  .then(
                    r =>
                      r.data as Array<{
                        id: string;
                        [key: string]: unknown;
                      }> | null
                  )
                  .catch(() => null)
              : Promise.resolve(null),
          ]);

          for (const link of linksData ?? []) {
            if (link.sales_order_id && link.bank_transactions) {
              const bt = link.bank_transactions;
              matchedOrdersMap.set(link.sales_order_id, {
                transaction_id: bt.id,
                label: bt.label ?? '',
                amount: bt.amount ?? 0,
                emitted_at: bt.emitted_at ?? null,
                attachment_ids: bt.attachment_ids ?? null,
              });
            }
          }
          for (const inv of invoicesData ?? []) {
            if (inv.sales_order_id)
              invoiceMap.set(inv.sales_order_id, {
                id: inv.id,
                qontoId: inv.qonto_invoice_id,
                number: inv.document_number,
                status: inv.status,
              });
          }
          for (const row of quotesData ?? []) {
            if (row.quote_qonto_id)
              quoteMap.set(row.id, {
                qontoId: row.quote_qonto_id,
                number: row.quote_number ?? '-',
              });
          }
          for (const profile of profilesData ?? []) {
            if (profile.user_id)
              creatorsMap.set(profile.user_id, {
                first_name: profile.first_name ?? 'Utilisateur',
                last_name: profile.last_name ?? '',
                email: null,
              });
          }
          for (const org of orgsData ?? []) orgsMap.set(org.id, org);
          for (const ind of individualsData ?? [])
            individualsMap.set(ind.id, ind);
        }

        const pendingPacklinkSet = new Set<string>();
        if (orderIds.length > 0) {
          const { data: pendingPacklink } = await supabase
            .from('sales_order_shipments')
            .select('sales_order_id')
            .in('sales_order_id', orderIds)
            .eq('packlink_status', 'a_payer');
          for (const p of (pendingPacklink ?? []) as Array<{
            sales_order_id: string | null;
          }>) {
            if (p.sales_order_id) pendingPacklinkSet.add(p.sales_order_id);
          }
        }

        const ordersWithCustomers = typedOrdersData.map(order => {
          let customerData: Record<string, Record<string, unknown>> | null =
            null;
          if (order.customer_type === 'organization' && order.customer_id) {
            const org = orgsMap.get(order.customer_id);
            customerData = org ? { organisations: org } : null;
          } else if (
            order.customer_type === 'individual' &&
            order.individual_customer_id
          ) {
            const individual = individualsMap.get(order.individual_customer_id);
            customerData = individual
              ? { individual_customers: individual }
              : null;
          }

          const enrichedItems = (order.sales_order_items ?? []).map(item => {
            const prod = item.products;
            return {
              ...item,
              products: prod
                ? {
                    ...prod,
                    primary_image_url:
                      prod.product_images?.[0]?.public_url ?? null,
                  }
                : null,
            };
          });

          const creatorInfo = order.created_by
            ? creatorsMap.get(order.created_by)
            : null;
          const matchInfo = matchedOrdersMap.get(order.id);

          return {
            ...order,
            sales_order_items: enrichedItems,
            creator: creatorInfo ?? null,
            invoice_id: invoiceMap.get(order.id)?.id ?? null,
            invoice_qonto_id: invoiceMap.get(order.id)?.qontoId ?? null,
            invoice_number: invoiceMap.get(order.id)?.number ?? null,
            invoice_status: invoiceMap.get(order.id)?.status ?? null,
            quote_qonto_id: quoteMap.get(order.id)?.qontoId ?? null,
            quote_number: quoteMap.get(order.id)?.number ?? null,
            has_pending_packlink: pendingPacklinkSet.has(order.id),
            is_matched: !!matchInfo,
            matched_transaction_id: matchInfo?.transaction_id ?? null,
            matched_transaction_label: matchInfo?.label ?? null,
            matched_transaction_amount: matchInfo?.amount ?? null,
            matched_transaction_emitted_at: matchInfo?.emitted_at ?? null,
            matched_transaction_attachment_ids:
              matchInfo?.attachment_ids ?? null,
            ...customerData,
          };
        });

        setOrders(ordersWithCustomers as unknown as SalesOrder[]);
      } catch (error: unknown) {
        const errMsg =
          error instanceof Error ? error.message : 'Erreur inconnue';
        console.error(
          '[FETCH] Erreur lors de la récupération des commandes:',
          errMsg,
          error
        );
        toastRef.current({
          title: 'Erreur',
          description: 'Impossible de récupérer les commandes',
          variant: 'destructive',
        });
      } finally {
        if (typeof window !== 'undefined') {
          (window as unknown as WindowWithFetchFlag).__VERONE_FETCH_ACTIVE__ =
            false;
        }
        setLoading(false);
      }
    },
    [supabase, setLoading, setOrders, toastRef]
  );

  return fetchOrders;
}
