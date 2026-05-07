'use client';

/**
 * Hook : compte les mails entrants non-lus (table email_messages).
 *
 * Utilisé par l'icône enveloppe du header (BO-MSG-018) pour afficher
 * un badge de compteur sur la messagerie centrale.
 *
 * Polling 30s + écoute realtime pour rafraîchir.
 */

import { useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

const POLLING_INTERVAL_MS = 30_000;

export function useUnreadMailsCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const fetchCount = async () => {
      const { count: c, error } = await supabase
        .from('email_messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) {
        console.error('[useUnreadMailsCount] error:', error);
        return;
      }
      setCount(c ?? 0);
    };

    void fetchCount().catch((err: unknown) => {
      console.error('[useUnreadMailsCount] fetchCount initial error:', err);
    });

    const interval = setInterval(() => {
      void fetchCount().catch((err: unknown) => {
        console.error('[useUnreadMailsCount] fetchCount error:', err);
      });
    }, POLLING_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return count;
}
