/**
 * Source unique des compteurs du menu de gauche.
 *
 * Un seul appel `get_sidebar_counts()` sert **tous** les compteurs : le menu
 * (`useSidebarCounts`) et chaque pastille / liste déroulante
 * (`useStockAlertsCount`, `useLinkmePendingCount`, …). TanStack Query
 * dédoublonne sur la clé `MENU_COUNT_QUERY_KEYS.sidebar` : les composants
 * montés en même temps partagent la même requête.
 *
 * Avant (jusqu'au 2026-09-15) chaque liste déroulante refaisait son propre
 * comptage : 9 requêtes de plus par page et 5 canaux temps réel en double. Le
 * comptage LinkMe (`linkme_orders_enriched`, 166 ms de préparation à vide) a
 * dépassé le délai de 8 s 164 fois pendant la mise en ligne du 15/09.
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { MENU_COUNT_QUERY_KEYS } from '@verone/utils/query';
import { createClient } from '@verone/utils/supabase/client';

/** Clé de cache partagée par le menu et tous les compteurs. */
export const SIDEBAR_COUNTS_QUERY_KEY = MENU_COUNT_QUERY_KEYS.sidebar;

export interface RawCounts {
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

export const ZERO_COUNTS: RawCounts = {
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
 * Récupère les 11 compteurs en UNE requête : fonction SQL `get_sidebar_counts()`
 * (mêmes filtres que les 11 comptages d'origine, vérifiés identiques le 2026-09-15).
 */
export async function fetchAllCounts(
  supabase: ReturnType<typeof createClient>
): Promise<RawCounts> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...ZERO_COUNTS };

  const { data, error } = await supabase.rpc('get_sidebar_counts');
  if (error) {
    console.error('[menuCounts] get_sidebar_counts:', error);
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

interface SidebarCountsQueryResult {
  counts: RawCounts;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

/**
 * Abonnement partagé à l'appel unique. Toute la mécanique de cache est ici :
 * les compteurs individuels n'émettent plus aucune requête.
 */
export function useSidebarCountsQuery(): SidebarCountsQueryResult {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  const { data, isPending, error, dataUpdatedAt } = useQuery({
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

  const refetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: SIDEBAR_COUNTS_QUERY_KEY });
  }, [queryClient]);

  return {
    counts: data ?? ZERO_COUNTS,
    loading: isPending,
    error: error ?? null,
    lastUpdated: dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null,
    refetch,
  };
}

/** Forme publique commune à tous les compteurs de pastille. */
export interface MenuCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Un compteur de pastille = une valeur de l'appel partagé.
 * `refetch` rafraîchit l'ensemble des compteurs (une seule requête).
 */
export function useMenuCount(field: keyof RawCounts): MenuCountHook {
  const { counts, loading, error, lastUpdated, refetch } =
    useSidebarCountsQuery();

  return {
    count: counts[field],
    loading,
    error,
    refetch,
    lastUpdated,
  };
}
