'use client';

/**
 * Hook : compte les mails entrants non-lus (table email_messages).
 *
 * Utilisé par l'icône enveloppe du header (BO-MSG-018) pour afficher
 * un badge de compteur sur la messagerie centrale.
 *
 * Implémentation : TanStack Query (staleTime 5 min, refetch au retour
 * sur l'onglet). email_messages n'est pas publiée dans Supabase Realtime
 * → pas d'abonnement Realtime, pas de polling.
 */

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

const UNREAD_MAILS_QUERY_KEY = ['email_messages', 'unread_count'] as const;

export function useUnreadMailsCount(): number {
  const { data = 0 } = useQuery({
    queryKey: UNREAD_MAILS_QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const { count, error } = await supabase
        .from('email_messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) {
        console.error('[useUnreadMailsCount] error:', error);
        return 0;
      }
      return count ?? 0;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  return data;
}
