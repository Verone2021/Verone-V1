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

import { MENU_COUNT_QUERY_KEYS } from '@verone/utils/query';
import { createClient } from '@verone/utils/supabase/client';

import { useDebouncedInvalidate } from './use-debounce-invalidate';

/**
 * Clé de cache TanStack Query pour les compteurs sidebar.
 * Alias de `MENU_COUNT_QUERY_KEYS.sidebar` : les mutations métier passent par
 * `invalidateMenuCounts` (`@verone/utils/query`).
 */
export const SIDEBAR_COUNTS_QUERY_KEY = MENU_COUNT_QUERY_KEYS.sidebar;

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

const COUNT_KEYS = Object.keys(ZERO_COUNTS) as Array<keyof RawCounts>;

/** Lit un compteur du JSON renvoyé par la base (nombre ou chaîne numérique). */
function readCount(source: Record<string, unknown>, key: string): number {
  const value = source[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Récupère les 11 compteurs sidebar en UNE requête : fonction SQL
 * `get_sidebar_counts()` (mêmes filtres que les 11 comptages d'origine,
 * vérifiés identiques le 2026-09-15). Avant : 11 requêtes HTTP par rafraîchissement.
 */
async function fetchAllCounts(
  supabase: ReturnType<typeof createClient>
): Promise<RawCounts> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...ZERO_COUNTS };

  const { data, error } = await supabase.rpc('get_sidebar_counts');
  if (error) {
    console.error('[useSidebarCounts] get_sidebar_counts:', error);
    throw error;
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ...ZERO_COUNTS };
  }

  const source = data as Record<string, unknown>;
  const counts = { ...ZERO_COUNTS };
  for (const key of COUNT_KEYS) {
    counts[key] = readCount(source, key);
  }
  return counts;
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
    // Une seule relance espacée : quand la base est lente, les relances en rafale
    // aggravent la charge (épisode du 15/09 12:50 → 13:10 UTC).
    retry: 1,
    retryDelay: attempt => Math.min(30_000, 5_000 * 2 ** attempt),
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
