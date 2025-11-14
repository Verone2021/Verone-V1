import { useState, useEffect, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

/**
 * Hook léger pour compter les alertes stock actives
 * Utilisé par la sidebar pour afficher les badges
 */
export function useStockAlertsCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  // ✅ Singleton déjà mémorisé - pas besoin de useMemo
  const supabase = createClient();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        // Utiliser RPC au lieu de vue (bypass RLS avec SECURITY DEFINER)
        const { data: alertCount, error } = (await supabase.rpc(
          'get_stock_alerts_count'
        )) as any;

        if (error) {
          console.error('Erreur comptage alertes:', error);
          setCount(0);
        } else {
          setCount(alertCount || 0);
        }
      } catch (err) {
        console.error('Erreur comptage alertes:', err);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [supabase]);

  return { count, loading };
}
