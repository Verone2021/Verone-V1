'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Retourne une fonction d'invalidation TanStack Query avec anti-rebond (2 s).
 * Chaque appel reporte l'invalidation de 2 secondes — les rafales d'événements
 * Realtime déclenchent un seul refetch.
 * Le timer est nettoyé automatiquement au démontage du composant.
 *
 * Usage interne au package @verone/notifications.
 * Ne pas exporter depuis l'index public.
 */
export function useDebouncedInvalidate(
  queryKey: readonly unknown[]
): () => void {
  const queryClient = useQueryClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void queryClient.invalidateQueries({ queryKey }).catch(() => {});
    }, 2_000);
  }, [queryClient, queryKey]);
}
