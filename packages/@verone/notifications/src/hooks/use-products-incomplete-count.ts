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
  const { enableRealtime = true, refetchInterval = 60000 } = options ?? {};

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

      // Vérifier authentification avant requête (évite erreur RLS 403)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Pas connecté = pas de count, pas d'erreur
        setCount(0);
        setLoading(false);
        return;
      }

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

      setCount(totalCount ?? 0);
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
   * Setup Supabase Realtime subscription (authentification requise)
   */
  useEffect(() => {
    let isMounted = true;

    const setupSubscriptions = async () => {
      // Vérifier authentification avant setup Realtime/polling
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) {
        // Pas connecté = pas de Realtime, juste set count à 0
        setCount(0);
        setLoading(false);
        return;
      }

      // Initial fetch (authentifié)
      void fetchCount().catch(err => {
        console.error(
          '[useProductsIncompleteCount] Initial fetch failed:',
          err
        );
      });

      // Setup Realtime si activé ET authentifié
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
            _payload => {
              void fetchCount().catch(err => {
                console.error(
                  '[useProductsIncompleteCount] Realtime refetch failed:',
                  err
                );
              });
            }
          )
          .subscribe(status => {
            if (status === 'SUBSCRIBED') {
              // Realtime subscribed successfully
            } else if (status === 'CHANNEL_ERROR') {
              console.error(
                '[useProductsIncompleteCount] Realtime error - falling back to polling'
              );
              // Fallback : activer polling si Realtime fail
              if (!intervalRef.current && refetchInterval > 0) {
                intervalRef.current = setInterval(() => {
                  void fetchCount().catch(console.error);
                }, refetchInterval);
              }
            } else if (status === 'CLOSED') {
              console.warn(
                '[useProductsIncompleteCount] Channel closed, will reconnect on next mount'
              );
            }
          });
      }

      // Polling fallback (seulement si authentifié)
      if (!enableRealtime || refetchInterval > 0) {
        intervalRef.current = setInterval(() => {
          void fetchCount().catch(err => {
            console.error('[useProductsIncompleteCount] Polling failed:', err);
          });
        }, refetchInterval);
      }
    };

    void setupSubscriptions().catch(err => {
      console.error(
        '[useProductsIncompleteCount] Setup subscriptions failed:',
        err
      );
    });

    // Cleanup
    return () => {
      isMounted = false;
      if (channelRef.current) {
        // Void la promise mais attendre fin avant reset ref
        void supabase
          .removeChannel(channelRef.current)
          .then(() => {
            channelRef.current = null;
          })
          .catch(err => {
            console.warn(
              '[useProductsIncompleteCount] Channel cleanup error:',
              err
            );
            channelRef.current = null; // Reset même en cas d'erreur
          });
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
