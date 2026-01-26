/**
 * Hook LinkMe Pending Count - Vérone Back Office
 * Compte les commandes LinkMe nécessitant une action
 *
 * Utilise:
 * - Vue: linkme_orders_enriched (basée sur sales_orders)
 * - Channel ID: 93c68db1-5a30-4168-89ec-6383152be405 (LinkMe)
 * - Statuts comptés: 'draft', 'validated' (commandes nécessitant action)
 * - Exclut: partially_shipped, shipped (en cours de traitement logistique)
 * - Realtime: Supabase subscriptions sur sales_orders
 *
 * @author Romeo Dos Santos
 * @date 2026-01-26 (v2: statuts ajustés)
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface LinkmePendingCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Hook pour compter les commandes LinkMe nécessitant une action
 *
 * Compte les commandes LinkMe avec status :
 * - draft : brouillons à valider
 * - validated : validées, en attente préparation
 *
 * Exclut :
 * - partially_shipped, shipped : déjà en cours de traitement logistique
 * - delivered, cancelled : terminées
 *
 * Utilise la vue linkme_orders_enriched pour performance optimale
 *
 * @param options.enableRealtime - Activer Supabase Realtime (default: true)
 * @param options.refetchInterval - Intervalle de polling fallback en ms (default: 30000 = 30s)
 * @returns {LinkmePendingCountHook} État du hook avec count, loading, error
 *
 * @example
 * ```tsx
 * function LinkmeBadge() {
 *   const { count, loading } = useLinkmePendingCount();
 *   return (
 *     <Badge variant={count > 0 ? 'urgent' : 'default'}>
 *       {count}
 *     </Badge>
 *   );
 * }
 * ```
 */
export function useLinkmePendingCount(options?: {
  enableRealtime?: boolean;
  refetchInterval?: number;
}): LinkmePendingCountHook {
  const { enableRealtime = true, refetchInterval = 30000 } = options || {};

  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch count via Supabase query
   * Utilise vue linkme_orders_enriched (performance optimisée)
   * Compte les commandes LinkMe ACTIVES (ni livrées ni annulées)
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

      // Query commandes LinkMe nécessitant action
      // Actionnables = draft (à valider), validated (à préparer)
      // Exclut partially_shipped/shipped (en cours logistique)
      const { count: totalCount, error: countError } = await supabase
        .from('linkme_orders_enriched' as any)
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'validated']);

      if (countError) {
        console.error('[useLinkmePendingCount] Count error:', {
          message: countError.message,
          code: countError.code,
          details: countError.details,
          hint: countError.hint,
        });
        setError(new Error(`Count error: ${countError.message || 'Unknown'}`));
        setCount(0); // Valeur par défaut gracieuse
        return; // Sortie anticipée sans exception
      }

      setCount(totalCount || 0);
      setLastUpdated(new Date());
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error('Unknown error fetching count');
      setError(errorObj);
      console.error('[useLinkmePendingCount] Error:', errorObj);
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
      fetchCount();

      // Setup Realtime si activé ET authentifié
      // NOTE: Realtime sur sales_orders (table source, pas la vue)
      if (enableRealtime) {
        const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

        channelRef.current = supabase
          .channel('linkme-orders-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'sales_orders',
              filter: `channel_id=eq.${LINKME_CHANNEL_ID}`,
            },
            payload => {
              console.log(
                '[useLinkmePendingCount] Realtime change detected:',
                payload
              );
              // Refetch seulement si changement impact statuts actionnables
              const eventType = payload.eventType;
              const newRow = payload.new as any;
              const oldRow = payload.old as any;

              // Statuts actionnables (nécessitant action)
              const actionableStatuses = ['draft', 'validated'];

              // Refetch si:
              // - INSERT avec status actionnable
              // - UPDATE changement status (vers/depuis actionnable)
              // - DELETE d'une commande actionnable
              const shouldRefetch =
                (eventType === 'INSERT' &&
                  actionableStatuses.includes(newRow?.status)) ||
                (eventType === 'UPDATE' &&
                  (actionableStatuses.includes(newRow?.status) ||
                    actionableStatuses.includes(oldRow?.status))) ||
                (eventType === 'DELETE' &&
                  actionableStatuses.includes(oldRow?.status));

              if (shouldRefetch) {
                fetchCount();
              }
            }
          )
          .subscribe(status => {
            if (status === 'SUBSCRIBED') {
              console.log('[useLinkmePendingCount] Realtime subscribed ✓');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[useLinkmePendingCount] Realtime error');
              // Ne pas setError pour éviter bruit sur page login
            }
          });
      }

      // Polling fallback (seulement si authentifié)
      if (!enableRealtime || refetchInterval > 0) {
        intervalRef.current = setInterval(() => {
          fetchCount();
        }, refetchInterval);
      }
    };

    setupSubscriptions();

    // Cleanup
    return () => {
      isMounted = false;
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
