/**
 * Hook Products Incomplete Count - Vérone Back Office
 * Compte les produits catalogue avec fiches incomplètes
 *
 * Critères d'incomplétude:
 * - description IS NULL ou vide
 * - Aucune image associée
 * - Pas de prix public
 *
 * @author Romeo Dos Santos
 * @date 2026-01-23
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ProductsIncompleteCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Hook pour compter les produits catalogue incomplets
 *
 * Un produit est considéré incomplet si:
 * - description est NULL ou vide
 * - Aucune image associée (product_images)
 * - Pas de prix public (public_price IS NULL)
 *
 * @param options.enableRealtime - Activer Supabase Realtime (default: true)
 * @param options.refetchInterval - Intervalle de polling fallback en ms (default: 60000 = 1min)
 * @returns {ProductsIncompleteCountHook} État du hook avec count, loading, error
 *
 * @example
 * ```tsx
 * function ProductsBadge() {
 *   const { count, loading } = useProductsIncompleteCount();
 *   return count > 0 ? <Badge variant="warning">{count}</Badge> : null;
 * }
 * ```
 */
export function useProductsIncompleteCount(options?: {
  enableRealtime?: boolean;
  refetchInterval?: number;
}): ProductsIncompleteCountHook {
  const { enableRealtime = true, refetchInterval = 60000 } = options || {};

  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch count des produits incomplets
   * Utilise une query count avec filtres OR
   */
  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Query produits catalogue avec fiches incomplètes
      // Incomplet = description vide
      const { count: totalCount, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('product_status', 'active')
        .or('description.is.null,description.eq.');

      if (countError) {
        console.error('[useProductsIncompleteCount] Count error:', countError);
        setError(new Error(`Count error: ${countError.message}`));
        setCount(0); // Valeur par défaut gracieuse
        return; // Sortie anticipée sans exception
      }

      setCount(totalCount || 0);
      setLastUpdated(new Date());
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error('Unknown error fetching count');
      setError(errorObj);
      console.error('[useProductsIncompleteCount] Error:', errorObj);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /**
   * Setup Supabase Realtime subscription
   */
  useEffect(() => {
    // Initial fetch
    fetchCount();

    // Setup Realtime si activé
    if (enableRealtime) {
      channelRef.current = supabase
        .channel('products-incomplete-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products',
            filter: 'product_status=eq.active',
          },
          payload => {
            console.log(
              '[useProductsIncompleteCount] Realtime change detected:',
              payload
            );
            fetchCount();
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            console.log('[useProductsIncompleteCount] Realtime subscribed');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[useProductsIncompleteCount] Realtime error');
            setError(new Error('Realtime subscription failed'));
          }
        });
    }

    // Polling fallback
    if (!enableRealtime || refetchInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchCount();
      }, refetchInterval);
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [supabase, enableRealtime, refetchInterval, fetchCount]);

  return {
    count,
    loading,
    error,
    refetch: fetchCount,
    lastUpdated,
  };
}
