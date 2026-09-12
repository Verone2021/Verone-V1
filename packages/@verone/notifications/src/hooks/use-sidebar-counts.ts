/**
 * Hook useSidebarCounts — Agrégateur optimisé pour la sidebar
 *
 * Remplace 10 hooks individuels par un seul qui :
 *   - Fait 1 seul auth.getUser() au lieu de 10
 *   - Lance toutes les requêtes en Promise.all()
 *   - Cache via TanStack Query (staleTime 5 min, refetch au retour sur l'onglet)
 *   - Realtime uniquement sur les tables publiées : products + sales_orders
 *   - Pas de polling fallback — un canal en erreur → warn silencieux, c'est tout
 *
 * Note: useDatabaseNotifications reste séparé (logique lecture/suppression).
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { createClient } from '@verone/utils/supabase/client';

import { useDebouncedInvalidate } from './use-debounce-invalidate';

const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

/**
 * Clé de cache TanStack Query pour les compteurs sidebar.
 * Exportée pour permettre l'invalidation depuis les mutations métier.
 */
export const SIDEBAR_COUNTS_QUERY_KEY = [
  'notifications',
  'sidebar_counts',
] as const;

export interface SidebarCounts {
  stockAlerts: number;
  consultations: number;
  linkmePending: number;
  productsIncomplete: number;
  sourcingProducts: number;
  ordersPending: number;
  expeditionsPending: number;
  transactionsUnreconciled: number;
  linkmeApprovals: number;
  formSubmissions: number;
  linkmeMissingInfo: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

interface RawCounts {
  stockAlerts: number;
  consultations: number;
  linkmePending: number;
  productsIncomplete: number;
  sourcingProducts: number;
  ordersPending: number;
  expeditionsPending: number;
  transactionsUnreconciled: number;
  linkmeApprovals: number;
  formSubmissions: number;
  linkmeMissingInfo: number;
}

const ZERO_COUNTS: RawCounts = {
  stockAlerts: 0,
  consultations: 0,
  linkmePending: 0,
  productsIncomplete: 0,
  sourcingProducts: 0,
  ordersPending: 0,
  expeditionsPending: 0,
  transactionsUnreconciled: 0,
  linkmeApprovals: 0,
  formSubmissions: 0,
  linkmeMissingInfo: 0,
};

const getCount = (
  result:
    | { count: number | null; error: unknown }
    | { data: unknown; error: unknown }
): number => {
  if (result.error) return 0;
  if ('count' in result) return result.count ?? 0;
  if ('data' in result && typeof result.data === 'number') return result.data;
  return 0;
};

/**
 * Récupère les 11 compteurs sidebar en un seul batch parallèle.
 * Séparé pour pouvoir être appelé dans queryFn sans dépendance de hook.
 */
async function fetchAllCounts(
  supabase: ReturnType<typeof createClient>
): Promise<RawCounts> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...ZERO_COUNTS };

  const [
    stockAlertsResult,
    consultationsResult,
    linkmeP,
    productsResult,
    sourcingResult,
    ordersResult,
    expeditionsResult,
    transactionsResult,
    linkmeApprovalsResult,
    formSubmissionsResult,
    linkmeMissingInfoResult,
  ] = await Promise.all([
    // 1. Stock alerts via RPC
    supabase.rpc('get_stock_alerts_count'),
    // 2. Consultations actives
    supabase
      .from('client_consultations')
      .select('id', { count: 'exact', head: true })
      .in('status', ['en_attente', 'en_cours'])
      .is('archived_at', null)
      .is('deleted_at', null),
    // 3. Commandes LinkMe actionnables
    supabase
      .from('linkme_orders_enriched' as 'sales_orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'validated']),
    // 4. Produits incomplets
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('product_status', 'active')
      .or('description.is.null,description.eq.'),
    // 5. Produits en sourcing
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('creation_mode', 'sourcing')
      .in('product_status', ['draft', 'preorder'])
      .is('archived_at', null),
    // 6. Commandes en attente (draft)
    supabase
      .from('sales_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft'),
    // 7. Expéditions en attente
    supabase
      .from('sales_orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['validated', 'partially_shipped']),
    // 8. Transactions non rapprochées
    supabase
      .from('bank_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('matching_status', 'unmatched'),
    // 9. Approbations LinkMe
    supabase
      .from('sales_orders')
      .select('id', { count: 'exact', head: true })
      .eq('channel_id', LINKME_CHANNEL_ID)
      .eq('status', 'draft'),
    // 10. Formulaires non traités
    supabase
      .from('form_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
    // 11. Demandes info LinkMe en attente
    supabase
      .from('linkme_info_requests')
      .select('id', { count: 'exact', head: true })
      .not('sent_at', 'is', null)
      .is('completed_at', null)
      .is('cancelled_at', null)
      .gt('token_expires_at', new Date().toISOString()),
  ]);

  if (stockAlertsResult.error)
    console.error('[useSidebarCounts] stockAlerts:', stockAlertsResult.error);
  if (consultationsResult.error)
    console.error(
      '[useSidebarCounts] consultations:',
      consultationsResult.error
    );
  if (linkmeP.error)
    console.error('[useSidebarCounts] linkmePending:', linkmeP.error);
  if (productsResult.error)
    console.error(
      '[useSidebarCounts] productsIncomplete:',
      productsResult.error
    );
  if (sourcingResult.error)
    console.error('[useSidebarCounts] sourcingProducts:', sourcingResult.error);
  if (ordersResult.error)
    console.error('[useSidebarCounts] ordersPending:', ordersResult.error);
  if (expeditionsResult.error)
    console.error(
      '[useSidebarCounts] expeditionsPending:',
      expeditionsResult.error
    );
  if (transactionsResult.error)
    console.error('[useSidebarCounts] transactions:', transactionsResult.error);
  if (linkmeApprovalsResult.error)
    console.error(
      '[useSidebarCounts] linkmeApprovals:',
      linkmeApprovalsResult.error
    );
  if (formSubmissionsResult.error)
    console.error(
      '[useSidebarCounts] formSubmissions:',
      formSubmissionsResult.error
    );
  if (linkmeMissingInfoResult.error)
    console.error(
      '[useSidebarCounts] linkmeMissingInfo:',
      linkmeMissingInfoResult.error
    );

  return {
    stockAlerts: stockAlertsResult.error
      ? 0
      : ((stockAlertsResult.data as number | null) ?? 0),
    consultations: getCount(consultationsResult),
    linkmePending: getCount(linkmeP),
    productsIncomplete: getCount(productsResult),
    sourcingProducts: getCount(sourcingResult),
    ordersPending: getCount(ordersResult),
    expeditionsPending: getCount(expeditionsResult),
    transactionsUnreconciled: getCount(transactionsResult),
    linkmeApprovals: getCount(linkmeApprovalsResult),
    formSubmissions: getCount(formSubmissionsResult),
    linkmeMissingInfo: getCount(linkmeMissingInfoResult),
  };
}

/**
 * Hook agrégateur des compteurs de la sidebar.
 *
 * @param _options conservé pour compatibilité API — paramètres ignorés.
 *   `enableRealtime` et `pollingInterval` sont @deprecated.
 *   TanStack Query gère le cache et le rafraîchissement.
 */
export function useSidebarCounts(_options?: {
  /** @deprecated ignoré — plus de polling fallback */
  enableRealtime?: boolean;
  /** @deprecated ignoré — TanStack Query gère le cache */
  pollingInterval?: number;
}): SidebarCounts {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  const channelSalesOrdersRef = useRef<RealtimeChannel | null>(null);
  const channelProductsRef = useRef<RealtimeChannel | null>(null);

  const { data, isPending } = useQuery({
    queryKey: SIDEBAR_COUNTS_QUERY_KEY,
    queryFn: () => fetchAllCounts(supabase),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  const triggerInvalidate = useDebouncedInvalidate(SIDEBAR_COUNTS_QUERY_KEY);

  // Realtime uniquement sur les tables publiées (products + sales_orders).
  // Les 5 autres canaux (client_consultations, bank_transactions,
  // form_submissions, linkme_info_requests, stock_alerts_unified_view)
  // n'étaient pas publiés et causaient des CHANNEL_ERROR → polling.
  // Désormais : TanStack Query + refetch au retour sur l'onglet suffisent.
  useEffect(() => {
    channelSalesOrdersRef.current = supabase
      .channel('sidebar-sales-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales_orders' },
        triggerInvalidate
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useSidebarCounts] sales_orders Realtime unavailable');
        }
      });

    channelProductsRef.current = supabase
      .channel('sidebar-products')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: 'product_status=eq.active',
        },
        triggerInvalidate
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useSidebarCounts] products Realtime unavailable');
        }
      });

    return () => {
      for (const ref of [channelSalesOrdersRef, channelProductsRef]) {
        if (ref.current) {
          void supabase.removeChannel(ref.current).catch(() => {});
          ref.current = null;
        }
      }
    };
  }, [supabase, triggerInvalidate]);

  const refetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: SIDEBAR_COUNTS_QUERY_KEY });
  }, [queryClient]);

  return {
    ...(data ?? ZERO_COUNTS),
    loading: isPending,
    refetch,
  };
}
