'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type {
  IDocumentAddress,
  IOrderForDocument,
  OrderListItem,
  SalesOrderStatus,
} from './types';

const DEFAULT_STATUSES: SalesOrderStatus[] = ['validated', 'shipped'];

export function useOrderSelect(
  open: boolean,
  statuses: SalesOrderStatus[] = DEFAULT_STATUSES
) {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  // Le tableau `statuses` est recréé par le caller à chaque render (default
  // value `[...DEFAULT_STATUSES]`, ou prop spreadée). Le mettre en dep d'un
  // useCallback déclenche une boucle infinie : loadOrders -> setOrders ->
  // re-render parent -> nouveau tableau -> nouveau useCallback -> useEffect
  // -> loadOrders. On hash le tableau en string stable via useMemo + JSON
  // (clé canonique tri+join) et on travaille sur ce hash dans les deps.
  const statusesKey = useMemo(
    () => [...statuses].sort().join(','),
    // ESLint ne sait pas que statuses est intentionnellement traité par hash.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statuses.join(',')]
  );

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

      const { data: ordersData, error: ordersError } = await supabase
        .from('sales_orders')
        .select(
          `id, order_number, total_ht, total_ttc, tax_rate, currency, payment_terms, status, created_at, customer_id, customer_type, payment_status_v2, invoiced_at, order_date`
        )
        .in('status', statuses)
        .or('payment_status_v2.is.null,payment_status_v2.neq.paid')
        .is('invoiced_at', null)
        .or(
          `order_date.gte.${sixMonthsAgoStr},and(order_date.is.null,created_at.gte.${sixMonthsAgo.toISOString()})`
        )
        .order('created_at', { ascending: false })
        .limit(100);

      if (ordersError || !ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      const orgIds = ordersData
        .filter(o => o.customer_type === 'organization')
        .map(o => o.customer_id)
        .filter((id): id is string => id !== null);
      const indivIds = ordersData
        .filter(o => o.customer_type === 'individual')
        .map(o => o.customer_id)
        .filter((id): id is string => id !== null);

      const orgMap = new Map<string, { name: string; email: string | null }>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organisations')
          .select('id, legal_name, trade_name, email')
          .in('id', orgIds);
        if (orgs) {
          for (const org of orgs) {
            orgMap.set(org.id, {
              name: org.trade_name ?? org.legal_name ?? 'Organisation',
              email: org.email,
            });
          }
        }
      }

      const indivMap = new Map<
        string,
        { name: string; email: string | null }
      >();
      if (indivIds.length > 0) {
        const { data: indivs } = await supabase
          .from('individual_customers')
          .select('id, first_name, last_name, email')
          .in('id', indivIds);
        if (indivs) {
          for (const indiv of indivs) {
            indivMap.set(indiv.id, {
              name:
                `${indiv.first_name ?? ''} ${indiv.last_name ?? ''}`.trim() ||
                'Client',
              email: indiv.email,
            });
          }
        }
      }

      const orderIds = ordersData.map(o => o.id);
      const invoicedOrderIds = new Set<string>();
      if (orderIds.length > 0) {
        const { data: docs } = await supabase
          .from('financial_documents')
          .select('sales_order_id, document_type')
          .in('sales_order_id', orderIds)
          .is('deleted_at', null)
          .neq('status', 'cancelled');
        const invoiceCount = new Map<string, number>();
        const creditNoteCount = new Map<string, number>();
        for (const doc of docs ?? []) {
          const orderId = doc.sales_order_id;
          if (!orderId) continue;
          if (doc.document_type === 'customer_invoice')
            invoiceCount.set(orderId, (invoiceCount.get(orderId) ?? 0) + 1);
          else if (doc.document_type === 'customer_credit_note')
            creditNoteCount.set(
              orderId,
              (creditNoteCount.get(orderId) ?? 0) + 1
            );
        }
        for (const [orderId, count] of invoiceCount) {
          if (count > (creditNoteCount.get(orderId) ?? 0))
            invoicedOrderIds.add(orderId);
        }
      }

      const allOrders: OrderListItem[] = ordersData
        .filter(o => !invoicedOrderIds.has(o.id))
        .map(order => {
          let customerInfo = { name: 'Client', email: null as string | null };
          if (order.customer_type === 'organization' && order.customer_id)
            customerInfo = orgMap.get(order.customer_id) ?? customerInfo;
          else if (order.customer_type === 'individual' && order.customer_id)
            customerInfo = indivMap.get(order.customer_id) ?? customerInfo;
          return {
            id: order.id,
            order_number: order.order_number,
            total_ht: order.total_ht ?? 0,
            total_ttc: order.total_ttc ?? 0,
            tax_rate: order.tax_rate ?? 20,
            currency: order.currency ?? 'EUR',
            payment_terms: order.payment_terms ?? 'immediate',
            status: order.status,
            created_at: order.created_at,
            customer_id: order.customer_id,
            customer_type: order.customer_type,
            customer_name: customerInfo.name,
            customer_email: customerInfo.email,
            payment_status_v2: order.payment_status_v2 ?? null,
          };
        });

      setOrders(allOrders);
    } catch (error) {
      console.error('[OrderSelect] Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
    // statuses est lu via la closure mais sa stabilité est garantie par
    // statusesKey (hash string) — voir commentaire ci-dessus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, statusesKey]);

  const fetchOrderDetails = useCallback(
    async (orderId: string): Promise<IOrderForDocument | null> => {
      setLoadingOrder(true);
      setSelectedOrderId(orderId);
      try {
        const { data: order, error } = await supabase
          .from('sales_orders')
          .select(
            `id, order_number, total_ht, total_ttc, tax_rate, currency, payment_terms, customer_type, customer_id, billing_address, shipping_address, shipping_cost_ht, handling_cost_ht, insurance_cost_ht, fees_vat_rate, sales_order_items(id, quantity, unit_price_ht, tax_rate, products(name))`
          )
          .eq('id', orderId)
          .single();

        if (error || !order) return null;

        let customerOrg: IOrderForDocument['organisations'] = null;
        let customerIndiv: {
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
        } | null = null;

        if (order.customer_type === 'organization' && order.customer_id) {
          const { data: org } = await supabase
            .from('organisations')
            .select(
              'legal_name, trade_name, email, address_line1, city, postal_code, country, billing_address_line1, billing_city, billing_postal_code, billing_country, shipping_address_line1, shipping_city, shipping_postal_code, shipping_country, has_different_shipping_address, siret, vat_number, enseigne_id'
            )
            .eq('id', order.customer_id)
            .single();
          if (org)
            customerOrg = {
              name: org.trade_name ?? org.legal_name,
              legal_name: org.legal_name,
              trade_name: org.trade_name,
              email: org.email,
              address_line1: org.address_line1,
              city: org.city,
              postal_code: org.postal_code,
              country: org.country,
              billing_address_line1: org.billing_address_line1,
              billing_city: org.billing_city,
              billing_postal_code: org.billing_postal_code,
              billing_country: org.billing_country,
              shipping_address_line1: org.shipping_address_line1,
              shipping_city: org.shipping_city,
              shipping_postal_code: org.shipping_postal_code,
              shipping_country: org.shipping_country,
              has_different_shipping_address:
                org.has_different_shipping_address,
              siret: org.siret,
              vat_number: org.vat_number,
            };
        } else if (order.customer_type === 'individual' && order.customer_id) {
          const { data: indiv } = await supabase
            .from('individual_customers')
            .select('first_name, last_name, email')
            .eq('id', order.customer_id)
            .single();
          if (indiv)
            customerIndiv = {
              first_name: indiv.first_name,
              last_name: indiv.last_name,
              email: indiv.email,
            };
        }

        return {
          id: order.id,
          order_number: order.order_number,
          total_ht: order.total_ht ?? 0,
          total_ttc: order.total_ttc ?? 0,
          tax_rate: order.tax_rate ?? 20,
          currency: order.currency ?? 'EUR',
          payment_terms: order.payment_terms ?? 'immediate',
          customer_id: order.customer_id,
          customer_type: order.customer_type,
          billing_address: order.billing_address as IDocumentAddress | null,
          shipping_address: order.shipping_address as IDocumentAddress | null,
          shipping_cost_ht: order.shipping_cost_ht ?? null,
          handling_cost_ht: order.handling_cost_ht ?? null,
          insurance_cost_ht: order.insurance_cost_ht ?? null,
          fees_vat_rate: order.fees_vat_rate ?? null,
          organisations: customerOrg,
          individual_customers: customerIndiv,
          sales_order_items: order.sales_order_items ?? [],
        };
      } catch (error) {
        console.error('[OrderSelect] Error:', error);
        return null;
      } finally {
        setLoadingOrder(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (open) {
      void loadOrders();
      setSelectedOrderId(null);
    }
  }, [open, loadOrders]);

  return {
    orders,
    loading,
    selectedOrderId,
    loadingOrder,
    fetchOrderDetails,
  };
}
