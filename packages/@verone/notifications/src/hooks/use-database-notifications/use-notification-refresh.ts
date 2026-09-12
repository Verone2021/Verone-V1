'use client';

import { useEffect, useRef } from 'react';

import { usePathname } from 'next/navigation';

/** Deux rechargements d'une même cloche sont espacés d'au moins 10 s. */
const MIN_REFRESH_INTERVAL_MS = 10_000;

/**
 * Recharge les notifications au montage, au changement de page et au retour
 * sur l'onglet.
 *
 * La table `notifications` n'est pas publiée en temps réel : l'ancien
 * abonnement échouait à chaque ouverture. Décision Roméo du 2026-09-12
 * (option b) : pas de publication, pas d'interrogation périodique.
 */
export function useNotificationRefresh(
  loadNotifications: () => Promise<void>
): void {
  const pathname = usePathname();
  const loadRef = useRef(loadNotifications);
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    loadRef.current = loadNotifications;
  }, [loadNotifications]);

  useEffect(() => {
    const refresh = () => {
      const now = Date.now();
      if (now - lastRefreshAtRef.current < MIN_REFRESH_INTERVAL_MS) return;
      lastRefreshAtRef.current = now;
      void loadRef.current().catch((err: unknown) => {
        console.error('[useDatabaseNotifications] Refresh error:', err);
      });
    };

    refresh();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pathname]);
}
