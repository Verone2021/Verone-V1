/**
 * Hook useSidebarCounts — les 11 compteurs du menu de gauche.
 *
 * Une seule requête (`get_sidebar_counts()`), partagée avec tous les compteurs
 * individuels via `useSidebarCountsQuery` (`use-menu-count.ts`).
 *   - Cache TanStack Query (staleTime 5 min, refetch au retour sur l'onglet)
 *   - Realtime uniquement sur les tables publiées : products + sales_orders
 *   - Pas de polling fallback — un canal en erreur → warn silencieux, c'est tout
 *
 * Note: useDatabaseNotifications reste séparé (logique lecture/suppression).
 */

'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { createClient } from '@verone/utils/supabase/client';

import { useDebouncedInvalidate } from './use-debounce-invalidate';
import {
  SIDEBAR_COUNTS_QUERY_KEY,
  useSidebarCountsQuery,
  ZERO_COUNTS,
} from './use-menu-count';

export { SIDEBAR_COUNTS_QUERY_KEY } from './use-menu-count';

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
  const supabase = useMemo(() => createClient(), []);
  const { counts, loading, refetch } = useSidebarCountsQuery();

  const channelSalesOrdersRef = useRef<RealtimeChannel | null>(null);
  const channelProductsRef = useRef<RealtimeChannel | null>(null);

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

  return {
    ...ZERO_COUNTS,
    ...counts,
    loading,
    refetch,
  };
}
