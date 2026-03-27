/**
 * Hook useSidebarCounts — Agrégateur optimisé pour la sidebar
 *
 * Remplace 10 hooks individuels (useStockAlertsCount, useConsultationsCount,
 * useLinkmePendingCount, useProductsIncompleteCount, useOrdersPendingCount,
 * useExpeditionsPendingCount, useTransactionsUnreconciledCount,
 * useLinkmeApprovalsCount, useFormSubmissionsCount, useLinkmeMissingInfoCount)
 * par un seul hook qui :
 *   - Fait 1 seul auth.getUser() au lieu de 10
 *   - Lance toutes les requêtes en Promise.all() au lieu de séquentiellement
 *   - Ouvre 7 canaux Realtime au lieu de 10 (regroupement par table source)
 *
 * Tables Realtime surveillées :
 *   - sales_orders         → ordersP, expeditionsP, linkmeP, linkmeApprovals
 *   - client_consultations → consultations
 *   - bank_transactions    → transactionsUnreconciled
 *   - products             → productsIncomplete
 *   - form_submissions     → formSubmissions
 *   - linkme_info_requests → linkmeMissingInfo
 *   - RPC stock_alerts     → stockAlerts (Realtime sur stock_alerts_unified_view)
 *
 * Note: useDatabaseNotifications reste séparé (logique lecture/suppression).
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import type { RealtimeChannel } from '@supabase/supabase-js';

import { createClient } from '@verone/utils/supabase/client';

// Channel ID LinkMe constant (même valeur que les hooks individuels)
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

export interface SidebarCounts {
  stockAlerts: number;
  consultations: number;
  linkmePending: number;
  productsIncomplete: number;
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
  ordersPending: 0,
  expeditionsPending: 0,
  transactionsUnreconciled: 0,
  linkmeApprovals: 0,
  formSubmissions: 0,
  linkmeMissingInfo: 0,
};

/**
 * Hook agrégateur des compteurs de la sidebar.
 *
 * Optimisé pour minimiser les connexions Supabase :
 * - 1 auth.getUser() partagé
 * - 10 requêtes lancées en parallèle (Promise.all)
 * - 7 canaux Realtime au lieu de 10 (regroupement par table)
 *
 * @param options.enableRealtime - Activer Supabase Realtime (default: true)
 * @param options.pollingInterval - Intervalle polling fallback en ms (default: 30000)
 */
export function useSidebarCounts(options?: {
  enableRealtime?: boolean;
  pollingInterval?: number;
}): SidebarCounts {
  const { enableRealtime = true, pollingInterval = 30000 } = options ?? {};

  const [counts, setCounts] = useState<RawCounts>(ZERO_COUNTS);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();

  // Refs pour cleanup des canaux Realtime
  const channelSalesOrdersRef = useRef<RealtimeChannel | null>(null);
  const channelConsultationsRef = useRef<RealtimeChannel | null>(null);
  const channelTransactionsRef = useRef<RealtimeChannel | null>(null);
  const channelProductsRef = useRef<RealtimeChannel | null>(null);
  const channelFormSubmissionsRef = useRef<RealtimeChannel | null>(null);
  const channelLinkmeInfoRef = useRef<RealtimeChannel | null>(null);
  const channelStockAlertsRef = useRef<RealtimeChannel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Récupère tous les compteurs en parallèle.
   * 1 seul auth.getUser() + 10 requêtes Promise.all().
   */
  const fetchAllCounts = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      // Un seul appel auth partagé pour tous les counts
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCounts(ZERO_COUNTS);
        setLoading(false);
        return;
      }

      // Toutes les requêtes en parallèle
      const [
        stockAlertsResult,
        consultationsResult,
        linkmeP,
        productsResult,
        ordersResult,
        expeditionsResult,
        transactionsResult,
        linkmeApprovalsResult,
        formSubmissionsResult,
        linkmeMissingInfoResult,
      ] = await Promise.all([
        // 1. Stock alerts via RPC
        supabase.rpc('get_stock_alerts_count'),

        // 2. Consultations actives (en_attente + en_cours)
        supabase
          .from('client_consultations')
          .select('id', { count: 'exact', head: true })
          .in('status', ['en_attente', 'en_cours'])
          .is('archived_at', null)
          .is('deleted_at', null),

        // 3. Commandes LinkMe actionnables (draft + validated)
        supabase
          .from('linkme_orders_enriched' as 'sales_orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['draft', 'validated']),

        // 4. Produits incomplets (actifs sans description)
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('product_status', 'active')
          .or('description.is.null,description.eq.'),

        // 5. Commandes en attente (draft)
        supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'draft'),

        // 6. Expéditions en attente (validated + partially_shipped)
        supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['validated', 'partially_shipped']),

        // 7. Transactions non rapprochées
        supabase
          .from('bank_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('matching_status', 'unmatched'),

        // 8. Approbations LinkMe (drafts sur canal LinkMe)
        supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })
          .eq('channel_id', LINKME_CHANNEL_ID)
          .eq('status', 'draft'),

        // 9. Soumissions de formulaire non traitées
        supabase
          .from('form_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'new'),

        // 10. Demandes info LinkMe en attente
        supabase
          .from('linkme_info_requests')
          .select('id', { count: 'exact', head: true })
          .not('sent_at', 'is', null)
          .is('completed_at', null)
          .is('cancelled_at', null)
          .gt('token_expires_at', new Date().toISOString()),
      ]);

      // Extraction silencieuse : erreur individuelle = 0 (pas de plantage global)
      const getCount = (
        result:
          | { count: number | null; error: unknown }
          | { data: unknown; error: unknown }
      ): number => {
        if (result.error) return 0;
        if ('count' in result) return result.count ?? 0;
        if ('data' in result && typeof result.data === 'number')
          return result.data;
        return 0;
      };

      // Log des erreurs individuelles sans interrompre
      if (stockAlertsResult.error) {
        console.error(
          '[useSidebarCounts] stockAlerts error:',
          stockAlertsResult.error
        );
      }
      if (consultationsResult.error) {
        console.error(
          '[useSidebarCounts] consultations error:',
          consultationsResult.error
        );
      }
      if (linkmeP.error) {
        console.error('[useSidebarCounts] linkmePending error:', linkmeP.error);
      }
      if (productsResult.error) {
        console.error(
          '[useSidebarCounts] productsIncomplete error:',
          productsResult.error
        );
      }
      if (ordersResult.error) {
        console.error(
          '[useSidebarCounts] ordersPending error:',
          ordersResult.error
        );
      }
      if (expeditionsResult.error) {
        console.error(
          '[useSidebarCounts] expeditionsPending error:',
          expeditionsResult.error
        );
      }
      if (transactionsResult.error) {
        console.error(
          '[useSidebarCounts] transactionsUnreconciled error:',
          transactionsResult.error
        );
      }
      if (linkmeApprovalsResult.error) {
        console.error(
          '[useSidebarCounts] linkmeApprovals error:',
          linkmeApprovalsResult.error
        );
      }
      if (formSubmissionsResult.error) {
        console.error(
          '[useSidebarCounts] formSubmissions error:',
          formSubmissionsResult.error
        );
      }
      if (linkmeMissingInfoResult.error) {
        console.error(
          '[useSidebarCounts] linkmeMissingInfo error:',
          linkmeMissingInfoResult.error
        );
      }

      setCounts({
        stockAlerts: stockAlertsResult.error
          ? 0
          : ((stockAlertsResult.data as number | null) ?? 0),
        consultations: getCount(consultationsResult),
        linkmePending: getCount(linkmeP),
        productsIncomplete: getCount(productsResult),
        ordersPending: getCount(ordersResult),
        expeditionsPending: getCount(expeditionsResult),
        transactionsUnreconciled: getCount(transactionsResult),
        linkmeApprovals: getCount(linkmeApprovalsResult),
        formSubmissions: getCount(formSubmissionsResult),
        linkmeMissingInfo: getCount(linkmeMissingInfoResult),
      });
    } catch (err) {
      console.error('[useSidebarCounts] Unexpected error:', err);
      // Pas de setCounts(ZERO_COUNTS) ici — conserver les valeurs précédentes
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /**
   * Setup Realtime — 7 canaux regroupés par table source.
   * Chaque changement déclenche un refetch global (fetchAllCounts).
   */
  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) {
        setCounts(ZERO_COUNTS);
        setLoading(false);
        return;
      }

      // Fetch initial
      void fetchAllCounts().catch((err: unknown) => {
        console.error('[useSidebarCounts] Initial fetch error:', err);
      });

      if (!enableRealtime) {
        // Mode polling uniquement
        if (pollingInterval > 0) {
          intervalRef.current = setInterval(() => {
            void fetchAllCounts().catch((err: unknown) => {
              console.error('[useSidebarCounts] Polling error:', err);
            });
          }, pollingInterval);
        }
        return;
      }

      // Flag pour ne logger l'erreur Realtime qu'une seule fois
      let realtimeWarned = false;
      const onChannelError = (channelName: string) => {
        if (!realtimeWarned) {
          realtimeWarned = true;
          console.warn(
            `[useSidebarCounts] Realtime unavailable (${channelName}) — fallback polling`
          );
          if (!intervalRef.current && pollingInterval > 0) {
            intervalRef.current = setInterval(() => {
              void fetchAllCounts().catch(() => {});
            }, pollingInterval);
          }
        }
      };

      // ─── Canal 1 : sales_orders ────────────────────────────────────────────
      // Couvre : ordersPending, expeditionsPending, linkmePending, linkmeApprovals
      channelSalesOrdersRef.current = supabase
        .channel('sidebar-sales-orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sales_orders' },
          () => {
            void fetchAllCounts().catch(() => {});
          }
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') {
            onChannelError('sales_orders');
          }
        });

      // ─── Canal 2 : client_consultations ───────────────────────────────────
      channelConsultationsRef.current = supabase
        .channel('sidebar-consultations')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'client_consultations' },
          () => {
            void fetchAllCounts().catch(() => {});
          }
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') onChannelError('consultations');
        });

      // ─── Canal 3 : bank_transactions ──────────────────────────────────────
      channelTransactionsRef.current = supabase
        .channel('sidebar-bank-transactions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bank_transactions' },
          () => {
            void fetchAllCounts().catch(() => {});
          }
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') onChannelError('bank_transactions');
        });

      // ─── Canal 4 : products ───────────────────────────────────────────────
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
          () => {
            void fetchAllCounts().catch(() => {});
          }
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') onChannelError('products');
        });

      // ─── Canal 5 : form_submissions ───────────────────────────────────────
      channelFormSubmissionsRef.current = supabase
        .channel('sidebar-form-submissions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'form_submissions' },
          () => {
            void fetchAllCounts().catch(() => {});
          }
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') onChannelError('form_submissions');
        });

      // ─── Canal 6 : linkme_info_requests ───────────────────────────────────
      channelLinkmeInfoRef.current = supabase
        .channel('sidebar-linkme-info-requests')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'linkme_info_requests' },
          () => {
            void fetchAllCounts().catch(() => {});
          }
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR')
            onChannelError('linkme_info_requests');
        });

      // ─── Canal 7 : stock_alerts_unified_view ──────────────────────────────
      channelStockAlertsRef.current = supabase
        .channel('sidebar-stock-alerts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'stock_alerts_unified_view' },
          () => {
            void fetchAllCounts().catch(() => {});
          }
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') onChannelError('stock_alerts');
        });
    };

    void setup().catch((err: unknown) => {
      console.error('[useSidebarCounts] Setup error:', err);
    });

    // Cleanup : fermer tous les canaux + intervalle polling
    return () => {
      isMounted = false;

      const channelsToRemove = [
        channelSalesOrdersRef,
        channelConsultationsRef,
        channelTransactionsRef,
        channelProductsRef,
        channelFormSubmissionsRef,
        channelLinkmeInfoRef,
        channelStockAlertsRef,
      ];

      for (const ref of channelsToRemove) {
        if (ref.current) {
          void supabase.removeChannel(ref.current).catch((err: unknown) => {
            console.warn('[useSidebarCounts] Channel cleanup error:', err);
          });
          ref.current = null;
        }
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [supabase, enableRealtime, pollingInterval, fetchAllCounts]);

  return {
    ...counts,
    loading,
    refetch: fetchAllCounts,
  };
}
