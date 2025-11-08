/**
 * 📊 Hook - Métriques Stock & Commandes Dashboard
 *
 * Récupère les métriques calculées par Supabase :
 * - Valeur Stock (€)
 * - Commandes Achat (nombre)
 * - CA du Mois (€)
 * - Produits à Sourcer (nombre)
 *
 * Utilisé par le dashboard principal pour remplacer les données mockées.
 */

import { useEffect, useState } from 'react';

export interface StockOrdersMetrics {
  stock_value: number;
  purchase_orders_count: number;
  month_revenue: number;
  products_to_source: number;
}

interface UseStockOrdersMetricsReturn {
  metrics: StockOrdersMetrics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStockOrdersMetrics(): UseStockOrdersMetricsReturn {
  const [metrics, setMetrics] = useState<StockOrdersMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/stock-orders-metrics');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Erreur lors du chargement des métriques'
        );
      }

      setMetrics(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Erreur useStockOrdersMetrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}
