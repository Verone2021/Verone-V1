/**
 * Hook pour les métriques de revenus
 * FUTUR: Sera implémenté quand les tables "orders" et "invoices" existeront
 * Retourne des valeurs par défaut pour l'instant
 */

'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useRevenueMetrics() {
  const supabase = createClientComponentClient();

  const fetch = async () => {
    try {
      // TODO: Implémenter quand les tables financières seront créées
      // const { data: revenue, error } = await supabase
      //   .from('invoices')
      //   .select('amount, status, created_at')
      //   .eq('status', 'paid')
      //   .gte('created_at', startOfMonth);

      // Pour l'instant, on retourne des données simulées
      const mockData = {
        today: 3450.50,
        month: 45780.00,
        year: 567890.00,
        trend: 12.3,
        averageOrderValue: 1250.00,
      };

      // En mode développement, utiliser des données simulées
      if (process.env.NODE_ENV === 'development') {
        console.log('💰 useRevenueMetrics: Utilisation de données simulées (tables financières non disponibles)');
        return mockData;
      }

      // En production, retourner des valeurs vides
      return {
        today: 0,
        month: 0,
        year: 0,
        trend: 0,
        averageOrderValue: 0,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques de revenus:', error);
      return {
        today: 0,
        month: 0,
        year: 0,
        trend: 0,
        averageOrderValue: 0,
      };
    }
  };

  return { fetch };
}