'use client';

import { useState, useEffect, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

/**
 * Retourne le nombre de photos en attente de validation (review_status = 'pending_review').
 * Utilisé par la sidebar pour afficher un badge d'alerte.
 */
export function useMediaAssetsPendingCount(): number {
  const [count, setCount] = useState(0);
  // useMemo pour stabiliser l'instance supabase (évite boucle infinie useEffect)
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;
    void supabase
      .from('media_assets')
      .select('id', { count: 'exact', head: true })
      .eq('review_status', 'pending_review')
      .is('archived_at', null)
      .then(({ count: c }) => {
        if (!cancelled) setCount(c ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return count;
}
