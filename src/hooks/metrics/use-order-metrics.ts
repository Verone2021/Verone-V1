/**
 * Hook pour les métriques de commandes
 * FUTUR: Sera implémenté quand la table "orders" existera
 * Retourne des valeurs par défaut pour l'instant
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';

export function useOrderMetrics() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetch = async () => {
    try {
      // TODO: Implémenter quand la table "orders" sera créée
      // const { data: orders, error } = await supabase
      //   .from('orders')
      //   .select('id, status, customer_id, total_amount, created_at')
      //   .gte('created_at', last30Days);

      // Pour l'instant, on retourne des données simulées pour montrer
      // la structure attendue et permettre le développement de l'UI
      const mockData = {
        pending: 12,
        processing: 8,
        completed: 45,
        cancelled: 3,
        trend: 15.5,
        recentOrders: [
          {
            id: 'ORD-001',
            customer: 'Client Example 1',
            amount: 1250.00,
            status: 'pending',
          },
          {
            id: 'ORD-002',
            customer: 'Client Example 2',
            amount: 890.50,
            status: 'processing',
          },
          {
            id: 'ORD-003',
            customer: 'Client Example 3',
            amount: 2100.00,
            status: 'completed',
          },
        ],
      };

      // En mode développement, on peut retourner des données mock
      if (process.env.NODE_ENV === 'development') {
        console.log('📦 useOrderMetrics: Utilisation de données simulées (table orders non disponible)');
        return mockData;
      }

      // En production, retourner des valeurs vides
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
        trend: 0,
        recentOrders: [],
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques de commandes:', error);
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
        trend: 0,
        recentOrders: [],
      };
    }
  };

  return { fetch };
}