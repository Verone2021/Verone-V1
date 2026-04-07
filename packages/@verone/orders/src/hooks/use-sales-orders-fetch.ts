'use client';

/**
 * Sales Orders — Fetch single order + stats
 * Internal helper for use-sales-orders.ts orchestrator
 */

import { useCallback } from 'react';

import type {
  SalesOrder,
  SalesOrderFilters,
  SalesOrderStats,
} from './types/sales-order.types';
import {
  useFetchOrdersList,
  type FetchListDeps,
} from './use-sales-orders-fetch-list';

interface FetchDeps extends FetchListDeps {
  setCurrentOrder: (order: SalesOrder | null) => void;
  setStats: (stats: SalesOrderStats | null) => void;
}

export function useSalesOrdersFetch({
  supabase,
  toastRef,
  setLoading,
  setOrders,
  setCurrentOrder,
  setStats,
}: FetchDeps) {
  const fetchOrders = useFetchOrdersList({
    supabase,
    toastRef,
    setLoading,
    setOrders,
  });

  const fetchOrder = useCallback(
    async (orderId: string): Promise<SalesOrder | null> => {
      setLoading(true);
      try {
        const singleResult = await supabase
          .from('sales_orders')
          .select(
            `
          *,
          sales_channel:sales_channels!left(id, name, code),
          billing_contact:contacts!sales_orders_billing_contact_id_fkey(id, first_name, last_name, email, phone),
          delivery_contact:contacts!sales_orders_delivery_contact_id_fkey(id, first_name, last_name, email, phone),
          responsable_contact:contacts!sales_orders_responsable_contact_id_fkey(id, first_name, last_name, email, phone),
          sales_order_items (
            *,
            products (
              id, name, sku, stock_quantity, stock_real,
              stock_forecasted_in, stock_forecasted_out,
              product_images!left (public_url, is_primary)
            )
          )
        `
          )
          .eq('id', orderId)
          .single();

        if (singleResult.error) throw singleResult.error;

        const orderData = singleResult.data as unknown as Record<
          string,
          unknown
        > & {
          customer_type: string | null;
          customer_id: string | null;
          individual_customer_id: string | null;
          created_by: string | null;
          sales_order_items: Array<
            Record<string, unknown> & {
              products:
                | (Record<string, unknown> & {
                    product_images?: Array<{
                      public_url: string | null;
                      is_primary: boolean;
                    }>;
                  })
                | null;
            }
          >;
        };

        let customerData: Record<
          string,
          Record<string, unknown> | null
        > | null = null;

        if (
          orderData.customer_type === 'organization' &&
          orderData.customer_id
        ) {
          const { data: org } = await supabase
            .from('organisations')
            .select(
              'id, legal_name, trade_name, email, phone, website, address_line1, address_line2, postal_code, city, region, siret, vat_number'
            )
            .eq('id', orderData.customer_id)
            .single();
          customerData = { organisations: org };
        } else if (
          orderData.customer_type === 'individual' &&
          orderData.individual_customer_id
        ) {
          const { data: individual } = await supabase
            .from('individual_customers')
            .select(
              'id, first_name, last_name, email, phone, address_line1, address_line2, postal_code, city'
            )
            .eq('id', orderData.individual_customer_id)
            .single();
          customerData = { individual_customers: individual };
        }

        const enrichedItems = (orderData.sales_order_items ?? []).map(item => {
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

        let creatorInfo: {
          first_name: string;
          last_name: string;
          email: string | null;
        } | null = null;

        if (orderData.created_by) {
          const rpcResult = await supabase.rpc('get_user_info', {
            p_user_id: orderData.created_by,
          });
          const userInfoArray = rpcResult.data as unknown as Array<{
            first_name: string | null;
            last_name: string | null;
            email: string | null;
          }> | null;
          if (userInfoArray && userInfoArray.length > 0) {
            creatorInfo = {
              first_name: userInfoArray[0].first_name ?? 'Utilisateur',
              last_name: userInfoArray[0].last_name ?? '',
              email: userInfoArray[0].email ?? null,
            };
          }
        }

        let matchInfo: {
          transaction_id: string;
          label: string;
          amount: number;
          emitted_at: string | null;
          attachment_ids: string[] | null;
        } | null = null;

        const { data: linkData } = await supabase
          .from('transaction_document_links')
          .select(
            'transaction_id, bank_transactions!inner (id, label, amount, emitted_at, attachment_ids)'
          )
          .eq('sales_order_id', orderId)
          .limit(1)
          .maybeSingle();

        if (linkData?.bank_transactions) {
          const bt = linkData.bank_transactions as unknown as {
            id: string;
            label: string | null;
            amount: number | null;
            emitted_at: string | null;
            attachment_ids: string[] | null;
          };
          matchInfo = {
            transaction_id: bt.id,
            label: bt.label ?? '',
            amount: bt.amount ?? 0,
            emitted_at: bt.emitted_at ?? null,
            attachment_ids: bt.attachment_ids ?? null,
          };
        }

        const orderWithCustomer = {
          ...orderData,
          sales_order_items: enrichedItems,
          creator: creatorInfo,
          is_matched: !!matchInfo,
          matched_transaction_id: matchInfo?.transaction_id ?? null,
          matched_transaction_label: matchInfo?.label ?? null,
          matched_transaction_amount: matchInfo?.amount ?? null,
          matched_transaction_emitted_at: matchInfo?.emitted_at ?? null,
          matched_transaction_attachment_ids: matchInfo?.attachment_ids ?? null,
          ...customerData,
        };

        setCurrentOrder(orderWithCustomer as unknown as SalesOrder);
        return orderWithCustomer as unknown as SalesOrder;
      } catch (error) {
        console.error('Erreur lors de la récupération de la commande:', error);
        toastRef.current({
          title: 'Erreur',
          description: 'Impossible de récupérer la commande',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase, setLoading, setCurrentOrder, toastRef]
  );

  const fetchStats = useCallback(
    async (filters?: SalesOrderFilters) => {
      try {
        let query = supabase
          .from('sales_orders')
          .select('status, total_ht, total_ttc');
        if (filters?.channel_id)
          query = query.eq('channel_id', filters.channel_id);
        if (filters?.date_from)
          query = query.gte('created_at', filters.date_from);
        if (filters?.date_to) query = query.lte('created_at', filters.date_to);

        const { data, error } = await query;
        if (error) throw error;

        const statsData = data?.reduce(
          (acc, order) => {
            acc.total_orders++;
            acc.total_ht += order.total_ht ?? 0;
            acc.total_ttc += order.total_ttc ?? 0;
            switch (order.status) {
              case 'draft':
                acc.orders_by_status.draft++;
                acc.pending_orders++;
                break;
              case 'validated':
                acc.orders_by_status.validated++;
                acc.pending_orders++;
                break;
              case 'partially_shipped':
                acc.orders_by_status.partially_shipped++;
                acc.pending_orders++;
                break;
              case 'shipped':
                acc.orders_by_status.shipped++;
                acc.shipped_orders++;
                break;
              case 'cancelled':
                acc.orders_by_status.cancelled++;
                acc.cancelled_orders++;
                break;
            }
            return acc;
          },
          {
            total_orders: 0,
            total_ht: 0,
            total_ttc: 0,
            total_tva: 0,
            total_value: 0,
            average_basket: 0,
            pending_orders: 0,
            shipped_orders: 0,
            cancelled_orders: 0,
            orders_by_status: {
              draft: 0,
              validated: 0,
              partially_shipped: 0,
              shipped: 0,
              cancelled: 0,
            },
          }
        );

        if (statsData) {
          statsData.total_tva = statsData.total_ttc - statsData.total_ht;
          statsData.average_basket =
            statsData.total_orders > 0
              ? statsData.total_ttc / statsData.total_orders
              : 0;
          statsData.total_value = statsData.total_ttc;
        }

        setStats(statsData ?? null);
      } catch (error: unknown) {
        const errMsg =
          error instanceof Error ? error.message : 'Erreur inconnue';
        console.error(
          'Erreur lors de la récupération des statistiques:',
          errMsg
        );
      }
    },
    [supabase, setStats]
  );

  return { fetchOrders, fetchOrder, fetchStats };
}
