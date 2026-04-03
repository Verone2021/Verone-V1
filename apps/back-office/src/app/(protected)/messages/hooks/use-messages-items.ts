'use client';

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';
const MAX_ITEMS = 5;
const QUERY_TIMEOUT = 10000;

/** Wrap une promise avec un timeout pour eviter les blocages */
function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number = QUERY_TIMEOUT
): Promise<T | { data: null; error: { message: string }; count: null }> {
  return Promise.race([
    promise,
    new Promise<{ data: null; error: { message: string }; count: null }>(
      resolve =>
        setTimeout(
          () =>
            resolve({
              data: null,
              error: { message: 'Query timeout' },
              count: null,
            }),
          ms
        )
    ),
  ]);
}

/** Filtre paiements : N-1 minimum (ex: en 2026 → depuis 2025-01-01) */
function getPaymentMinDate(): string {
  const year = new Date().getFullYear();
  return `${year - 1}-01-01`;
}

// ─── Types par categorie ──────────────────────────────────────────────

export interface PaymentItem {
  id: string;
  label: string;
  amount: number;
  side: 'credit' | 'debit';
  counterparty_name: string | null;
  emitted_at: string;
}

export interface OrderItem {
  id: string;
  order_number: string;
  status: string;
  total_ttc: number;
  created_at: string;
  customer_name?: string;
}

export interface StockAlertItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  stock_real: number;
  alert_type: 'out_of_stock' | 'critical' | 'low';
  alert_color: string;
  alert_priority: number;
  shortage_quantity: number;
}

export interface SourcingItem {
  id: string;
  name: string;
  sku: string;
  product_status: string;
  requires_sample: boolean;
  supplier_id: string | null;
  created_at: string;
}

export interface ConsultationItem {
  id: string;
  client_email: string;
  descriptif: string;
  status: string;
  priority_level: number;
  created_at: string;
  organisation: { legal_name: string | null; trade_name: string | null } | null;
}

export interface FormItem {
  id: string;
  source_type: 'form' | 'info_request';
  name: string;
  email: string;
  subject: string;
  created_at: string;
}

export interface FinanceItem {
  id: string;
  document_number: string;
  document_type: string;
  status: string;
  total_ttc: number;
  document_date: string;
  due_date: string | null;
  partner_id: string | null;
  partner_name: string;
  is_overdue: boolean;
  days_overdue: number;
}

export interface OrganisationItem {
  id: string;
  legal_name: string;
  trade_name: string | null;
  type: string;
  approval_status: string;
  created_at: string;
}

export interface CategoryData<T> {
  items: T[];
  count: number;
  loading: boolean;
}

export interface MessagesItems {
  paiements: CategoryData<PaymentItem>;
  commandes: CategoryData<OrderItem>;
  expeditions: CategoryData<OrderItem>;
  stock: CategoryData<StockAlertItem>;
  approbations: CategoryData<OrderItem>;
  sourcing: CategoryData<SourcingItem>;
  consultations: CategoryData<ConsultationItem>;
  formulaires: CategoryData<FormItem>;
  finance: CategoryData<FinanceItem>;
  organisations: CategoryData<OrganisationItem>;
  loading: boolean;
  refetch: () => Promise<void>;
  ignoreTransaction: (id: string) => Promise<void>;
}

const emptyCategory = <T>(): CategoryData<T> => ({
  items: [],
  count: 0,
  loading: true,
});

export function useMessagesItems(): MessagesItems {
  const [data, setData] = useState<
    Omit<MessagesItems, 'loading' | 'refetch' | 'ignoreTransaction'>
  >({
    paiements: emptyCategory<PaymentItem>(),
    commandes: emptyCategory<OrderItem>(),
    expeditions: emptyCategory<OrderItem>(),
    stock: emptyCategory<StockAlertItem>(),
    approbations: emptyCategory<OrderItem>(),
    sourcing: emptyCategory<SourcingItem>(),
    consultations: emptyCategory<ConsultationItem>(),
    formulaires: emptyCategory<FormItem>(),
    finance: emptyCategory<FinanceItem>(),
    organisations: emptyCategory<OrganisationItem>(),
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [
        paiementsRes,
        commandesRes,
        expeditionsRes,
        stockRes,
        approbationsRes,
        sourcingRes,
        consultationsRes,
        formSubRes,
        infoReqRes,
        financeRes,
        organisationsRes,
        stockCountRes,
        financeCountRes,
      ] = await Promise.all([
        withTimeout(
          supabase
            .from('bank_transactions')
            .select('id, label, amount, side, counterparty_name, emitted_at', {
              count: 'exact',
            })
            .eq('matching_status', 'unmatched')
            .is('ignored_at', null)
            .gte('emitted_at', getPaymentMinDate())
            .order('emitted_at', { ascending: true })
            .limit(MAX_ITEMS)
        ),

        withTimeout(
          supabase
            .from('sales_orders')
            .select(
              'id, order_number, status, total_ttc, created_at, customer_id, customer_type',
              { count: 'exact' }
            )
            .eq('status', 'draft')
            .order('created_at', { ascending: true })
            .limit(MAX_ITEMS)
        ),

        withTimeout(
          supabase
            .from('sales_orders')
            .select(
              'id, order_number, status, total_ttc, created_at, customer_id, customer_type',
              { count: 'exact' }
            )
            .in('status', ['validated', 'partially_shipped'])
            .order('created_at', { ascending: true })
            .limit(MAX_ITEMS)
        ),

        withTimeout(
          supabase
            .from('stock_alerts_unified_view' as 'stock_alert_tracking')
            .select(
              'id, product_id, product_name, sku, stock_real, alert_type, alert_color, alert_priority, shortage_quantity'
            )
            .neq('alert_type', 'none')
            .order('alert_priority', { ascending: true })
            .limit(MAX_ITEMS)
        ),

        withTimeout(
          supabase
            .from('sales_orders')
            .select(
              'id, order_number, status, total_ttc, created_at, customer_id, customer_type',
              { count: 'exact' }
            )
            .eq('channel_id', LINKME_CHANNEL_ID)
            .eq('status', 'draft')
            .order('created_at', { ascending: true })
            .limit(MAX_ITEMS)
        ),

        withTimeout(
          supabase
            .from('products')
            .select(
              'id, name, sku, product_status, requires_sample, supplier_id, created_at',
              { count: 'exact' }
            )
            .eq('creation_mode', 'sourcing')
            .in('product_status', ['draft', 'preorder'])
            .is('archived_at', null)
            .order('created_at', { ascending: true })
            .limit(MAX_ITEMS)
        ),

        withTimeout(
          supabase
            .from('client_consultations')
            .select(
              'id, client_email, descriptif, status, priority_level, created_at, organisation:organisations(legal_name, trade_name)',
              { count: 'exact' }
            )
            .in('status', ['en_attente', 'en_cours'])
            .is('archived_at', null)
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
            .limit(MAX_ITEMS)
        ),

        withTimeout(
          supabase
            .from('form_submissions')
            .select(
              'id, first_name, last_name, email, subject, message, created_at',
              { count: 'exact' }
            )
            .eq('status', 'new')
            .order('created_at', { ascending: true })
            .limit(MAX_ITEMS)
        ),

        withTimeout(
          supabase
            .from('linkme_info_requests')
            .select('id, recipient_name, recipient_email, created_at', {
              count: 'exact',
            })
            .not('sent_at', 'is', null)
            .is('completed_at', null)
            .is('cancelled_at', null)
            .gt('token_expires_at', new Date().toISOString())
            .order('created_at', { ascending: true })
            .limit(MAX_ITEMS)
        ),

        withTimeout(
          (
            supabase.rpc as (
              ...args: unknown[]
            ) => PromiseLike<{ data: unknown; error: unknown }>
          )('get_unpaid_invoices', { max_items: MAX_ITEMS })
        ),

        withTimeout(
          supabase
            .from('organisations')
            .select(
              'id, legal_name, trade_name, type, approval_status, created_at',
              { count: 'exact' }
            )
            .eq('approval_status', 'pending')
            .order('created_at', { ascending: true })
            .limit(MAX_ITEMS)
        ),

        withTimeout(supabase.rpc('get_stock_alerts_count')),
        withTimeout(
          (
            supabase.rpc as (
              ...args: unknown[]
            ) => PromiseLike<{ data: unknown; error: unknown }>
          )('get_unpaid_invoices_count')
        ),
      ]);

      // Merge formulaires (2 sources)
      const formItems: FormItem[] = [];
      for (const row of (formSubRes.data ?? []) as Array<
        Record<string, unknown>
      >) {
        const fullName = [row.first_name, row.last_name]
          .filter(Boolean)
          .join(' ');
        formItems.push({
          id: row.id as string,
          source_type: 'form',
          name: fullName || (row.email as string),
          email: row.email as string,
          subject: (
            (row.subject as string) ||
            (row.message as string) ||
            ''
          ).slice(0, 80),
          created_at: row.created_at as string,
        });
      }
      for (const row of (infoReqRes.data ?? []) as Array<
        Record<string, unknown>
      >) {
        formItems.push({
          id: row.id as string,
          source_type: 'info_request',
          name: (row.recipient_name as string) || '',
          email: (row.recipient_email as string) || '',
          subject: "Demande d'infos en attente",
          created_at: row.created_at as string,
        });
      }
      formItems.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Enrichir les commandes/expeditions avec le nom client
      const allOrders = [
        ...((commandesRes.data ?? []) as Array<Record<string, unknown>>),
        ...((expeditionsRes.data ?? []) as Array<Record<string, unknown>>),
        ...((approbationsRes.data ?? []) as Array<Record<string, unknown>>),
      ];
      const orgIds = [
        ...new Set(
          allOrders.filter(o => o.customer_id).map(o => o.customer_id as string)
        ),
      ];
      const orgMap = new Map<string, string>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organisations')
          .select('id, legal_name, trade_name')
          .in('id', orgIds);
        for (const org of (orgs ?? []) as Array<Record<string, unknown>>) {
          orgMap.set(
            org.id as string,
            (org.trade_name as string) ?? (org.legal_name as string) ?? 'Client'
          );
        }
      }

      const enrichOrders = (raw: unknown[]): OrderItem[] =>
        (raw as Array<Record<string, unknown>>).map(o => ({
          id: o.id as string,
          order_number: o.order_number as string,
          status: o.status as string,
          total_ttc: o.total_ttc as number,
          created_at: o.created_at as string,
          customer_name: orgMap.get(o.customer_id as string) ?? 'Client',
        }));

      setData({
        paiements: {
          items: (paiementsRes.data as PaymentItem[] | null) ?? [],
          count: paiementsRes.count ?? 0,
          loading: false,
        },
        commandes: {
          items: enrichOrders(commandesRes.data ?? []),
          count: commandesRes.count ?? 0,
          loading: false,
        },
        expeditions: {
          items: enrichOrders(expeditionsRes.data ?? []),
          count: expeditionsRes.count ?? 0,
          loading: false,
        },
        stock: {
          items: (stockRes.data as unknown as StockAlertItem[]) ?? [],
          count: stockCountRes.error
            ? 0
            : ((stockCountRes.data as number | null) ?? 0),
          loading: false,
        },
        approbations: {
          items: enrichOrders(approbationsRes.data ?? []),
          count: approbationsRes.count ?? 0,
          loading: false,
        },
        sourcing: {
          items: (sourcingRes.data as unknown as SourcingItem[]) ?? [],
          count: sourcingRes.count ?? 0,
          loading: false,
        },
        consultations: {
          items: (consultationsRes.data as unknown as ConsultationItem[]) ?? [],
          count: consultationsRes.count ?? 0,
          loading: false,
        },
        formulaires: {
          items: formItems.slice(0, MAX_ITEMS),
          count: (formSubRes.count ?? 0) + (infoReqRes.count ?? 0),
          loading: false,
        },
        finance: {
          items: (financeRes.data as FinanceItem[] | null) ?? [],
          count: financeCountRes.error
            ? 0
            : ((financeCountRes.data as number | null) ?? 0),
          loading: false,
        },
        organisations: {
          items: (organisationsRes.data as unknown as OrganisationItem[]) ?? [],
          count: organisationsRes.count ?? 0,
          loading: false,
        },
      });
    } catch (err) {
      console.error('[useMessagesItems] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Delai pour laisser la sidebar charger d'abord (evite surcharge PostgREST)
    const timer = setTimeout(() => {
      void fetchAll().catch((err: unknown) => {
        console.error('[useMessagesItems] Initial fetch error:', err);
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [fetchAll]);

  const ignoreTransaction = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('bank_transactions')
        .update({ ignored_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('[useMessagesItems] ignoreTransaction error:', error);
        return;
      }

      // Refetch pour mettre a jour la liste
      await fetchAll();
    },
    [supabase, fetchAll]
  );

  return { ...data, loading, refetch: fetchAll, ignoreTransaction };
}
