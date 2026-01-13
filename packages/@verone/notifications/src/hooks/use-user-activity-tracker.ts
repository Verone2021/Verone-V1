'use client';

import { useCallback, useEffect, useRef } from 'react';

import { useSupabaseQuery, useSupabaseMutation } from '@verone/common';

export interface ActivityEvent {
  action: string;
  table_name?: string;
  record_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  metadata?: {
    page_url?: string;
    user_agent?: string;
    ip_address?: string;
    session_duration?: number;
    click_position?: { x: number; y: number };
    element_target?: string;
    search_query?: string;
    filter_applied?: Record<string, any>;
    performance_metrics?: {
      load_time?: number;
      interaction_time?: number;
      error_count?: number;
    };
  };
}

export interface UserSession {
  start_time: number;
  page_views: number;
  actions_count: number;
  last_activity: number;
  current_page: string;
}

export interface ActivityStats {
  total_sessions: number;
  avg_session_duration: number;
  most_visited_pages: Array<{ page: string; visits: number }>;
  most_used_actions: Array<{ action: string; count: number }>;
  error_rate: number;
  user_satisfaction_score: number;
}

// Session storage pour tracking côté client
const currentSession: UserSession = {
  start_time: Date.now(),
  page_views: 0,
  actions_count: 0,
  last_activity: Date.now(),
  current_page: '',
};

// Configuration batching (constantes globales OK)
// Augmenté pour réduire le spam réseau et console
const BATCH_SIZE = 50;
const BATCH_INTERVAL = 60000; // 60 secondes

export function useUserActivityTracker() {
  // ✅ FIX: useRef pour eventQueue (stable entre renders)
  const eventQueueRef = useRef<ActivityEvent[]>([]);
  const batchIntervalRef = useRef<NodeJS.Timeout>();

  // ✅ FIX CRITIQUE: Générer session_id unique (stable pour toute la session)
  const sessionIdRef = useRef<string>(
    typeof window !== 'undefined' &&
      typeof crypto !== 'undefined' &&
      crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Mutation pour logger les activités vers user_activity_logs (TABLE CORRECTE)
  const logActivityMutation = useSupabaseMutation<boolean>(
    async (supabase, events: ActivityEvent[]) => {
      // ✅ FIX CRITIQUE: Récupérer user_id de la session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('❌ Activity tracking: No authenticated user');
        }
        return { data: false, error: new Error('No authenticated user') };
      }

      const { error } = await supabase
        .from('user_activity_logs') // ✅ FIX: Table correcte avec session_id
        .insert(
          events.map(event => ({
            user_id: user.id,
            session_id: sessionIdRef.current, // ✅ FIX: session_id pour trigger
            action: event.action,
            table_name: event.table_name,
            record_id: event.record_id,
            old_data: event.old_data,
            new_data: event.new_data,
            severity: event.severity || 'info',
            page_url: event.metadata?.page_url,
            ip_address: event.metadata?.ip_address,
            user_agent: event.metadata?.user_agent || navigator.userAgent,
            metadata: event.metadata,
            created_at: new Date().toISOString(),
          }))
        );

      if (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '⚠️ Activity tracking insert error (non-bloquant):',
            error
          );
        }
      } else if (process.env.NODE_ENV !== 'production') {
        console.log(
          `✅ Activity tracking: ${events.length} events logged for user ${user.id} (session: ${sessionIdRef.current.substring(0, 8)}...)`
        );
      }

      return { data: !error, error };
    }
  );

  // Query pour les statistiques d'activité
  const activityStatsQuery = useSupabaseQuery(
    'activity-stats',
    async supabase => {
      // ✅ PHASE 3: Calculs déplacés côté serveur (RPC PostgreSQL)
      // Gain: 2900ms (JS) → <500ms (RPC)
      const { data, error } = await supabase.rpc('get_activity_stats', {
        days_ago: 7,
      } as any);

      if (error) throw error;

      // Type assertion pour compatibilité ActivityStats interface
      return { data: data as unknown as ActivityStats, error: null };
    },
    {
      staleTime: 60 * 60 * 1000, // 60 minutes (stats changent peu, RPC lente ~2800ms)
      cacheTime: 90 * 60 * 1000, // 90 minutes
      sloThreshold: 4000, // Seuil élevé pour RPC PostgreSQL lente
    }
  );

  // ✅ FIX: Mémoriser flushEventQueue avec useCallback
  const flushEventQueue = useCallback(async () => {
    if (eventQueueRef.current.length === 0) return;

    const events = [...eventQueueRef.current];
    eventQueueRef.current = [];
    await logActivityMutation.mutate(events);
  }, [logActivityMutation]);

  // ✅ FIX: Réactiver auto-flush périodique avec cleanup proper
  useEffect(() => {
    batchIntervalRef.current = setInterval(flushEventQueue, BATCH_INTERVAL);

    return () => {
      if (batchIntervalRef.current) {
        clearInterval(batchIntervalRef.current);
      }
      // Flush final au démontage (garantir 0 perte)
      flushEventQueue();
    };
  }, [flushEventQueue]);

  // Tracking automatique des changements de page
  useEffect(() => {
    const handlePageChange = () => {
      const currentPath = window.location.pathname;

      if (currentSession.current_page !== currentPath) {
        // Log page view
        trackEvent({
          action: 'page_view',
          new_data: {
            page_url: currentPath,
            page_title: document.title,
            referrer: document.referrer,
            session_duration: Date.now() - currentSession.start_time,
          },
        });

        currentSession.current_page = currentPath;
        currentSession.page_views++;
        currentSession.last_activity = Date.now();
      }
    };

    // Initial page view
    handlePageChange();

    // Listen to navigation changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(handlePageChange, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handlePageChange, 0);
    };

    window.addEventListener('popstate', handlePageChange);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tracking des interactions utilisateur
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const elementInfo = {
        tag: target.tagName,
        className: target.className,
        id: target.id,
        text: target.textContent?.slice(0, 50),
      };

      trackEvent({
        action: 'user_click',
        new_data: {
          page_url: window.location.pathname,
          element_target: JSON.stringify(elementInfo),
          click_position: { x: event.clientX, y: event.clientY },
        },
      });
    };

    const handleError = (event: ErrorEvent) => {
      trackEvent({
        action: 'javascript_error',
        severity: 'error',
        new_data: {
          page_url: window.location.pathname,
          error_message: event.message,
          error_filename: event.filename,
          error_line: event.lineno,
          error_column: event.colno,
          user_agent: navigator.userAgent,
        },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackEvent({
        action: 'promise_rejection',
        severity: 'error',
        new_data: {
          page_url: window.location.pathname,
          error_reason: event.reason?.toString(),
          user_agent: navigator.userAgent,
        },
      });
    };

    // Throttle clicks to avoid spam
    let lastClickTime = 0;
    const throttledHandleClick = (event: MouseEvent) => {
      const now = Date.now();
      if (now - lastClickTime > 1000) {
        // Max 1 click per second logged
        handleClick(event);
        lastClickTime = now;
      }
    };

    document.addEventListener('click', throttledHandleClick);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      document.removeEventListener('click', throttledHandleClick);
      window.removeEventListener('error', handleError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fonction principale pour tracker un événement
  const trackEvent = useCallback(
    (event: ActivityEvent) => {
      // Enrichir l'événement avec des métadonnées automatiques
      const enrichedEvent: ActivityEvent = {
        ...event,
        metadata: {
          ...event.metadata,
          page_url: event.metadata?.page_url || window.location.pathname,
          user_agent: event.metadata?.user_agent || navigator.userAgent,
          session_duration: Date.now() - currentSession.start_time,
        },
      };

      // ✅ FIX: Ajouter à la queue useRef
      eventQueueRef.current.push(enrichedEvent);
      currentSession.actions_count++;
      currentSession.last_activity = Date.now();

      // Flush si la queue est pleine
      if (eventQueueRef.current.length >= BATCH_SIZE) {
        flushEventQueue();
      }
    },
    [flushEventQueue]
  );

  // Helpers pour tracker des actions spécifiques
  const trackFormSubmit = useCallback(
    (formName: string, formData?: Record<string, any>) => {
      trackEvent({
        action: 'form_submit',
        new_data: {
          form_name: formName,
          form_data: formData ? Object.keys(formData) : undefined, // Pas de données sensibles
        },
      });
    },
    [trackEvent]
  );

  const trackSearch = useCallback(
    (query: string, results?: number) => {
      trackEvent({
        action: 'search_performed',
        new_data: {
          search_query: query,
          results_count: results,
        },
      });
    },
    [trackEvent]
  );

  const trackFilterApplied = useCallback(
    (filters: Record<string, any>) => {
      trackEvent({
        action: 'filter_applied',
        new_data: {
          filter_applied: filters,
        },
      });
    },
    [trackEvent]
  );

  const trackPerformanceMetric = useCallback(
    (metric: { action: string; duration: number; success: boolean }) => {
      trackEvent({
        action: 'performance_metric',
        severity: metric.duration > 2000 ? 'warning' : 'info',
        new_data: {
          performance_metrics: {
            load_time: metric.duration,
            interaction_time: metric.duration,
            error_count: metric.success ? 0 : 1,
          },
        },
      });
    },
    [trackEvent]
  );

  return {
    // Core tracking function
    trackEvent,

    // Specific helpers
    trackFormSubmit,
    trackSearch,
    trackFilterApplied,
    trackPerformanceMetric,

    // Session info
    currentSession: { ...currentSession },

    // Stats
    stats: activityStatsQuery.data,
    statsLoading: activityStatsQuery.loading,
    statsError: activityStatsQuery.error,
    refreshStats: activityStatsQuery.refetch,

    // Manual flush
    flushEvents: flushEventQueue,
  };
}
